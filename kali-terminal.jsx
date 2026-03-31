import { useState, useEffect, useRef, useCallback } from "react";

// ─── FILESYSTEM ────────────────────────────────────────────────────────────────
const buildFS = () => ({
  "/": { type: "dir", children: ["home", "root", "etc", "var", "tmp", "usr", "bin", "dev", "proc"] },
  "/home": { type: "dir", children: ["kali"] },
  "/home/kali": { type: "dir", children: ["Desktop", "Documents", "Downloads", ".bashrc"] },
  "/home/kali/Desktop": { type: "dir", children: [] },
  "/home/kali/Documents": { type: "dir", children: ["notes.txt", "readme.md"] },
  "/home/kali/Documents/notes.txt": { type: "file", content: "Remember to patch systems.\nHack the planet.\n" },
  "/home/kali/Documents/readme.md": { type: "file", content: "# Kali Linux Simulator\n\nWelcome to the Kali Linux terminal simulator.\nType `help` to see all commands.\n" },
  "/home/kali/Downloads": { type: "dir", children: [] },
  "/home/kali/.bashrc": { type: "file", content: "# ~/.bashrc\nexport TERM=xterm-256color\nexport EDITOR=nano\n" },
  "/root": { type: "dir", children: ["Desktop", "Documents", "tools", ".bashrc", ".profile"] },
  "/root/Desktop": { type: "dir", children: ["README.txt"] },
  "/root/Desktop/README.txt": { type: "file", content: "Welcome to Kali Linux Simulator!\n\nThis is a sandboxed environment.\nType 'help' for available commands.\n\nHappy hacking!\n" },
  "/root/Documents": { type: "dir", children: ["targets.txt", "wordlist.txt", "report.txt"] },
  "/root/Documents/targets.txt": { type: "file", content: "192.168.1.1\n192.168.1.100\n10.0.0.1\n172.16.0.5\n" },
  "/root/Documents/wordlist.txt": { type: "file", content: "admin\npassword\n123456\nroot\ntoor\nkali\nletmein\nqwerty\nmaster\ndragon\n" },
  "/root/Documents/report.txt": { type: "file", content: "Penetration Test Report\n========================\nDate: 2024-03-31\nTarget: 192.168.1.0/24\n\nFindings:\n- Port 22 (SSH) open on 192.168.1.100\n- Port 80 (HTTP) open on 192.168.1.100\n- Weak credentials found: admin/admin\n" },
  "/root/tools": { type: "dir", children: ["exploit.py", "scanner.sh"] },
  "/root/tools/exploit.py": { type: "file", content: "#!/usr/bin/env python3\n# Basic port scanner\nimport socket\n\ntarget = '192.168.1.100'\nfor port in range(20, 1025):\n    s = socket.socket()\n    s.settimeout(0.5)\n    if s.connect_ex((target, port)) == 0:\n        print(f'Port {port} is open')\n    s.close()\n" },
  "/root/tools/scanner.sh": { type: "file", content: "#!/bin/bash\n# Quick network scanner\nfor i in $(seq 1 254); do\n  ping -c1 -W1 192.168.1.$i &>/dev/null && echo \"192.168.1.$i is up\"\ndone\n" },
  "/root/.bashrc": { type: "file", content: "# ~/.bashrc\nexport PATH='/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'\nexport TERM=xterm-256color\nexport HISTSIZE=1000\nalias ll='ls -la'\nalias la='ls -A'\nalias grep='grep --color=auto'\n" },
  "/root/.profile": { type: "file", content: "# ~/.profile\nif [ -n \"$BASH_VERSION\" ]; then\n  [ -f \"$HOME/.bashrc\" ] && . \"$HOME/.bashrc\"\nfi\n" },
  "/etc": { type: "dir", children: ["passwd", "shadow", "hosts", "hostname", "os-release", "network", "apt"] },
  "/etc/passwd": { type: "file", content: "root:x:0:0:root:/root:/bin/bash\nkali:x:1000:1000:Kali,,,:/home/kali:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\n" },
  "/etc/shadow": { type: "file", content: "root:$6$rounds=656000$kali$abc123:18765:0:99999:7:::\nkali:$6$rounds=656000$kali$def456:18765:0:99999:7:::\n" },
  "/etc/hosts": { type: "file", content: "127.0.0.1\tlocalhost\n127.0.1.1\tkali\n::1\t\tlocalhost ip6-localhost\n192.168.1.100\ttarget.local\n192.168.1.1\tgateway.local\n" },
  "/etc/hostname": { type: "file", content: "kali\n" },
  "/etc/os-release": { type: "file", content: 'NAME="Kali GNU/Linux"\nVERSION="2024.1"\nID=kali\nID_LIKE=debian\nPRETTY_NAME="Kali GNU/Linux 2024.1 (Rolling)"\nVERSION_ID="2024.1"\nHOME_URL="https://www.kali.org/"\nSUPPORT_URL="https://bugs.kali.org/"\n' },
  "/etc/network": { type: "dir", children: ["interfaces"] },
  "/etc/network/interfaces": { type: "file", content: "auto lo\niface lo inet loopback\n\nauto eth0\niface eth0 inet dhcp\n" },
  "/etc/apt": { type: "dir", children: ["sources.list"] },
  "/etc/apt/sources.list": { type: "file", content: "deb http://http.kali.org/kali kali-rolling main contrib non-free non-free-firmware\n" },
  "/var": { type: "dir", children: ["log", "www", "tmp"] },
  "/var/log": { type: "dir", children: ["syslog", "auth.log", "kern.log"] },
  "/var/log/syslog": { type: "file", content: "Mar 31 10:00:01 kali kernel: Linux version 6.6.9-amd64\nMar 31 10:00:02 kali systemd[1]: Starting system...\nMar 31 10:00:05 kali sshd[1234]: Server listening on 0.0.0.0 port 22\nMar 31 10:05:12 kali kernel: eth0: renamed from veth3a2f1b\n" },
  "/var/log/auth.log": { type: "file", content: "Mar 31 10:15:32 kali sshd[2341]: Accepted password for root from 192.168.1.50\nMar 31 10:16:00 kali sudo: root : TTY=pts/0\nMar 31 10:20:11 kali sshd[2891]: Failed password for admin from 192.168.1.200\n" },
  "/var/log/kern.log": { type: "file", content: "Mar 31 10:00:01 kali kernel: [0.000000] Linux version 6.6.9-amd64\nMar 31 10:00:01 kali kernel: [0.000000] BIOS-provided physical RAM map\nMar 31 10:00:01 kali kernel: [0.004000] ACPI: IRQ0 used by override\n" },
  "/var/www": { type: "dir", children: ["html"] },
  "/var/www/html": { type: "dir", children: ["index.html"] },
  "/var/www/html/index.html": { type: "file", content: "<!DOCTYPE html>\n<html>\n<head><title>Apache2 Default Page</title></head>\n<body><h1>It works!</h1></body>\n</html>\n" },
  "/var/tmp": { type: "dir", children: [] },
  "/tmp": { type: "dir", children: [] },
  "/usr": { type: "dir", children: ["bin", "share", "local"] },
  "/usr/bin": { type: "dir", children: ["nmap", "python3", "curl", "wget", "john", "hydra", "metasploit", "aircrack-ng", "burpsuite", "wireshark"] },
  "/usr/bin/nmap": { type: "file", content: "[binary]" },
  "/usr/bin/python3": { type: "file", content: "[binary]" },
  "/usr/bin/curl": { type: "file", content: "[binary]" },
  "/usr/bin/wget": { type: "file", content: "[binary]" },
  "/usr/bin/john": { type: "file", content: "[binary]" },
  "/usr/bin/hydra": { type: "file", content: "[binary]" },
  "/usr/bin/metasploit": { type: "file", content: "[binary]" },
  "/usr/bin/aircrack-ng": { type: "file", content: "[binary]" },
  "/usr/bin/burpsuite": { type: "file", content: "[binary]" },
  "/usr/bin/wireshark": { type: "file", content: "[binary]" },
  "/usr/share": { type: "dir", children: ["wordlists", "nmap"] },
  "/usr/share/wordlists": { type: "dir", children: ["rockyou.txt"] },
  "/usr/share/wordlists/rockyou.txt": { type: "file", content: "password\n123456\n12345678\nqwerty\nabc123\nmonkey\n1234567\nletmein\ntrusted\ndragon\nmaster\nsunshine\nprincess\nwelcome\nshadow\n" },
  "/usr/share/nmap": { type: "dir", children: ["scripts"] },
  "/usr/share/nmap/scripts": { type: "dir", children: [] },
  "/usr/local": { type: "dir", children: ["bin", "share"] },
  "/usr/local/bin": { type: "dir", children: [] },
  "/usr/local/share": { type: "dir", children: [] },
  "/bin": { type: "dir", children: ["bash", "sh", "ls", "cat", "cp", "mv", "rm", "mkdir", "echo", "grep", "find"] },
  "/dev": { type: "dir", children: ["null", "zero", "tty", "sda", "sda1"] },
  "/dev/null": { type: "file", content: "" },
  "/dev/zero": { type: "file", content: "" },
  "/proc": { type: "dir", children: ["version", "cpuinfo", "meminfo", "net"] },
  "/proc/version": { type: "file", content: "Linux version 6.6.9-amd64 (devel@kali.org) (gcc version 13.2.0) #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2024-01-08)\n" },
  "/proc/cpuinfo": { type: "file", content: "processor\t: 0\nvendor_id\t: GenuineIntel\ncpu family\t: 6\nmodel name\t: Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz\ncpu MHz\t\t: 2600.000\ncache size\t: 12288 KB\nbogomips\t: 5200.00\n" },
  "/proc/meminfo": { type: "file", content: "MemTotal:\t 8192000 kB\nMemFree:\t 5234816 kB\nMemAvailable:\t 6298624 kB\nBuffers:\t  512000 kB\nCached:\t\t 1024000 kB\nSwapTotal:\t 2097152 kB\nSwapFree:\t 2097152 kB\n" },
  "/proc/net": { type: "dir", children: ["arp", "dev"] },
  "/proc/net/arp": { type: "file", content: "IP address       HW type     Flags       HW address            Mask     Device\n192.168.1.1      0x1         0x2         aa:bb:cc:dd:ee:01     *        eth0\n192.168.1.100    0x1         0x2         aa:bb:cc:dd:ee:64     *        eth0\n" },
  "/proc/net/dev": { type: "file", content: "Inter-|   Receive                                                |  Transmit\n face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets\n    lo:  123456    1000    0    0    0     0          0         0   123456    1000\n  eth0: 2134921    4523    0    0    0     0          0         0   984721    3211\n" },
});

// ─── HELPERS ───────────────────────────────────────────────────────────────────
function resolvePath(cwd, p) {
  if (!p || p === "~") return "/root";
  if (p.startsWith("~")) p = "/root" + p.slice(1);
  if (!p.startsWith("/")) p = cwd.replace(/\/+$/, "") + "/" + p;
  const parts = p.split("/").filter(Boolean);
  const resolved = [];
  for (const part of parts) {
    if (part === ".") continue;
    else if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return "/" + resolved.join("/");
}

function displayPath(cwd) {
  if (cwd === "/root") return "~";
  if (cwd.startsWith("/root/")) return "~" + cwd.slice(5);
  return cwd;
}

function tokenize(input) {
  const tokens = [];
  let current = "", inQuote = false, quoteChar = "";
  for (const ch of input) {
    if (inQuote) {
      if (ch === quoteChar) inQuote = false;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = true; quoteChar = ch;
    } else if (ch === " ") {
      if (current) { tokens.push(current); current = ""; }
    } else current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

// ─── COMMAND ENGINE ────────────────────────────────────────────────────────────
function buildCommands(fs, setFs, cwd, setCwd, addOutput, historyList) {
  const getNode = (p) => fs[p] || null;

  const cmds = {
    help() {
      const list = [
        ["Navigation", [["ls [-la] [path]","List directory"],["cd [path]","Change dir"],["pwd","Print cwd"],["find <dir> -name <pat>","Search files"],["tree [path]","Tree view"]]],
        ["Files", [["cat <file>","Show contents"],["head/tail [-n] <f>","First/last lines"],["touch <file>","Create file"],["mkdir [-p] <dir>","Make directory"],["rm [-r] <path>","Remove"],["cp <src> <dst>","Copy"],["mv <src> <dst>","Move/rename"],["nano <file>","Edit file (basic)"],["wc [-l] <f>","Count lines/words"]]],
        ["Text Processing", [["grep [-in] <pat> <f>","Search in file"],["sort [-r] <f>","Sort lines"],["uniq <f>","Remove duplicates"],["cut -d: -f1 <f>","Cut columns"],["awk '{print $1}' <f>","Process text"],["sed 's/a/b/' <f>","Stream editor"],["echo <text>","Print text"]]],
        ["System", [["whoami / id","User info"],["uname [-a]","Kernel info"],["hostname","Print hostname"],["uptime","System uptime"],["date","Date & time"],["ps [aux]","Processes"],["kill <pid>","Kill process"],["env","Environment vars"],["export VAR=val","Set env var"],["history","Command history"],["clear","Clear screen"],["sudo <cmd>","Run as root"]]],
        ["Disk & Memory", [["df [-h]","Disk usage"],["free [-h]","Memory usage"],["du [-sh] <path>","Dir size"],["mount","Show mounts"]]],
        ["Network", [["ifconfig","Network interfaces"],["ip addr/route","IP info"],["ping <host>","Ping"],["netstat -tuln","Open ports"],["ss -tuln","Socket stats"],["arp -a","ARP table"],["route","Routing table"]]],
        ["Kali Tools", [["nmap <target>","Network scan"],["nc <host> <port>","Netcat"],["wget/curl <url>","Download/HTTP"],["ssh <user@host>","SSH"],["john <file>","Password crack"],["hydra <opts>","Brute force"],["aircrack-ng","WiFi cracking"]]],
        ["User Mgmt", [["useradd <user>","Add user"],["passwd [user]","Set password"],["su [user]","Switch user"],["chmod <mode> <f>","Permissions"],["chown <u> <f>","Ownership"],["file <path>","File type"],["which <cmd>","Find command"]]],
      ];
      addOutput({ type: "banner", text: "┌─ KALI LINUX — AVAILABLE COMMANDS ──────────────────────┐" });
      for (const [section, entries] of list) {
        addOutput({ type: "section", text: `  ${section}` });
        for (const [cmd, desc] of entries) {
          addOutput({ type: "helprow", cmd: cmd.padEnd(32), desc });
        }
      }
      addOutput({ type: "dim", text: "└────────────────────────────────────────────────────────┘" });
    },

    ls(args) {
      const flags = args.filter(a => a.startsWith("-")).join("");
      const paths = args.filter(a => !a.startsWith("-"));
      const target = paths.length ? resolvePath(cwd, paths[0]) : cwd;
      const node = getNode(target);
      if (!node) return addOutput({ type: "error", text: `ls: cannot access '${paths[0] || target}': No such file or directory` });
      if (node.type === "file") return addOutput({ type: "output", text: target.split("/").pop() });

      const showAll = flags.includes("a");
      const long = flags.includes("l");
      const items = (node.children || []).filter(c => showAll || !c.startsWith("."));

      if (long) {
        addOutput({ type: "dim", text: `total ${items.length * 4}` });
        for (const item of items) {
          const full = target.replace(/\/+$/, "") + "/" + item;
          const n = getNode(full);
          const isDir = n?.type === "dir";
          const perm = isDir ? "drwxr-xr-x" : "-rw-r--r--";
          addOutput({ type: "ls-long", perm, item, isDir, size: isDir ? "4096" : String(n?.content?.length || 0), date: "Mar 31 10:00" });
        }
      } else {
        addOutput({ type: "ls-grid", items: items.map(item => {
          const full = target.replace(/\/+$/, "") + "/" + item;
          const n = getNode(full);
          return { name: item, isDir: n?.type === "dir", isExe: n?.content === "[binary]" };
        })});
      }
    },

    cd(args) {
      const target = args[0] ? resolvePath(cwd, args[0]) : "/root";
      const node = getNode(target);
      if (!node) return addOutput({ type: "error", text: `cd: ${args[0]}: No such file or directory` });
      if (node.type !== "dir") return addOutput({ type: "error", text: `cd: ${args[0]}: Not a directory` });
      setCwd(target);
    },

    pwd() { addOutput({ type: "output", text: cwd }); },

    tree(args) {
      const target = args[0] ? resolvePath(cwd, args[0]) : cwd;
      function walk(p, prefix) {
        const node = getNode(p);
        if (!node || node.type !== "dir") return;
        const children = (node.children || []);
        children.forEach((child, i) => {
          const last = i === children.length - 1;
          const connector = last ? "└── " : "├── ";
          const full = p.replace(/\/+$/, "") + "/" + child;
          const n = getNode(full);
          addOutput({ type: n?.type === "dir" ? "dir" : "output", text: prefix + connector + child + (n?.type === "dir" ? "/" : "") });
          if (n?.type === "dir") walk(full, prefix + (last ? "    " : "│   "));
        });
      }
      addOutput({ type: "dir", text: displayPath(target) === "~" ? "." : displayPath(target) });
      walk(target, "");
    },

    cat(args) {
      if (!args.length) return addOutput({ type: "error", text: "cat: missing operand" });
      for (const arg of args) {
        const p = resolvePath(cwd, arg);
        const node = getNode(p);
        if (!node) { addOutput({ type: "error", text: `cat: ${arg}: No such file or directory` }); continue; }
        if (node.type === "dir") { addOutput({ type: "error", text: `cat: ${arg}: Is a directory` }); continue; }
        if (node.content === "[binary]") { addOutput({ type: "warn", text: `cat: ${arg}: binary file` }); continue; }
        node.content.split("\n").forEach(l => addOutput({ type: "output", text: l }));
      }
    },

    head(args) {
      let n = 10; const files = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-n" && args[i+1]) { n = parseInt(args[++i]) || 10; }
        else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1));
        else files.push(args[i]);
      }
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) { addOutput({ type: "error", text: `head: ${f}: No such file` }); continue; }
        node.content.split("\n").slice(0, n).forEach(l => addOutput({ type: "output", text: l }));
      }
    },

    tail(args) {
      let n = 10; const files = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-n" && args[i+1]) { n = parseInt(args[++i]) || 10; }
        else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1));
        else files.push(args[i]);
      }
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) { addOutput({ type: "error", text: `tail: ${f}: No such file` }); continue; }
        const lines = node.content.split("\n");
        lines.slice(Math.max(0, lines.length - n)).forEach(l => addOutput({ type: "output", text: l }));
      }
    },

    echo(args) {
      const env2 = { USER: "root", HOME: "/root", SHELL: "/bin/bash", TERM: "xterm-256color", HOSTNAME: "kali" };
      const text = args.join(" ").replace(/\$([A-Z_]+)/g, (_, v) => env2[v] || "");
      addOutput({ type: "output", text });
    },

    touch(args) {
      if (!args.length) return addOutput({ type: "error", text: "touch: missing file operand" });
      const newFs = { ...fs };
      for (const arg of args) {
        const p = resolvePath(cwd, arg);
        if (!newFs[p]) {
          const parent = p.substring(0, p.lastIndexOf("/")) || "/";
          const name = p.split("/").pop();
          if (!newFs[parent]) { addOutput({ type: "error", text: `touch: '${arg}': No such directory` }); continue; }
          newFs[parent] = { ...newFs[parent], children: [...(newFs[parent].children || []), name] };
          newFs[p] = { type: "file", content: "" };
        }
      }
      setFs(newFs);
    },

    mkdir(args) {
      if (!args.length) return addOutput({ type: "error", text: "mkdir: missing operand" });
      const newFs = { ...fs };
      for (const arg of args.filter(a => !a.startsWith("-"))) {
        const p = resolvePath(cwd, arg);
        if (newFs[p]) { addOutput({ type: "error", text: `mkdir: cannot create '${arg}': File exists` }); continue; }
        const parent = p.substring(0, p.lastIndexOf("/")) || "/";
        const name = p.split("/").pop();
        if (!newFs[parent]) { addOutput({ type: "error", text: `mkdir: cannot create '${arg}': No such directory` }); continue; }
        newFs[parent] = { ...newFs[parent], children: [...(newFs[parent].children || []), name] };
        newFs[p] = { type: "dir", children: [] };
      }
      setFs(newFs);
    },

    rm(args) {
      const recursive = args.some(a => a.startsWith("-") && a.includes("r"));
      const targets = args.filter(a => !a.startsWith("-"));
      if (!targets.length) return addOutput({ type: "error", text: "rm: missing operand" });
      const newFs = { ...fs };
      for (const arg of targets) {
        const p = resolvePath(cwd, arg);
        const node = newFs[p];
        if (!node) { addOutput({ type: "error", text: `rm: cannot remove '${arg}': No such file or directory` }); continue; }
        if (node.type === "dir" && !recursive) { addOutput({ type: "error", text: `rm: cannot remove '${arg}': Is a directory` }); continue; }
        const parent = p.substring(0, p.lastIndexOf("/")) || "/";
        const name = p.split("/").pop();
        newFs[parent] = { ...newFs[parent], children: (newFs[parent].children || []).filter(c => c !== name) };
        const toDelete = Object.keys(newFs).filter(k => k === p || k.startsWith(p + "/"));
        toDelete.forEach(k => delete newFs[k]);
      }
      setFs(newFs);
    },

    cp(args) {
      const paths = args.filter(a => !a.startsWith("-"));
      if (paths.length < 2) return addOutput({ type: "error", text: "cp: missing destination" });
      const src = resolvePath(cwd, paths[0]), dst = resolvePath(cwd, paths[1]);
      const srcNode = getNode(src);
      if (!srcNode) return addOutput({ type: "error", text: `cp: '${paths[0]}': No such file` });
      const newFs = { ...fs };
      let finalDst = dst;
      if (newFs[dst]?.type === "dir") finalDst = dst.replace(/\/+$/, "") + "/" + src.split("/").pop();
      const parent = finalDst.substring(0, finalDst.lastIndexOf("/")) || "/";
      const name = finalDst.split("/").pop();
      if (!newFs[parent]) return addOutput({ type: "error", text: `cp: target directory not found` });
      if (!newFs[parent].children.includes(name)) newFs[parent] = { ...newFs[parent], children: [...newFs[parent].children, name] };
      newFs[finalDst] = JSON.parse(JSON.stringify(srcNode));
      setFs(newFs);
    },

    mv(args) {
      const paths = args.filter(a => !a.startsWith("-"));
      if (paths.length < 2) return addOutput({ type: "error", text: "mv: missing destination" });
      const src = resolvePath(cwd, paths[0]), dst = resolvePath(cwd, paths[1]);
      const srcNode = getNode(src);
      if (!srcNode) return addOutput({ type: "error", text: `mv: '${paths[0]}': No such file` });
      const newFs = { ...fs };
      let finalDst = dst;
      if (newFs[dst]?.type === "dir") finalDst = dst.replace(/\/+$/, "") + "/" + src.split("/").pop();
      const srcParent = src.substring(0, src.lastIndexOf("/")) || "/";
      const srcName = src.split("/").pop();
      const dstParent = finalDst.substring(0, finalDst.lastIndexOf("/")) || "/";
      const dstName = finalDst.split("/").pop();
      newFs[srcParent] = { ...newFs[srcParent], children: newFs[srcParent].children.filter(c => c !== srcName) };
      if (newFs[dstParent] && !newFs[dstParent].children.includes(dstName))
        newFs[dstParent] = { ...newFs[dstParent], children: [...newFs[dstParent].children, dstName] };
      newFs[finalDst] = srcNode;
      delete newFs[src];
      setFs(newFs);
    },

    nano(args) {
      if (!args.length) return addOutput({ type: "error", text: "nano: no file specified" });
      const p = resolvePath(cwd, args[0]);
      const node = getNode(p);
      addOutput({ type: "info", text: `[nano] Opening '${args[0]}' — (simulated, read-only view)` });
      if (node?.content && node.content !== "[binary]") {
        addOutput({ type: "dim", text: "─".repeat(50) });
        node.content.split("\n").forEach(l => addOutput({ type: "output", text: l }));
        addOutput({ type: "dim", text: "─".repeat(50) });
      } else {
        addOutput({ type: "dim", text: "(empty file)" });
      }
      addOutput({ type: "dim", text: "^X Exit  ^O Write  ^W Search  ^K Cut  ^U Paste" });
    },

    grep(args) {
      const flags = args.filter(a => a.startsWith("-")).join("");
      const rest = args.filter(a => !a.startsWith("-"));
      if (rest.length < 2) return addOutput({ type: "error", text: "grep: usage: grep [opts] PATTERN FILE" });
      const [pattern, ...files] = rest;
      const regex = new RegExp(pattern, flags.includes("i") ? "gi" : "g");
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) { addOutput({ type: "error", text: `grep: ${f}: No such file` }); continue; }
        if (node.type === "dir") { addOutput({ type: "error", text: `grep: ${f}: Is a directory` }); continue; }
        node.content.split("\n").forEach((l, i) => {
          if (regex.test(l)) addOutput({ type: "success", text: flags.includes("n") ? `${i + 1}:${l}` : l });
          regex.lastIndex = 0;
        });
      }
    },

    find(args) {
      let dir = ".", namePattern = null, type = null;
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-name" && args[i+1]) { namePattern = args[++i].replace(/\*/g, ".*"); }
        else if (args[i] === "-type" && args[i+1]) { type = args[++i]; }
        else if (!args[i].startsWith("-")) dir = args[i];
      }
      const base = resolvePath(cwd, dir);
      const walk = (p) => {
        const node = getNode(p);
        if (!node) return;
        const name = p.split("/").pop() || "/";
        const matchName = !namePattern || new RegExp("^" + namePattern + "$").test(name);
        const matchType = !type || (type === "f" && node.type === "file") || (type === "d" && node.type === "dir");
        if (matchName && matchType) addOutput({ type: "output", text: p.replace(base, dir === "." ? "." : dir) });
        if (node.type === "dir") (node.children || []).forEach(c => walk(p.replace(/\/+$/, "") + "/" + c));
      };
      walk(base);
    },

    sort(args) {
      const reverse = args.some(a => a.includes("r") && a.startsWith("-"));
      const files = args.filter(a => !a.startsWith("-"));
      if (!files.length) return;
      const node = getNode(resolvePath(cwd, files[0]));
      if (!node) return addOutput({ type: "error", text: `sort: ${files[0]}: No such file` });
      const lines = node.content.split("\n").filter(Boolean).sort();
      (reverse ? lines.reverse() : lines).forEach(l => addOutput({ type: "output", text: l }));
    },

    uniq(args) {
      const files = args.filter(a => !a.startsWith("-"));
      if (!files.length) return;
      const node = getNode(resolvePath(cwd, files[0]));
      if (!node) return addOutput({ type: "error", text: `uniq: ${files[0]}: No such file` });
      const lines = node.content.split("\n").filter(Boolean);
      lines.filter((l, i) => i === 0 || l !== lines[i - 1]).forEach(l => addOutput({ type: "output", text: l }));
    },

    cut(args) {
      let delim = "\t", fields = [0];
      const files = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === "-d" && args[i+1]) delim = args[++i];
        else if (args[i] === "-f" && args[i+1]) fields = args[++i].split(",").map(n => parseInt(n) - 1);
        else if (!args[i].startsWith("-")) files.push(args[i]);
        else if (args[i].startsWith("-d")) delim = args[i].slice(2);
        else if (args[i].startsWith("-f")) fields = args[i].slice(2).split(",").map(n => parseInt(n) - 1);
      }
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) { addOutput({ type: "error", text: `cut: ${f}: No such file` }); continue; }
        node.content.split("\n").filter(Boolean).forEach(l => {
          const parts = l.split(delim);
          addOutput({ type: "output", text: fields.map(fi => parts[fi] || "").join(delim) });
        });
      }
    },

    awk(args) {
      const files = args.filter(a => !a.startsWith("{") && !a.endsWith("}") && !a.startsWith("-"));
      const prog = args.find(a => a.startsWith("{") || (args.indexOf(a) > 0 && args[args.indexOf(a)-1] !== "-F"));
      addOutput({ type: "info", text: `[awk] Simulated. Program: ${prog || "none"}` });
      for (const f of files.slice(-1)) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) { addOutput({ type: "error", text: `awk: ${f}: No such file` }); continue; }
        node.content.split("\n").filter(Boolean).forEach(l => addOutput({ type: "output", text: l.split(/\s+/)[0] || "" }));
      }
    },

    sed(args) {
      const expr = args.find(a => a.includes("/"));
      const file = args.filter(a => !a.startsWith("-") && !a.includes("/"))[0];
      if (!expr || !file) return addOutput({ type: "error", text: "sed: usage: sed 's/from/to/' file" });
      const match = expr.match(/^s\/(.*?)\/(.*?)\/(.*)$/);
      if (!match) return addOutput({ type: "error", text: "sed: invalid substitution" });
      const [, from, to, flags2] = match;
      const node = getNode(resolvePath(cwd, file));
      if (!node) return addOutput({ type: "error", text: `sed: ${file}: No such file` });
      const re = new RegExp(from, flags2.includes("g") ? "g" : "");
      node.content.split("\n").forEach(l => addOutput({ type: "output", text: l.replace(re, to) }));
    },

    wc(args) {
      const countL = args.includes("-l"), countW = args.includes("-w"), countC = args.includes("-c");
      const files = args.filter(a => !a.startsWith("-"));
      for (const f of files) {
        const node = getNode(resolvePath(cwd, f));
        if (!node) { addOutput({ type: "error", text: `wc: ${f}: No such file` }); continue; }
        const lines = node.content.split("\n").length - 1;
        const words = node.content.split(/\s+/).filter(Boolean).length;
        const chars = node.content.length;
        if (countL) addOutput({ type: "output", text: `${String(lines).padStart(7)} ${f}` });
        else if (countW) addOutput({ type: "output", text: `${String(words).padStart(7)} ${f}` });
        else if (countC) addOutput({ type: "output", text: `${String(chars).padStart(7)} ${f}` });
        else addOutput({ type: "output", text: `${String(lines).padStart(7)} ${String(words).padStart(7)} ${String(chars).padStart(7)} ${f}` });
      }
    },

    whoami() { addOutput({ type: "output", text: "root" }); },
    id() { addOutput({ type: "output", text: "uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),133(netdev)" }); },
    uname(args) {
      addOutput({ type: "output", text: args.includes("-a") ? "Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 x86_64 GNU/Linux" : "Linux" });
    },
    hostname() { addOutput({ type: "output", text: "kali" }); },

    uptime() {
      const h = 2, m = 34;
      addOutput({ type: "output", text: ` ${new Date().toLocaleTimeString()} up ${h}:${String(m).padStart(2,"0")},  1 user,  load average: 0.08, 0.04, 0.01` });
    },
    date() { addOutput({ type: "output", text: new Date().toString() }); },

    ps(args) {
      const aux = args.join("").includes("aux") || args.join("").includes("a");
      if (aux) {
        addOutput({ type: "dim", text: "USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND" });
        [["root","1","0.0","0.1","22540","1832","?","Ss","10:00","0:01","/sbin/init"],
         ["root","234","0.0","0.2","15432","2048","?","Ss","10:00","0:00","/usr/sbin/sshd"],
         ["root","512","0.1","0.5","52432","4096","pts/0","Ss","10:05","0:00","/bin/bash"],
         ["root","891","0.0","0.1","9564","1024","pts/0","R+","10:15","0:00","ps aux"]
        ].forEach(row => addOutput({ type: "output", text: row[0].padEnd(13)+row[1].padStart(5)+" "+row[2].padStart(4)+" "+row[3].padStart(4)+" "+row[4].padStart(6)+" "+row[5].padStart(6)+" "+row[6].padEnd(9)+row[7].padEnd(5)+row[8].padEnd(8)+row[9].padEnd(7)+row[10] }));
      } else {
        addOutput({ type: "dim", text: "  PID TTY          TIME CMD" });
        addOutput({ type: "output", text: "  512 pts/0    00:00:00 bash" });
        addOutput({ type: "output", text: "  891 pts/0    00:00:00 ps" });
      }
    },

    kill(args) {
      if (!args.length) return addOutput({ type: "error", text: "kill: usage: kill [-9] <pid>" });
      const pid = args.find(a => !a.startsWith("-"));
      if (pid === "1") return addOutput({ type: "error", text: "kill: (1) Operation not permitted" });
      addOutput({ type: "output", text: `` });
    },

    df(args) {
      const h = args.includes("-h");
      addOutput({ type: "dim", text: "Filesystem      Size  Used Avail Use% Mounted on" });
      addOutput({ type: "output", text: `/dev/sda1       ${h?"50G":"52428800"}  ${h?"15G":"15728640"} ${h?"35G":"36700160"}  30% /` });
      addOutput({ type: "output", text: `tmpfs           ${h?"4.0G":"4194304"}     0 ${h?"4.0G":"4194304"}   0% /dev/shm` });
      addOutput({ type: "output", text: `/dev/sda2       ${h?"500M":"512000"}  ${h?"120M":"122880"} ${h?"380M":"389120"}  24% /boot` });
    },

    free(args) {
      const h = args.includes("-h");
      addOutput({ type: "dim", text: "              total        used        free      shared  buff/cache   available" });
      addOutput({ type: "output", text: `Mem:      ${h?"  7.8Gi":"8192000"}   ${h?"  2.5Gi":"2621440"}   ${h?"  4.2Gi":"4456448"}   ${h?" 256Mi":"262144"}   ${h?"  1.1Gi":"1114112"}   ${h?"  4.9Gi":"5111808"}` });
      addOutput({ type: "output", text: `Swap:     ${h?"  2.0Gi":"2097152"}        0   ${h?"  2.0Gi":"2097152"}` });
    },

    du(args) {
      const h = args.includes("-h") || args.includes("-sh");
      const target = args.find(a => !a.startsWith("-")) || ".";
      const p = resolvePath(cwd, target);
      const node = getNode(p);
      if (!node) return addOutput({ type: "error", text: `du: '${target}': No such file` });
      addOutput({ type: "output", text: `${h ? "4.0K" : "4096"}\t${target}` });
    },

    mount() {
      addOutput({ type: "output", text: "sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)" });
      addOutput({ type: "output", text: "/dev/sda1 on / type ext4 (rw,relatime,errors=remount-ro)" });
      addOutput({ type: "output", text: "tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime)" });
    },

    env() {
      const vars = { USER:"root", HOME:"/root", SHELL:"/bin/bash", TERM:"xterm-256color", HOSTNAME:"kali", PATH:"/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", PWD:cwd, LANG:"en_US.UTF-8" };
      Object.entries(vars).forEach(([k, v]) => addOutput({ type: "output", text: `${k}=${v}` }));
    },

    export(args) {
      if (!args.length) return addOutput({ type: "warn", text: "declare -x USER=\"root\"" });
      addOutput({ type: "dim", text: `export: ${args.join(" ")} (simulated)` });
    },

    history() {
      historyList.forEach((cmd, i) => addOutput({ type: "output", text: `  ${String(i + 1).padStart(4)}  ${cmd}` }));
    },

    clear() { addOutput({ type: "clear" }); },

    ifconfig() {
      ["eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500",
       "        inet 192.168.1.50  netmask 255.255.255.0  broadcast 192.168.1.255",
       "        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>",
       "        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)",
       "        RX packets 4523  bytes 2134921 (2.1 MB)",
       "        TX packets 3211  bytes 984721 (984.7 KB)",
       "",
       "lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536",
       "        inet 127.0.0.1  netmask 255.0.0.0",
       "        inet6 ::1  prefixlen 128  scopeid 0x10<host>"
      ].forEach(l => addOutput({ type: "output", text: l }));
    },

    ip(args) {
      const sub = args[0];
      if (sub === "addr" || sub === "a") {
        addOutput({ type: "output", text: "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 state UNKNOWN" });
        addOutput({ type: "dim", text: "    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00" });
        addOutput({ type: "success", text: "    inet 127.0.0.1/8 scope host lo" });
        addOutput({ type: "output", text: "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP" });
        addOutput({ type: "dim", text: "    link/ether 08:00:27:4e:66:a1 brd ff:ff:ff:ff:ff:ff" });
        addOutput({ type: "success", text: "    inet 192.168.1.50/24 brd 192.168.1.255 scope global eth0" });
      } else if (sub === "route" || sub === "r") {
        addOutput({ type: "output", text: "default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.50 metric 100" });
        addOutput({ type: "output", text: "192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50" });
      } else addOutput({ type: "warn", text: "Usage: ip [addr|route]" });
    },

    netstat(args) {
      addOutput({ type: "dim", text: "Active Internet connections (only servers)" });
      addOutput({ type: "dim", text: "Proto Recv-Q Send-Q Local Address           Foreign Address         State" });
      addOutput({ type: "output", text: "tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN" });
      addOutput({ type: "output", text: "tcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN" });
      addOutput({ type: "output", text: "tcp6       0      0 :::22                   :::*                    LISTEN" });
    },

    ss(args) {
      addOutput({ type: "dim", text: "Netid  State   Recv-Q  Send-Q   Local Address:Port   Peer Address:Port" });
      addOutput({ type: "output", text: "tcp    LISTEN  0       128          0.0.0.0:22          0.0.0.0:*" });
      addOutput({ type: "output", text: "tcp    LISTEN  0       128          0.0.0.0:80          0.0.0.0:*" });
    },

    arp(args) {
      addOutput({ type: "dim", text: "Address                  HWtype  HWaddress           Flags Mask  Iface" });
      addOutput({ type: "output", text: "192.168.1.1              ether   aa:bb:cc:dd:ee:01   C           eth0" });
      addOutput({ type: "output", text: "192.168.1.100            ether   aa:bb:cc:dd:ee:64   C           eth0" });
    },

    route() {
      addOutput({ type: "dim", text: "Kernel IP routing table" });
      addOutput({ type: "dim", text: "Destination     Gateway         Genmask         Flags Metric Ref    Use Iface" });
      addOutput({ type: "output", text: "0.0.0.0         192.168.1.1     0.0.0.0         UG    100    0        0 eth0" });
      addOutput({ type: "output", text: "192.168.1.0     0.0.0.0         255.255.255.0   U     100    0        0 eth0" });
    },

    ping(args) {
      const host = args.find(a => !a.startsWith("-")) || "127.0.0.1";
      addOutput({ type: "output", text: `PING ${host} (${host === "localhost" ? "127.0.0.1" : host}): 56 data bytes` });
      let i = 0;
      const iv = setInterval(() => {
        const ms = (Math.random() * 10 + 1).toFixed(3);
        addOutput({ type: "success", text: `64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${ms} ms` });
        if (++i >= 4) {
          clearInterval(iv);
          addOutput({ type: "output", text: `--- ${host} ping statistics ---` });
          addOutput({ type: "success", text: `4 packets transmitted, 4 received, 0% packet loss` });
        }
      }, 350);
    },

    nmap(args) {
      const target = args.find(a => !a.startsWith("-")) || "192.168.1.1";
      addOutput({ type: "info", text: `Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleString()}` });
      addOutput({ type: "output", text: `Nmap scan report for ${target}` });
      setTimeout(() => {
        addOutput({ type: "success", text: `Host is up (0.0043s latency).` });
        addOutput({ type: "output", text: "" });
        addOutput({ type: "dim", text: "PORT     STATE SERVICE      VERSION" });
        [["22/tcp","open","ssh","OpenSSH 9.0p1"],["80/tcp","open","http","Apache 2.4.54"],["443/tcp","open","https","Apache 2.4.54"],["3306/tcp","open","mysql","MySQL 8.0.30"],["8080/tcp","filtered","http-proxy",""]].forEach(([p, s, svc, v]) => {
          addOutput({ type: "nmap-row", port: p, state: s, service: svc, version: v });
        });
        addOutput({ type: "output", text: "" });
        addOutput({ type: "dim", text: `Nmap done: 1 IP address (1 host up) scanned in 2.14 seconds` });
      }, 600);
    },

    nc(args) {
      const host = args.find(a => !a.startsWith("-") && isNaN(a));
      const port = args.find(a => !isNaN(a) && a.length > 0);
      if (!host || !port) return addOutput({ type: "error", text: "nc: usage: nc [-options] hostname port" });
      addOutput({ type: "success", text: `(UNKNOWN) [${host}] ${port} (?) open` });
      addOutput({ type: "dim", text: "[nc] Connection established (simulated). Type Ctrl+C to exit." });
    },

    wget(args) {
      const url = args.find(a => !a.startsWith("-"));
      if (!url) return addOutput({ type: "error", text: "wget: missing URL" });
      addOutput({ type: "output", text: `--${new Date().toISOString().slice(0,19).replace("T"," ")}--  ${url}` });
      addOutput({ type: "output", text: "Resolving host... done." });
      setTimeout(() => {
        addOutput({ type: "output", text: "Connecting to host:80... connected." });
        addOutput({ type: "success", text: "HTTP request sent, awaiting response... 200 OK" });
        addOutput({ type: "success", text: "Download complete: index.html [simulated]" });
      }, 400);
    },

    curl(args) {
      const url = args.find(a => !a.startsWith("-"));
      if (!url) return addOutput({ type: "error", text: "curl: try 'curl --help'" });
      addOutput({ type: "dim", text: `* Connecting to ${url}...` });
      setTimeout(() => {
        addOutput({ type: "success", text: "< HTTP/1.1 200 OK" });
        addOutput({ type: "dim", text: "< Content-Type: text/html; charset=utf-8" });
        addOutput({ type: "output", text: "" });
        addOutput({ type: "output", text: "<html><body><h1>Simulated Response</h1></body></html>" });
      }, 300);
    },

    ssh(args) {
      const target = args.find(a => !a.startsWith("-"));
      if (!target) return addOutput({ type: "error", text: "ssh: usage: ssh [user@]hostname" });
      addOutput({ type: "warn", text: `The authenticity of host '${target.split("@").pop()}' can't be established.` });
      addOutput({ type: "warn", text: "RSA key fingerprint is SHA256:abc123def456..." });
      addOutput({ type: "success", text: `[simulated] Connected to ${target}` });
    },

    sudo(args) {
      if (!args.length) return addOutput({ type: "error", text: "sudo: usage: sudo command" });
    },

    useradd(args) {
      const name = args.find(a => !a.startsWith("-"));
      if (!name) return addOutput({ type: "error", text: "useradd: no username specified" });
      addOutput({ type: "success", text: `useradd: user '${name}' created (simulated)` });
    },

    passwd() {
      addOutput({ type: "output", text: "New password: " });
      addOutput({ type: "output", text: "Retype new password: " });
      addOutput({ type: "success", text: "passwd: password updated successfully" });
    },

    su(args) {
      const user = args[0] || "root";
      addOutput({ type: "info", text: `Switching to user '${user}' (simulated). Already running as root.` });
    },

    chmod(args) {
      const paths2 = args.filter(a => !a.startsWith("-"));
      if (paths2.length < 2) return addOutput({ type: "error", text: "chmod: missing operand" });
      if (!getNode(resolvePath(cwd, paths2[1]))) return addOutput({ type: "error", text: `chmod: '${paths2[1]}': No such file` });
    },

    chown(args) {
      const paths2 = args.filter(a => !a.startsWith("-"));
      if (paths2.length < 2) return addOutput({ type: "error", text: "chown: missing operand" });
    },

    file(args) {
      for (const arg of args) {
        const p = resolvePath(cwd, arg);
        const node = getNode(p);
        if (!node) { addOutput({ type: "error", text: `${arg}: ERROR: No such file or directory` }); continue; }
        addOutput({ type: "output", text: `${arg}: ${node.type === "dir" ? "directory" : node.content === "[binary]" ? "ELF 64-bit LSB executable, x86-64" : "ASCII text"}` });
      }
    },

    which(args) {
      const known = { bash:"/bin/bash", ls:"/bin/ls", cat:"/bin/cat", grep:"/bin/grep", find:"/usr/bin/find", nmap:"/usr/bin/nmap", python3:"/usr/bin/python3", curl:"/usr/bin/curl", wget:"/usr/bin/wget", john:"/usr/bin/john", hydra:"/usr/bin/hydra", ssh:"/usr/bin/ssh", whoami:"/usr/bin/whoami", id:"/usr/bin/id" };
      for (const cmd of args) {
        if (known[cmd]) addOutput({ type: "output", text: known[cmd] });
        else addOutput({ type: "error", text: `${cmd} not found` });
      }
    },

    john(args) {
      const file = args.find(a => !a.startsWith("-"));
      addOutput({ type: "info", text: "John the Ripper 1.9.0-jumbo-1+bleeding-aec1328d6c" });
      if (!file) return addOutput({ type: "error", text: "john: no password files specified" });
      addOutput({ type: "output", text: `Using default input encoding: UTF-8` });
      addOutput({ type: "output", text: `Loaded 3 password hashes with 3 different salts (sha512crypt, $6$)` });
      setTimeout(() => addOutput({ type: "success", text: `toor             (root)` }), 500);
      setTimeout(() => addOutput({ type: "success", text: `kali             (kali)` }), 900);
      setTimeout(() => addOutput({ type: "warn", text: `2 password hashes cracked, 1 left` }), 1100);
    },

    hydra(args) {
      addOutput({ type: "info", text: "Hydra v9.4 (c) 2022 by van Hauser/THC & David Maciejak" });
      addOutput({ type: "warn", text: "[simulated] Starting brute force attack..." });
      setTimeout(() => addOutput({ type: "success", text: "[22][ssh] host: 192.168.1.100   login: root   password: toor" }), 800);
      setTimeout(() => addOutput({ type: "success", text: "1 of 1 target successfully completed, 1 valid password found" }), 1000);
    },

    exit() {
      addOutput({ type: "dim", text: "logout" });
      addOutput({ type: "dim", text: "Connection to kali closed." });
    },
  };

  return cmds;
}

// ─── PIPE EXECUTION ────────────────────────────────────────────────────────────
function executePipe(segments, fs, setFs, cwd, setCwd, addOutput, historyList) {
  if (segments.length === 1) {
    const [cmd, ...args] = tokenize(segments[0].trim());
    if (!cmd) return;
    const cmds = buildCommands(fs, setFs, cwd, setCwd, addOutput, historyList);
    if (cmds[cmd]) cmds[cmd](args);
    else {
      const binPaths = ["/usr/bin", "/bin"];
      let found = false;
      for (const bp of binPaths) {
        if (fs[bp + "/" + cmd]) { addOutput({ type: "warn", text: `[${cmd}] Simulated execution.` }); found = true; break; }
      }
      if (!found) addOutput({ type: "error", text: `bash: ${cmd}: command not found` });
    }
    return;
  }

  // Capture stdout from first command, pipe to next
  const captured = [];
  const capAdd = (entry) => { if (entry.type !== "clear") captured.push(entry); };
  const [cmd, ...args] = tokenize(segments[0].trim());
  const cmds = buildCommands(fs, setFs, cwd, setCwd, capAdd, historyList);
  if (cmds[cmd]) cmds[cmd](args);

  // Apply second command (grep, sort, etc.) on captured text
  const capturedText = captured.map(e => e.text || "").join("\n");
  const [cmd2, ...args2] = tokenize(segments[1].trim());

  if (cmd2 === "grep") {
    const flags = args2.filter(a => a.startsWith("-")).join("");
    const pattern = args2.find(a => !a.startsWith("-"));
    if (!pattern) return addOutput({ type: "error", text: "grep: pattern required" });
    const regex = new RegExp(pattern, flags.includes("i") ? "i" : "");
    capturedText.split("\n").forEach(l => { if (regex.test(l)) addOutput({ type: "success", text: l }); });
  } else if (cmd2 === "sort") {
    const rev = args2.includes("-r");
    const lines = capturedText.split("\n").filter(Boolean).sort();
    (rev ? lines.reverse() : lines).forEach(l => addOutput({ type: "output", text: l }));
  } else if (cmd2 === "head") {
    const n = parseInt(args2.find(a => /^\d+$/.test(a))) || 10;
    capturedText.split("\n").slice(0, n).forEach(l => addOutput({ type: "output", text: l }));
  } else if (cmd2 === "tail") {
    const n = parseInt(args2.find(a => /^\d+$/.test(a))) || 10;
    const lines2 = capturedText.split("\n");
    lines2.slice(Math.max(0, lines2.length - n)).forEach(l => addOutput({ type: "output", text: l }));
  } else if (cmd2 === "wc") {
    const lines2 = capturedText.split("\n").filter(Boolean);
    if (args2.includes("-l")) addOutput({ type: "output", text: String(lines2.length).padStart(7) });
    else addOutput({ type: "output", text: `${String(lines2.length).padStart(7)} ${String(capturedText.split(/\s+/).filter(Boolean).length).padStart(7)}` });
  } else if (cmd2 === "uniq") {
    const lines2 = capturedText.split("\n").filter(Boolean);
    lines2.filter((l, i) => i === 0 || l !== lines2[i-1]).forEach(l => addOutput({ type: "output", text: l }));
  } else {
    captured.forEach(e => addOutput(e));
    addOutput({ type: "warn", text: `[pipe] '${cmd2}' not supported as pipe target in MVP` });
  }
}

// ─── TERMINAL INSTANCE ─────────────────────────────────────────────────────────
function TerminalInstance({ tabId, isActive }) {
  const [fs, setFs] = useState(() => buildFS());
  const [cwd, setCwdState] = useState("/root");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [input, setInput] = useState("");
  const [outputLines, setOutputLines] = useState([]);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  const cwdRef = useRef(cwd);
  const fsRef = useRef(fs);
  useEffect(() => { cwdRef.current = cwd; }, [cwd]);
  useEffect(() => { fsRef.current = fs; }, [fs]);

  const setCwd = useCallback((p) => setCwdState(p), []);

  const addOutput = useCallback((entry) => {
    if (entry.type === "clear") { setOutputLines([]); return; }
    setOutputLines(prev => [...prev, { ...entry, id: Math.random() }]);
  }, []);

  // Boot sequence
  useEffect(() => {
    const boot = [
      { type: "ascii" },
      { type: "output", text: "" },
      { type: "info", text: "Kali GNU/Linux Rolling 2024.1 | Kernel 6.6.9-amd64" },
      { type: "output", text: "" },
      { type: "kv", key: "System ", value: "x86_64 GNU/Linux" },
      { type: "kv", key: "Shell  ", value: "/bin/bash" },
      { type: "kv", key: "User   ", value: "root", color: "#ff4757" },
      { type: "kv", key: "IP     ", value: "192.168.1.50", color: "#2ed573" },
      { type: "output", text: "" },
      { type: "success", text: '  Type "help" to see all available commands.' },
      { type: "dim", text: '  Try: ls, cat /etc/passwd, nmap 192.168.1.1, ping google.com' },
      { type: "output", text: "" },
    ];
    boot.forEach((l, i) => setTimeout(() => addOutput(l), i * 40));
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [outputLines]);

  useEffect(() => {
    if (isActive && inputRef.current) inputRef.current.focus();
  }, [isActive]);

  const handleKey = (e) => {
    if (e.key === "Enter") {
      const val = input.trim();
      addOutput({ type: "prompt-echo", cwd: cwdRef.current, cmd: val });
      if (val) { setHistory(prev => [val, ...prev]); setHistIdx(-1); }
      setInput("");

      if (!val) return;

      // Env var assignment
      if (/^[A-Z_]+=/.test(val)) { addOutput({ type: "dim", text: `(set)` }); return; }

      // Pipe
      const segments = val.split("|").map(s => s.trim());
      executePipe(segments, fsRef.current, setFs, cwdRef.current, setCwd, addOutput, history);

    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHistIdx(i => {
        const ni = Math.min(i + 1, history.length - 1);
        setInput(history[ni] || "");
        return ni;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHistIdx(i => {
        const ni = Math.max(i - 1, -1);
        setInput(ni === -1 ? "" : history[ni] || "");
        return ni;
      });
    } else if (e.key === "Tab") {
      e.preventDefault();
      const tokens = input.split(" ");
      const last = tokens[tokens.length - 1];
      if (tokens.length === 1) {
        const allCmds = ["help","ls","cd","pwd","cat","echo","mkdir","touch","rm","cp","mv","find","grep","sort","uniq","wc","head","tail","nano","tree","cut","awk","sed","whoami","id","uname","hostname","uptime","date","ps","kill","df","free","du","mount","env","export","history","clear","ifconfig","ip","netstat","ss","arp","route","ping","nmap","nc","wget","curl","ssh","sudo","su","useradd","passwd","chmod","chown","file","which","john","hydra","exit"];
        const m = allCmds.filter(c => c.startsWith(last));
        if (m.length === 1) setInput(m[0] + " ");
        else if (m.length > 1) addOutput({ type: "dim", text: m.join("  ") });
      } else {
        const dir = last.includes("/") ? last.slice(0, last.lastIndexOf("/") + 1) : "";
        const base = last.includes("/") ? last.slice(last.lastIndexOf("/") + 1) : last;
        const rdir = resolvePath(cwdRef.current, dir || ".");
        const node = fsRef.current[rdir];
        if (node?.type === "dir") {
          const m = node.children.filter(c => c.startsWith(base));
          if (m.length === 1) {
            tokens[tokens.length - 1] = dir + m[0];
            const full = rdir.replace(/\/+$/, "") + "/" + m[0];
            setInput(tokens.join(" ") + (fsRef.current[full]?.type === "dir" ? "/" : " "));
          } else if (m.length > 1) addOutput({ type: "dim", text: m.join("  ") });
        }
      }
    } else if (e.ctrlKey && e.key === "c") {
      addOutput({ type: "error", text: "^C" });
      setInput("");
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setOutputLines([]);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Output area */}
      <div
        ref={outputRef}
        onClick={() => inputRef.current?.focus()}
        style={{ flex: 1, overflowY: "auto", padding: "12px 16px", cursor: "text", scrollbarWidth: "thin", scrollbarColor: "#1e1e3a transparent" }}
      >
        {outputLines.map(line => <OutputLine key={line.id} line={line} />)}
      </div>
      {/* Input row */}
      <div style={{ display: "flex", alignItems: "center", padding: "4px 16px 12px", flexShrink: 0 }}>
        <PromptSpan cwd={cwd} />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="off"
          spellCheck={false}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#e0e0ff", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, caretColor: "#00e5ff" }}
        />
      </div>
    </div>
  );
}

// ─── OUTPUT LINE RENDERER ─────────────────────────────────────────────────────
const COLORS = { error: "#ff4757", success: "#2ed573", info: "#00e5ff", warn: "#ffa502", dim: "#5c5c8a", output: "#e0e0ff", dir: "#2979ff", section: "#d500f9" };

function OutputLine({ line }) {
  const s = { fontSize: 13, lineHeight: "1.65", whiteSpace: "pre-wrap", wordBreak: "break-all", fontFamily: "'JetBrains Mono', monospace" };

  if (line.type === "ascii") return (
    <pre style={{ ...s, color: "#00e5ff", fontSize: 10, lineHeight: 1.25, textShadow: "0 0 10px rgba(0,229,255,0.3)", marginBottom: 2 }}>{
`██╗  ██╗ █████╗ ██╗     ██╗
██║ ██╔╝██╔══██╗██║     ██║
█████╔╝ ███████║██║     ██║
██╔═██╗ ██╔══██║██║     ██║
██║  ██╗██║  ██║███████╗██║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝`}
    </pre>
  );

  if (line.type === "prompt-echo") return (
    <div style={s}>
      <PromptSpan cwd={line.cwd} inline />
      <span style={{ color: "#e0e0ff" }}>{line.cmd}</span>
    </div>
  );

  if (line.type === "kv") return (
    <div style={s}>
      <span style={{ color: "#5c5c8a" }}>  {line.key}: </span>
      <span style={{ color: line.color || "#e0e0ff" }}>{line.value}</span>
    </div>
  );

  if (line.type === "banner") return <div style={{ ...s, color: "#00e5ff", fontWeight: "bold" }}>{line.text}</div>;
  if (line.type === "section") return <div style={{ ...s, color: "#d500f9", marginTop: 4 }}>{line.text}</div>;
  if (line.type === "helprow") return (
    <div style={s}>
      <span style={{ color: "#00e5ff", display: "inline-block", minWidth: 260 }}>{line.cmd}</span>
      <span style={{ color: "#5c5c8a" }}>{line.desc}</span>
    </div>
  );

  if (line.type === "ls-grid") return (
    <div style={{ ...s, display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
      {line.items.map((item, i) => (
        <span key={i} style={{ color: item.isDir ? "#2979ff" : item.isExe ? "#2ed573" : "#e0e0ff", fontWeight: item.isDir ? "bold" : "normal" }}>
          {item.name}{item.isDir ? "/" : ""}
        </span>
      ))}
    </div>
  );

  if (line.type === "ls-long") return (
    <div style={s}>
      <span style={{ color: "#5c5c8a" }}>{line.perm}  1 root root {line.size.padStart(6)} {line.date} </span>
      <span style={{ color: line.isDir ? "#2979ff" : "#e0e0ff", fontWeight: line.isDir ? "bold" : "normal" }}>{line.item}{line.isDir ? "/" : ""}</span>
    </div>
  );

  if (line.type === "nmap-row") return (
    <div style={s}>
      <span style={{ color: "#00e5ff", display: "inline-block", width: 100 }}>{line.port}</span>
      <span style={{ color: line.state === "open" ? "#2ed573" : "#ffa502", display: "inline-block", width: 80 }}>{line.state}</span>
      <span style={{ display: "inline-block", width: 120 }}>{line.service}</span>
      <span style={{ color: "#5c5c8a" }}>{line.version}</span>
    </div>
  );

  if (line.type === "dir") return <div style={{ ...s, color: "#2979ff", fontWeight: "bold" }}>{line.text}</div>;

  const color = COLORS[line.type] || COLORS.output;
  return <div style={{ ...s, color }}>{line.text}</div>;
}

function PromptSpan({ cwd, inline }) {
  const path = displayPath(cwd);
  const s = { fontSize: 13, fontFamily: "'JetBrains Mono', monospace", userSelect: "none", flexShrink: 0, whiteSpace: "nowrap" };
  return (
    <span style={s}>
      <span style={{ color: "#2ed573", fontWeight: "bold" }}>root</span>
      <span style={{ color: "#5c5c8a" }}>@</span>
      <span style={{ color: "#2979ff", fontWeight: "bold" }}>kali</span>
      <span style={{ color: "#5c5c8a" }}>:</span>
      <span style={{ color: "#00e5ff" }}>{path}</span>
      <span style={{ color: "#ff4757", fontWeight: "bold", margin: "0 4px" }}>#</span>
    </span>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────────
let tabCounter = 1;
const makeTab = () => ({ id: ++tabCounter, title: `Terminal ${tabCounter}` });

export default function KaliOS() {
  const [tabs, setTabs] = useState([{ id: 1, title: "Terminal 1" }]);
  const [activeTab, setActiveTab] = useState(1);
  const [clock, setClock] = useState("");
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB"));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const addTab = () => {
    const t = makeTab();
    setTabs(prev => [...prev, t]);
    setActiveTab(t.id);
  };

  const closeTab = (id, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTab === id) setActiveTab(newTabs[Math.max(0, idx - 1)].id);
  };

  const startRename = (id, title, e) => {
    e.stopPropagation();
    setRenaming(id);
    setRenameVal(title);
  };

  const finishRename = () => {
    if (renameVal.trim()) setTabs(prev => prev.map(t => t.id === renaming ? { ...t, title: renameVal.trim() } : t));
    setRenaming(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0f", color: "#e0e0ff", fontFamily: "'JetBrains Mono', monospace", overflow: "hidden" }}>
      {/* ── Top Bar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 16px", background: "#0f0f1a", borderBottom: "1px solid #1e1e3a", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#00e5ff", fontWeight: "bold", letterSpacing: 2, fontSize: 12 }}>⬡ KALI</span>
          <span style={{ color: "#5c5c8a", fontSize: 11 }}>GNU/Linux Rolling</span>
        </div>
        <span style={{ color: "#5c5c8a", fontSize: 12 }}>{clock}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "#5c5c8a" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2ed573", display: "inline-block", boxShadow: "0 0 5px #2ed573" }} />
            root@kali
          </span>
          <span>◈ 192.168.1.50</span>
          <span>⚡ 100%</span>
        </div>
      </div>

      {/* ── Window Chrome ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", margin: 10, border: "1px solid #1e1e3a", borderRadius: 8, overflow: "hidden", background: "#0f0f1a", boxShadow: "0 0 30px rgba(41,121,255,0.07)" }}>

        {/* Title Bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "7px 12px", background: "#12121f", borderBottom: "1px solid #1e1e3a", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 6, marginRight: 6 }}>
            {[["#ff5f57","close"],["#febc2e","min"],["#28c840","max"]].map(([c, l]) => (
              <div key={l} title={l} style={{ width: 12, height: 12, borderRadius: "50%", background: c, cursor: "pointer", flexShrink: 0 }} />
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 2, flex: 1, overflowX: "auto" }}>
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "3px 10px",
                  borderRadius: 5, cursor: "pointer", flexShrink: 0, fontSize: 11,
                  background: activeTab === tab.id ? "#0f0f1a" : "transparent",
                  border: activeTab === tab.id ? "1px solid #2979ff" : "1px solid transparent",
                  color: activeTab === tab.id ? "#00e5ff" : "#5c5c8a",
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: 10 }}>▶</span>
                {renaming === tab.id ? (
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={finishRename}
                    onKeyDown={e => { if (e.key === "Enter") finishRename(); if (e.key === "Escape") setRenaming(null); }}
                    onClick={e => e.stopPropagation()}
                    style={{ background: "transparent", border: "none", outline: "none", color: "#00e5ff", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, width: 80 }}
                  />
                ) : (
                  <span onDoubleClick={e => startRename(tab.id, tab.title, e)}>{tab.title}</span>
                )}
                {tabs.length > 1 && (
                  <span
                    onClick={e => closeTab(tab.id, e)}
                    style={{ marginLeft: 2, opacity: 0.5, fontSize: 12, lineHeight: 1 }}
                    onMouseEnter={e => e.target.style.opacity = 1}
                    onMouseLeave={e => e.target.style.opacity = 0.5}
                  >×</span>
                )}
              </div>
            ))}
            <button
              onClick={addTab}
              title="New Tab"
              style={{ background: "transparent", border: "1px dashed #1e1e3a", borderRadius: 5, color: "#5c5c8a", cursor: "pointer", padding: "3px 8px", fontSize: 14, lineHeight: 1, flexShrink: 0 }}
              onMouseEnter={e => { e.target.style.color = "#00e5ff"; e.target.style.borderColor = "#2979ff"; }}
              onMouseLeave={e => { e.target.style.color = "#5c5c8a"; e.target.style.borderColor = "#1e1e3a"; }}
            >+</button>
          </div>
        </div>

        {/* Terminal panes */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {tabs.map(tab => (
            <div
              key={tab.id}
              style={{ position: "absolute", inset: 0, display: activeTab === tab.id ? "flex" : "none", flexDirection: "column" }}
            >
              <TerminalInstance tabId={tab.id} isActive={activeTab === tab.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
