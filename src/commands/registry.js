import { resolvePath, displayPath } from "../utils/path.js";

// Command registry. Kept close to original behavior for easy maintenance.
export function buildCommands(fs, setFs, cwd, setCwd, addOutput, historyList) {
  const getNode = (p) => fs[p] || null;

  const cmds = {
    help() {
      const list = [
        [
          "Navigation",
          [
            ["ls [-la] [path]", "List directory"],
            ["cd [path]", "Change dir"],
            ["pwd", "Print cwd"],
            ["find <dir> -name <pat>", "Search files"],
            ["tree [path]", "Tree view"],
          ],
        ],
        [
          "Files",
          [
            ["cat <file>", "Show contents"],
            ["head/tail [-n] <f>", "First/last lines"],
            ["touch <file>", "Create file"],
            ["mkdir [-p] <dir>", "Make directory"],
            ["rm [-r] <path>", "Remove"],
            ["cp <src> <dst>", "Copy"],
            ["mv <src> <dst>", "Move/rename"],
            ["nano <file>", "Edit file (basic)"],
            ["wc [-l] <f>", "Count lines/words"],
          ],
        ],
        [
          "Text Processing",
          [
            ["grep [-in] <pat> <f>", "Search in file"],
            ["sort [-r] <f>", "Sort lines"],
            ["uniq <f>", "Remove duplicates"],
            ["cut -d: -f1 <f>", "Cut columns"],
            ["awk '{print $1}' <f>", "Process text"],
            ["sed 's/a/b/' <f>", "Stream editor"],
            ["echo <text>", "Print text"],
          ],
        ],
        [
          "System",
          [
            ["whoami / id", "User info"],
            ["uname [-a]", "Kernel info"],
            ["hostname", "Print hostname"],
            ["uptime", "System uptime"],
            ["date", "Date & time"],
            ["ps [aux]", "Processes"],
            ["kill <pid>", "Kill process"],
            ["env", "Environment vars"],
            ["export VAR=val", "Set env var"],
            ["history", "Command history"],
            ["clear", "Clear screen"],
            ["sudo <cmd>", "Run as root"],
          ],
        ],
        [
          "Disk & Memory",
          [
            ["df [-h]", "Disk usage"],
            ["free [-h]", "Memory usage"],
            ["du [-sh] <path>", "Dir size"],
            ["mount", "Show mounts"],
          ],
        ],
        [
          "Network",
          [
            ["ifconfig", "Network interfaces"],
            ["ip addr/route", "IP info"],
            ["ping <host>", "Ping"],
            ["netstat -tuln", "Open ports"],
            ["ss -tuln", "Socket stats"],
            ["arp -a", "ARP table"],
            ["route", "Routing table"],
          ],
        ],
        [
          "Kali Tools",
          [
            ["nmap <target>", "Network scan"],
            ["nc <host> <port>", "Netcat"],
            ["wget/curl <url>", "Download/HTTP"],
            ["ssh <user@host>", "SSH"],
            ["john <file>", "Password crack"],
            ["hydra <opts>", "Brute force"],
            ["aircrack-ng", "WiFi cracking"],
          ],
        ],
        [
          "User Mgmt",
          [
            ["useradd <user>", "Add user"],
            ["passwd [user]", "Set password"],
            ["su [user]", "Switch user"],
            ["chmod <mode> <f>", "Permissions"],
            ["chown <u> <f>", "Ownership"],
            ["file <path>", "File type"],
            ["which <cmd>", "Find command"],
          ],
        ],
      ];
      addOutput({
        type: "banner",
        text: "┌─ KALI LINUX — AVAILABLE COMMANDS ──────────────────────┐",
      });
      for (const [section, entries] of list) {
        addOutput({ type: "section", text: `  ${section}` });
        for (const [cmd, desc] of entries)
          addOutput({ type: "helprow", cmd: cmd.padEnd(32), desc });
      }
      addOutput({
        type: "dim",
        text: "└────────────────────────────────────────────────────────┘",
      });
    },

    ls(args) {
      const flags = args.filter((a) => a.startsWith("-")).join("");
      const paths = args.filter((a) => !a.startsWith("-"));
      const target = paths.length ? resolvePath(cwd, paths[0]) : cwd;
      const node = getNode(target);
      if (!node)
        return addOutput({
          type: "error",
          text: `ls: cannot access '${paths[0] || target}': No such file or directory`,
        });
      if (node.type === "file")
        return addOutput({ type: "output", text: target.split("/").pop() });
      const showAll = flags.includes("a");
      const long = flags.includes("l");
      const items = (node.children || []).filter(
        (c) => showAll || !c.startsWith("."),
      );

      if (long) {
        addOutput({ type: "dim", text: `total ${items.length * 4}` });
        for (const item of items) {
          const full = target.replace(/\/+$/, "") + "/" + item;
          const n = getNode(full);
          const isDir = n?.type === "dir";
          addOutput({
            type: "ls-long",
            perm: isDir ? "drwxr-xr-x" : "-rw-r--r--",
            item,
            isDir,
            size: isDir ? "4096" : String(n?.content?.length || 0),
            date: "Mar 31 10:00",
          });
        }
      } else {
        addOutput({
          type: "ls-grid",
          items: items.map((item) => {
            const full = target.replace(/\/+$/, "") + "/" + item;
            const n = getNode(full);
            return {
              name: item,
              isDir: n?.type === "dir",
              isExe: n?.content === "[binary]",
            };
          }),
        });
      }
    },

    cd(args) {
      const pathArg = args.find((a) => !a.startsWith("-"));
      const target = pathArg ? resolvePath(cwd, pathArg) : "/root";
      const node = getNode(target);
      if (!node)
        return addOutput({
          type: "error",
          text: `cd: ${pathArg || target}: No such file or directory`,
        });
      if (node.type !== "dir")
        return addOutput({
          type: "error",
          text: `cd: ${pathArg || target}: Not a directory`,
        });
      setCwd(target);
    },

    pwd() {
      addOutput({ type: "output", text: cwd });
    },

    tree(args) {
      const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
      function walk(p, prefix) {
        const node = getNode(p);
        if (!node || node.type !== "dir") return;
        const children = node.children || [];
        children.forEach((child, i) => {
          const last = i === children.length - 1;
          const full = p.replace(/\/+$/, "") + "/" + child;
          const n = getNode(full);
          addOutput({
            type: n?.type === "dir" ? "dir" : "output",
            text:
              prefix +
              (last ? "└── " : "├── ") +
              child +
              (n?.type === "dir" ? "/" : ""),
          });
          if (n?.type === "dir") walk(full, prefix + (last ? "    " : "│   "));
        });
      }
      addOutput({
        type: "dir",
        text: displayPath(target) === "~" ? "." : displayPath(target),
      });
      walk(target, "");
    },

    cat(args) {
      if (!args.length)
        return addOutput({ type: "error", text: "cat: missing operand" });
      for (const arg of args) {
        const p = resolvePath(cwd, arg);
        const node = getNode(p);
        if (!node) {
          addOutput({
            type: "error",
            text: `cat: ${arg}: No such file or directory`,
          });
          continue;
        }
        if (node.type === "dir") {
          addOutput({ type: "error", text: `cat: ${arg}: Is a directory` });
          continue;
        }
        if (node.content === "[binary]") {
          addOutput({ type: "warn", text: `cat: ${arg}: binary file` });
          continue;
        }
        node.content
          .split("\n")
          .forEach((l) => addOutput({ type: "output", text: l }));
      }
    },

    head(args) {
      let n = 10;
      const files = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-n" && args[i + 1]) n = parseInt(args[++i], 10) || 10;
        else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1), 10);
        else files.push(args[i]);
      }
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) {
          addOutput({ type: "error", text: `head: ${f}: No such file` });
          continue;
        }
        node.content
          .split("\n")
          .slice(0, n)
          .forEach((l) => addOutput({ type: "output", text: l }));
      }
    },

    tail(args) {
      let n = 10;
      const files = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-n" && args[i + 1]) n = parseInt(args[++i], 10) || 10;
        else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1), 10);
        else files.push(args[i]);
      }
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) {
          addOutput({ type: "error", text: `tail: ${f}: No such file` });
          continue;
        }
        const lines = node.content.split("\n");
        lines
          .slice(Math.max(0, lines.length - n))
          .forEach((l) => addOutput({ type: "output", text: l }));
      }
    },

    echo(args) {
      const env2 = {
        USER: "root",
        HOME: "/root",
        SHELL: "/bin/bash",
        TERM: "xterm-256color",
        HOSTNAME: "kali",
      };
      addOutput({
        type: "output",
        text: args.join(" ").replace(/\$([A-Z_]+)/g, (_, v) => env2[v] || ""),
      });
    },

    touch(args) {
      if (!args.length)
        return addOutput({
          type: "error",
          text: "touch: missing file operand",
        });
      const newFs = { ...fs };
      for (const arg of args) {
        const p = resolvePath(cwd, arg);
        if (!newFs[p]) {
          const parent = p.substring(0, p.lastIndexOf("/")) || "/";
          const name = p.split("/").pop();
          if (!newFs[parent]) {
            addOutput({
              type: "error",
              text: `touch: '${arg}': No such directory`,
            });
            continue;
          }
          newFs[parent] = {
            ...newFs[parent],
            children: [...(newFs[parent].children || []), name],
          };
          newFs[p] = { type: "file", content: "" };
        }
      }
      setFs(newFs);
    },

    mkdir(args) {
      if (!args.length)
        return addOutput({ type: "error", text: "mkdir: missing operand" });

      const useParents = args.some((a) => a.startsWith("-") && a.includes("p"));
      const targets = args.filter((a) => !a.startsWith("-"));
      if (!targets.length)
        return addOutput({ type: "error", text: "mkdir: missing operand" });

      const newFs = { ...fs };

      const createDirPath = (fullPath) => {
        const parts = fullPath.split("/").filter(Boolean);
        let cur = "/";
        for (const part of parts) {
          const next = cur === "/" ? `/${part}` : `${cur}/${part}`;
          const existing = newFs[next];
          if (existing) {
            if (existing.type !== "dir") return false;
          } else {
            const parent = cur;
            const parentNode = newFs[parent];
            if (!parentNode || parentNode.type !== "dir") return false;
            if (!(parentNode.children || []).includes(part)) {
              newFs[parent] = {
                ...parentNode,
                children: [...(parentNode.children || []), part],
              };
            }
            newFs[next] = { type: "dir", children: [] };
          }
          cur = next;
        }
        return true;
      };

      for (const arg of targets) {
        const p = resolvePath(cwd, arg);

        if (useParents) {
          const ok = createDirPath(p);
          if (!ok) {
            addOutput({
              type: "error",
              text: `mkdir: cannot create '${arg}': No such directory`,
            });
          }
          continue;
        }

        if (newFs[p]) {
          addOutput({
            type: "error",
            text: `mkdir: cannot create '${arg}': File exists`,
          });
          continue;
        }
        const parent = p.substring(0, p.lastIndexOf("/")) || "/";
        const name = p.split("/").pop();
        if (!newFs[parent]) {
          addOutput({
            type: "error",
            text: `mkdir: cannot create '${arg}': No such directory`,
          });
          continue;
        }
        newFs[parent] = {
          ...newFs[parent],
          children: [...(newFs[parent].children || []), name],
        };
        newFs[p] = { type: "dir", children: [] };
      }
      setFs(newFs);
    },

    rm(args) {
      const recursive = args.some((a) => a.startsWith("-") && a.includes("r"));
      const targets = args.filter((a) => !a.startsWith("-"));
      if (!targets.length)
        return addOutput({ type: "error", text: "rm: missing operand" });
      const newFs = { ...fs };
      for (const arg of targets) {
        const p = resolvePath(cwd, arg);
        const node = newFs[p];
        if (!node) {
          addOutput({
            type: "error",
            text: `rm: cannot remove '${arg}': No such file or directory`,
          });
          continue;
        }
        if (node.type === "dir" && !recursive) {
          addOutput({
            type: "error",
            text: `rm: cannot remove '${arg}': Is a directory`,
          });
          continue;
        }
        const parent = p.substring(0, p.lastIndexOf("/")) || "/";
        const name = p.split("/").pop();
        newFs[parent] = {
          ...newFs[parent],
          children: (newFs[parent].children || []).filter((c) => c !== name),
        };
        const toDelete = Object.keys(newFs).filter(
          (k) => k === p || k.startsWith(p + "/"),
        );
        toDelete.forEach((k) => delete newFs[k]);
      }
      setFs(newFs);
    },

    cp(args) {
      const paths = args.filter((a) => !a.startsWith("-"));
      if (paths.length < 2)
        return addOutput({ type: "error", text: "cp: missing destination" });
      const src = resolvePath(cwd, paths[0]);
      const dst = resolvePath(cwd, paths[1]);
      const srcNode = getNode(src);
      if (!srcNode)
        return addOutput({
          type: "error",
          text: `cp: '${paths[0]}': No such file`,
        });
      const newFs = { ...fs };
      let finalDst = dst;
      if (newFs[dst]?.type === "dir")
        finalDst = dst.replace(/\/+$/, "") + "/" + src.split("/").pop();
      const parent = finalDst.substring(0, finalDst.lastIndexOf("/")) || "/";
      const name = finalDst.split("/").pop();
      if (!newFs[parent])
        return addOutput({
          type: "error",
          text: "cp: target directory not found",
        });
      if (!newFs[parent].children.includes(name))
        newFs[parent] = {
          ...newFs[parent],
          children: [...newFs[parent].children, name],
        };
      newFs[finalDst] = JSON.parse(JSON.stringify(srcNode));
      setFs(newFs);
    },

    mv(args) {
      const paths = args.filter((a) => !a.startsWith("-"));
      if (paths.length < 2)
        return addOutput({ type: "error", text: "mv: missing destination" });
      const src = resolvePath(cwd, paths[0]);
      const dst = resolvePath(cwd, paths[1]);
      const srcNode = getNode(src);
      if (!srcNode)
        return addOutput({
          type: "error",
          text: `mv: '${paths[0]}': No such file`,
        });
      const newFs = { ...fs };
      let finalDst = dst;
      if (newFs[dst]?.type === "dir")
        finalDst = dst.replace(/\/+$/, "") + "/" + src.split("/").pop();
      const srcParent = src.substring(0, src.lastIndexOf("/")) || "/";
      const srcName = src.split("/").pop();
      const dstParent = finalDst.substring(0, finalDst.lastIndexOf("/")) || "/";
      const dstName = finalDst.split("/").pop();
      newFs[srcParent] = {
        ...newFs[srcParent],
        children: newFs[srcParent].children.filter((c) => c !== srcName),
      };
      if (newFs[dstParent] && !newFs[dstParent].children.includes(dstName))
        newFs[dstParent] = {
          ...newFs[dstParent],
          children: [...newFs[dstParent].children, dstName],
        };
      newFs[finalDst] = srcNode;
      delete newFs[src];
      setFs(newFs);
    },

    nano(args) {
      if (!args.length)
        return addOutput({ type: "error", text: "nano: no file specified" });
      const p = resolvePath(cwd, args[0]);
      const node = getNode(p);
      addOutput({
        type: "info",
        text: `[nano] Opening '${args[0]}' — (simulated, read-only view)`,
      });
      if (node?.content && node.content !== "[binary]") {
        addOutput({ type: "dim", text: "─".repeat(50) });
        node.content
          .split("\n")
          .forEach((l) => addOutput({ type: "output", text: l }));
        addOutput({ type: "dim", text: "─".repeat(50) });
      } else addOutput({ type: "dim", text: "(empty file)" });
      addOutput({
        type: "dim",
        text: "^X Exit  ^O Write  ^W Search  ^K Cut  ^U Paste",
      });
    },

    grep(args) {
      const flags = args.filter((a) => a.startsWith("-")).join("");
      const rest = args.filter((a) => !a.startsWith("-"));
      if (rest.length < 2)
        return addOutput({
          type: "error",
          text: "grep: usage: grep [opts] PATTERN FILE",
        });
      const [pattern, ...files] = rest;
      const regex = new RegExp(pattern, flags.includes("i") ? "gi" : "g");
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) {
          addOutput({ type: "error", text: `grep: ${f}: No such file` });
          continue;
        }
        if (node.type === "dir") {
          addOutput({ type: "error", text: `grep: ${f}: Is a directory` });
          continue;
        }
        node.content.split("\n").forEach((l, i) => {
          if (regex.test(l))
            addOutput({
              type: "success",
              text: flags.includes("n") ? `${i + 1}:${l}` : l,
            });
          regex.lastIndex = 0;
        });
      }
    },

    find(args) {
      let dir = ".";
      let namePattern = null;
      let type = null;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-name" && args[i + 1])
          namePattern = args[++i].replace(/\*/g, ".*");
        else if (args[i] === "-type" && args[i + 1]) type = args[++i];
        else if (!args[i].startsWith("-")) dir = args[i];
      }
      const base = resolvePath(cwd, dir);
      const walk = (p) => {
        const node = getNode(p);
        if (!node) return;
        const name = p.split("/").pop() || "/";
        const matchName =
          !namePattern || new RegExp("^" + namePattern + "$").test(name);
        const matchType =
          !type ||
          (type === "f" && node.type === "file") ||
          (type === "d" && node.type === "dir");
        if (matchName && matchType)
          addOutput({
            type: "output",
            text: p.replace(base, dir === "." ? "." : dir),
          });
        if (node.type === "dir")
          (node.children || []).forEach((c) =>
            walk(p.replace(/\/+$/, "") + "/" + c),
          );
      };
      walk(base);
    },

    sort(args) {
      const reverse = args.some((a) => a.includes("r") && a.startsWith("-"));
      const files = args.filter((a) => !a.startsWith("-"));
      if (!files.length) return;
      const node = getNode(resolvePath(cwd, files[0]));
      if (!node)
        return addOutput({
          type: "error",
          text: `sort: ${files[0]}: No such file`,
        });
      const lines = node.content.split("\n").filter(Boolean).sort();
      (reverse ? lines.reverse() : lines).forEach((l) =>
        addOutput({ type: "output", text: l }),
      );
    },

    uniq(args) {
      const files = args.filter((a) => !a.startsWith("-"));
      if (!files.length) return;
      const node = getNode(resolvePath(cwd, files[0]));
      if (!node)
        return addOutput({
          type: "error",
          text: `uniq: ${files[0]}: No such file`,
        });
      const lines = node.content.split("\n").filter(Boolean);
      lines
        .filter((l, i) => i === 0 || l !== lines[i - 1])
        .forEach((l) => addOutput({ type: "output", text: l }));
    },

    cut(args) {
      let delim = "\t";
      let fields = [0];
      const files = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-d" && args[i + 1]) delim = args[++i];
        else if (args[i] === "-f" && args[i + 1])
          fields = args[++i].split(",").map((n) => parseInt(n, 10) - 1);
        else if (!args[i].startsWith("-")) files.push(args[i]);
        else if (args[i].startsWith("-d")) delim = args[i].slice(2);
        else if (args[i].startsWith("-f"))
          fields = args[i]
            .slice(2)
            .split(",")
            .map((n) => parseInt(n, 10) - 1);
      }
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) {
          addOutput({ type: "error", text: `cut: ${f}: No such file` });
          continue;
        }
        node.content
          .split("\n")
          .filter(Boolean)
          .forEach((l) => {
            const parts = l.split(delim);
            addOutput({
              type: "output",
              text: fields.map((fi) => parts[fi] || "").join(delim),
            });
          });
      }
    },

    awk(args) {
      const files = args.filter(
        (a) => !a.startsWith("{") && !a.endsWith("}") && !a.startsWith("-"),
      );
      const prog = args.find(
        (a) =>
          a.startsWith("{") ||
          (args.indexOf(a) > 0 && args[args.indexOf(a) - 1] !== "-F"),
      );
      addOutput({
        type: "info",
        text: `[awk] Simulated. Program: ${prog || "none"}`,
      });
      for (const f of files.slice(-1)) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) {
          addOutput({ type: "error", text: `awk: ${f}: No such file` });
          continue;
        }
        node.content
          .split("\n")
          .filter(Boolean)
          .forEach((l) =>
            addOutput({ type: "output", text: l.split(/\s+/)[0] || "" }),
          );
      }
    },

    sed(args) {
      const expr = args.find((a) => a.includes("/"));
      const file = args.filter(
        (a) => !a.startsWith("-") && !a.includes("/"),
      )[0];
      if (!expr || !file)
        return addOutput({
          type: "error",
          text: "sed: usage: sed 's/from/to/' file",
        });
      const match = expr.match(/^s\/(.*?)\/(.*?)\/(.*)$/);
      if (!match)
        return addOutput({ type: "error", text: "sed: invalid substitution" });
      const [, from, to, flags2] = match;
      const node = getNode(resolvePath(cwd, file));
      if (!node)
        return addOutput({ type: "error", text: `sed: ${file}: No such file` });
      const re = new RegExp(from, flags2.includes("g") ? "g" : "");
      node.content
        .split("\n")
        .forEach((l) => addOutput({ type: "output", text: l.replace(re, to) }));
    },

    wc(args) {
      const countL = args.includes("-l");
      const countW = args.includes("-w");
      const countC = args.includes("-c");
      const files = args.filter((a) => !a.startsWith("-"));
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) {
          addOutput({ type: "error", text: `wc: ${f}: No such file` });
          continue;
        }
        const lines = node.content.split("\n").length - 1;
        const words = node.content.split(/\s+/).filter(Boolean).length;
        const chars = node.content.length;
        if (countL)
          addOutput({
            type: "output",
            text: `${String(lines).padStart(7)} ${f}`,
          });
        else if (countW)
          addOutput({
            type: "output",
            text: `${String(words).padStart(7)} ${f}`,
          });
        else if (countC)
          addOutput({
            type: "output",
            text: `${String(chars).padStart(7)} ${f}`,
          });
        else
          addOutput({
            type: "output",
            text: `${String(lines).padStart(7)} ${String(words).padStart(7)} ${String(chars).padStart(7)} ${f}`,
          });
      }
    },

    whoami() {
      addOutput({ type: "output", text: "root" });
    },
    id() {
      addOutput({
        type: "output",
        text: "uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),133(netdev)",
      });
    },
    uname(args) {
      addOutput({
        type: "output",
        text: args.includes("-a")
          ? "Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 x86_64 GNU/Linux"
          : "Linux",
      });
    },
    hostname() {
      addOutput({ type: "output", text: "kali" });
    },
    uptime() {
      const h = 2;
      const m = 34;
      addOutput({
        type: "output",
        text: ` ${new Date().toLocaleTimeString()} up ${h}:${String(m).padStart(2, "0")},  1 user,  load average: 0.08, 0.04, 0.01`,
      });
    },
    date() {
      addOutput({ type: "output", text: new Date().toString() });
    },

    ps(args) {
      const aux = args.join("").includes("aux") || args.join("").includes("a");
      if (aux) {
        addOutput({
          type: "dim",
          text: "USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND",
        });
        [
          [
            "root",
            "1",
            "0.0",
            "0.1",
            "22540",
            "1832",
            "?",
            "Ss",
            "10:00",
            "0:01",
            "/sbin/init",
          ],
          [
            "root",
            "234",
            "0.0",
            "0.2",
            "15432",
            "2048",
            "?",
            "Ss",
            "10:00",
            "0:00",
            "/usr/sbin/sshd",
          ],
          [
            "root",
            "512",
            "0.1",
            "0.5",
            "52432",
            "4096",
            "pts/0",
            "Ss",
            "10:05",
            "0:00",
            "/bin/bash",
          ],
          [
            "root",
            "891",
            "0.0",
            "0.1",
            "9564",
            "1024",
            "pts/0",
            "R+",
            "10:15",
            "0:00",
            "ps aux",
          ],
        ].forEach((row) =>
          addOutput({
            type: "output",
            text:
              row[0].padEnd(13) +
              row[1].padStart(5) +
              " " +
              row[2].padStart(4) +
              " " +
              row[3].padStart(4) +
              " " +
              row[4].padStart(6) +
              " " +
              row[5].padStart(6) +
              " " +
              row[6].padEnd(9) +
              row[7].padEnd(5) +
              row[8].padEnd(8) +
              row[9].padEnd(7) +
              row[10],
          }),
        );
      } else {
        addOutput({ type: "dim", text: "  PID TTY          TIME CMD" });
        addOutput({ type: "output", text: "  512 pts/0    00:00:00 bash" });
        addOutput({ type: "output", text: "  891 pts/0    00:00:00 ps" });
      }
    },

    kill(args) {
      if (!args.length)
        return addOutput({
          type: "error",
          text: "kill: usage: kill [-9] <pid>",
        });
      const pid = args.find((a) => !a.startsWith("-"));
      if (pid === "1")
        return addOutput({
          type: "error",
          text: "kill: (1) Operation not permitted",
        });
      addOutput({ type: "output", text: "" });
    },

    df(args) {
      const h = args.includes("-h");
      addOutput({
        type: "dim",
        text: "Filesystem      Size  Used Avail Use% Mounted on",
      });
      addOutput({
        type: "output",
        text: `/dev/sda1       ${h ? "50G" : "52428800"}  ${h ? "15G" : "15728640"} ${h ? "35G" : "36700160"}  30% /`,
      });
      addOutput({
        type: "output",
        text: `tmpfs           ${h ? "4.0G" : "4194304"}     0 ${h ? "4.0G" : "4194304"}   0% /dev/shm`,
      });
      addOutput({
        type: "output",
        text: `/dev/sda2       ${h ? "500M" : "512000"}  ${h ? "120M" : "122880"} ${h ? "380M" : "389120"}  24% /boot`,
      });
    },

    free(args) {
      const h = args.includes("-h");
      addOutput({
        type: "dim",
        text: "              total        used        free      shared  buff/cache   available",
      });
      addOutput({
        type: "output",
        text: `Mem:      ${h ? "  7.8Gi" : "8192000"}   ${h ? "  2.5Gi" : "2621440"}   ${h ? "  4.2Gi" : "4456448"}   ${h ? " 256Mi" : "262144"}   ${h ? "  1.1Gi" : "1114112"}   ${h ? "  4.9Gi" : "5111808"}`,
      });
      addOutput({
        type: "output",
        text: `Swap:     ${h ? "  2.0Gi" : "2097152"}        0   ${h ? "  2.0Gi" : "2097152"}`,
      });
    },

    du(args) {
      const h = args.includes("-h") || args.includes("-sh");
      const target = args.find((a) => !a.startsWith("-")) || ".";
      const p = resolvePath(cwd, target);
      const node = getNode(p);
      if (!node)
        return addOutput({
          type: "error",
          text: `du: '${target}': No such file`,
        });
      addOutput({ type: "output", text: `${h ? "4.0K" : "4096"}\t${target}` });
    },

    mount() {
      addOutput({
        type: "output",
        text: "sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)",
      });
      addOutput({
        type: "output",
        text: "/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)",
      });
      addOutput({
        type: "output",
        text: "tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime)",
      });
    },

    env() {
      const vars = {
        USER: "root",
        HOME: "/root",
        SHELL: "/bin/bash",
        TERM: "xterm-256color",
        HOSTNAME: "kali",
        PATH: "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        PWD: cwd,
        LANG: "en_US.UTF-8",
      };
      Object.entries(vars).forEach(([k, v]) =>
        addOutput({ type: "output", text: `${k}=${v}` }),
      );
    },

    export(args) {
      if (!args.length)
        return addOutput({ type: "warn", text: 'declare -x USER="root"' });
      addOutput({ type: "dim", text: `export: ${args.join(" ")} (simulated)` });
    },

    history() {
      historyList.forEach((cmd, i) =>
        addOutput({
          type: "output",
          text: `  ${String(i + 1).padStart(4)}  ${cmd}`,
        }),
      );
    },

    clear() {
      addOutput({ type: "clear" });
    },

    ifconfig() {
      [
        "eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
        "        inet 192.168.1.50  netmask 255.255.255.0  broadcast 192.168.1.255",
        "        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>",
        "        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)",
        "        RX packets 4523  bytes 2134921 (2.1 MB)",
        "        TX packets 3211  bytes 984721 (984.7 KB)",
        "",
        "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536",
        "        inet 127.0.0.1  netmask 255.0.0.0",
        "        inet6 ::1  prefixlen 128  scopeid 0x10<host>",
      ].forEach((l) => addOutput({ type: "output", text: l }));
    },

    ip(args) {
      const sub = args[0];
      if (sub === "addr" || sub === "a") {
        addOutput({
          type: "output",
          text: "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN",
        });
        addOutput({
          type: "dim",
          text: "    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00",
        });
        addOutput({
          type: "success",
          text: "    inet 127.0.0.1/8 scope host lo",
        });
        addOutput({
          type: "output",
          text: "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP",
        });
        addOutput({
          type: "dim",
          text: "    link/ether 08:00:27:4e:66:a1 brd ff:ff:ff:ff:ff:ff",
        });
        addOutput({
          type: "success",
          text: "    inet 192.168.1.50/24 brd 192.168.1.255 scope global eth0",
        });
      } else if (sub === "route" || sub === "r") {
        addOutput({
          type: "output",
          text: "default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.50 metric 100",
        });
        addOutput({
          type: "output",
          text: "192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50",
        });
      } else addOutput({ type: "warn", text: "Usage: ip [addr|route]" });
    },

    netstat() {
      addOutput({
        type: "dim",
        text: "Active Internet connections (only servers)",
      });
      addOutput({
        type: "dim",
        text: "Proto Recv-Q Send-Q Local Address           Foreign Address         State",
      });
      addOutput({
        type: "output",
        text: "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN",
      });
      addOutput({
        type: "output",
        text: "tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN",
      });
      addOutput({
        type: "output",
        text: "tcp6       0      0 :::22                   :::*                    LISTEN",
      });
    },

    ss() {
      addOutput({
        type: "dim",
        text: "Netid  State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port",
      });
      addOutput({
        type: "output",
        text: "tcp    LISTEN  0       128          0.0.0.0:22          0.0.0.0:*",
      });
      addOutput({
        type: "output",
        text: "tcp    LISTEN  0       128          0.0.0.0:80          0.0.0.0:*",
      });
    },

    arp() {
      addOutput({
        type: "dim",
        text: "Address                  HWtype  HWaddress           Flags Mask  Iface",
      });
      addOutput({
        type: "output",
        text: "192.168.1.1              ether   aa:bb:cc:dd:ee:01   C           eth0",
      });
      addOutput({
        type: "output",
        text: "192.168.1.100            ether   aa:bb:cc:dd:ee:64   C           eth0",
      });
    },

    route() {
      addOutput({ type: "dim", text: "Kernel IP routing table" });
      addOutput({
        type: "dim",
        text: "Destination     Gateway         Genmask         Flags Metric Ref    Use Iface",
      });
      addOutput({
        type: "output",
        text: "0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0",
      });
      addOutput({
        type: "output",
        text: "192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0",
      });
    },

    ping(args) {
      const host = args.find((a) => !a.startsWith("-")) || "127.0.0.1";
      addOutput({
        type: "output",
        text: `PING ${host} (${host === "localhost" ? "127.0.0.1" : host}): 56 data bytes`,
      });
      let i = 0;
      const iv = setInterval(() => {
        const ms = (Math.random() * 10 + 1).toFixed(3);
        addOutput({
          type: "success",
          text: `64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${ms} ms`,
        });
        if (++i >= 4) {
          clearInterval(iv);
          addOutput({
            type: "output",
            text: `--- ${host} ping statistics ---`,
          });
          addOutput({
            type: "success",
            text: "4 packets transmitted, 4 received, 0% packet loss",
          });
        }
      }, 350);
    },

    nmap(args) {
      const target = args.find((a) => !a.startsWith("-")) || "192.168.1.1";
      addOutput({
        type: "info",
        text: `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleString()}`,
      });
      addOutput({ type: "output", text: `Nmap scan report for ${target}` });
      setTimeout(() => {
        addOutput({ type: "success", text: "Host is up (0.0043s latency)." });
        addOutput({ type: "output", text: "" });
        addOutput({ type: "dim", text: "PORT     STATE SERVICE      VERSION" });
        [
          ["22/tcp", "open", "ssh", "OpenSSH 9.0p1"],
          ["80/tcp", "open", "http", "Apache 2.4.54"],
          ["443/tcp", "open", "https", "Apache 2.4.54"],
          ["3306/tcp", "open", "mysql", "MySQL 8.0.30"],
          ["8080/tcp", "filtered", "http-proxy", ""],
        ].forEach(([p, s, svc, v]) =>
          addOutput({
            type: "nmap-row",
            port: p,
            state: s,
            service: svc,
            version: v,
          }),
        );
        addOutput({ type: "output", text: "" });
        addOutput({
          type: "dim",
          text: "Nmap done: 1 IP address (1 host up) scanned in 2.14 seconds",
        });
      }, 600);
    },

    nc(args) {
      const host = args.find(
        (a) => !a.startsWith("-") && Number.isNaN(Number(a)),
      );
      const port = args.find((a) => !Number.isNaN(Number(a)) && a.length > 0);
      if (!host || !port)
        return addOutput({
          type: "error",
          text: "nc: usage: nc [-options] hostname port",
        });
      addOutput({
        type: "success",
        text: `(UNKNOWN) [${host}] ${port} (?) open`,
      });
      addOutput({
        type: "dim",
        text: "[nc] Connection established (simulated). Type Ctrl+C to exit.",
      });
    },

    wget(args) {
      const url = args.find((a) => !a.startsWith("-"));
      if (!url) return addOutput({ type: "error", text: "wget: missing URL" });
      addOutput({
        type: "output",
        text: `--${new Date().toISOString().slice(0, 19).replace("T", " ")}--  ${url}`,
      });
      addOutput({ type: "output", text: "Resolving host... done." });
      setTimeout(() => {
        addOutput({
          type: "output",
          text: "Connecting to host:80... connected.",
        });
        addOutput({
          type: "success",
          text: "HTTP request sent, awaiting response... 200 OK",
        });
        addOutput({
          type: "success",
          text: "Download complete: index.html [simulated]",
        });
      }, 400);
    },

    curl(args) {
      const url = args.find((a) => !a.startsWith("-"));
      if (!url)
        return addOutput({ type: "error", text: "curl: try 'curl --help'" });
      addOutput({ type: "dim", text: `* Connecting to ${url}...` });
      setTimeout(() => {
        addOutput({ type: "success", text: "< HTTP/1.1 200 OK" });
        addOutput({
          type: "dim",
          text: "< Content-Type: text/html; charset=utf-8",
        });
        addOutput({ type: "output", text: "" });
        addOutput({
          type: "output",
          text: "<html><body><h1>Simulated Response</h1></body></html>",
        });
      }, 300);
    },

    ssh(args) {
      const target = args.find((a) => !a.startsWith("-"));
      if (!target)
        return addOutput({
          type: "error",
          text: "ssh: usage: ssh [user@]hostname",
        });
      addOutput({
        type: "warn",
        text: `The authenticity of host '${target.split("@").pop()}' can't be established.`,
      });
      addOutput({
        type: "warn",
        text: "RSA key fingerprint is SHA256:abc123def456...",
      });
      addOutput({
        type: "success",
        text: `[simulated] Connected to ${target}`,
      });
    },

    sudo(args) {
      if (!args.length)
        return addOutput({ type: "error", text: "sudo: usage: sudo command" });
    },

    useradd(args) {
      const name = args.find((a) => !a.startsWith("-"));
      if (!name)
        return addOutput({
          type: "error",
          text: "useradd: no username specified",
        });
      addOutput({
        type: "success",
        text: `useradd: user '${name}' created (simulated)`,
      });
    },

    passwd() {
      addOutput({ type: "output", text: "New password: " });
      addOutput({ type: "output", text: "Retype new password: " });
      addOutput({
        type: "success",
        text: "passwd: password updated successfully",
      });
    },

    su(args) {
      const user = args[0] || "root";
      addOutput({
        type: "info",
        text: `Switching to user '${user}' (simulated). Already running as root.`,
      });
    },

    chmod(args) {
      const paths2 = args.filter((a) => !a.startsWith("-"));
      if (paths2.length < 2)
        return addOutput({ type: "error", text: "chmod: missing operand" });
      if (!getNode(resolvePath(cwd, paths2[1])))
        return addOutput({
          type: "error",
          text: `chmod: '${paths2[1]}': No such file`,
        });
    },

    chown(args) {
      const paths2 = args.filter((a) => !a.startsWith("-"));
      if (paths2.length < 2)
        return addOutput({ type: "error", text: "chown: missing operand" });
    },

    file(args) {
      for (const arg of args) {
        const p = resolvePath(cwd, arg);
        const node = getNode(p);
        if (!node) {
          addOutput({
            type: "error",
            text: `${arg}: ERROR: No such file or directory`,
          });
          continue;
        }
        addOutput({
          type: "output",
          text: `${arg}: ${node.type === "dir" ? "directory" : node.content === "[binary]" ? "ELF 64-bit LSB executable, x86-64" : "ASCII text"}`,
        });
      }
    },

    which(args) {
      const known = {
        bash: "/bin/bash",
        ls: "/bin/ls",
        cat: "/bin/cat",
        grep: "/bin/grep",
        find: "/usr/bin/find",
        nmap: "/usr/bin/nmap",
        python3: "/usr/bin/python3",
        curl: "/usr/bin/curl",
        wget: "/usr/bin/wget",
        john: "/usr/bin/john",
        hydra: "/usr/bin/hydra",
        ssh: "/usr/bin/ssh",
        whoami: "/usr/bin/whoami",
        id: "/usr/bin/id",
      };
      for (const cmd of args) {
        if (known[cmd]) addOutput({ type: "output", text: known[cmd] });
        else addOutput({ type: "error", text: `${cmd} not found` });
      }
    },

    john(args) {
      const file = args.find((a) => !a.startsWith("-"));
      addOutput({
        type: "info",
        text: "John the Ripper 1.9.0-jumbo-1+bleeding-aec1328d6c",
      });
      if (!file)
        return addOutput({
          type: "error",
          text: "john: no password files specified",
        });
      addOutput({
        type: "output",
        text: "Using default input encoding: UTF-8",
      });
      addOutput({
        type: "output",
        text: "Loaded 3 password hashes with 3 different salts (sha512crypt, $6$)",
      });
      setTimeout(
        () => addOutput({ type: "success", text: "toor             (root)" }),
        500,
      );
      setTimeout(
        () => addOutput({ type: "success", text: "kali             (kali)" }),
        900,
      );
      setTimeout(
        () =>
          addOutput({
            type: "warn",
            text: "2 password hashes cracked, 1 left",
          }),
        1100,
      );
    },

    hydra() {
      addOutput({
        type: "info",
        text: "Hydra v9.4 (c) 2022 by van Hauser/THC & David Maciejak",
      });
      addOutput({
        type: "warn",
        text: "[simulated] Starting brute force attack...",
      });
      setTimeout(
        () =>
          addOutput({
            type: "success",
            text: "[22][ssh] host: 192.168.1.100   login: root   password: toor",
          }),
        800,
      );
      setTimeout(
        () =>
          addOutput({
            type: "success",
            text: "1 of 1 target successfully completed, 1 valid password found",
          }),
        1000,
      );
    },

    exit() {
      addOutput({ type: "dim", text: "logout" });
      addOutput({ type: "dim", text: "Connection to kali closed." });
    },
  };

  return cmds;
}
