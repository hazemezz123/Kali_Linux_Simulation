import { ALL_COMMANDS } from "../constants.js";
import { buildFS } from "../fs.js";
import { executePipe } from "../commands/pipe.js";
import { resolvePath } from "../utils/path.js";
import { createPrompt, lineNode } from "../ui/line-node.js";

export class TerminalInstance {
  constructor(tabId, paneEl) {
    this.tabId = tabId;
    this.paneEl = paneEl;

    this.fs = buildFS();
    this.cwd = "/root";
    this.history = [];
    this.histIdx = -1;
    this.input = "";
    this.outputLines = [];

    this.buildDom();
    this.boot();
  }

  buildDom() {
    this.root = document.createElement("div");
    this.root.className = "terminal-instance";

    this.outputEl = document.createElement("div");
    this.outputEl.className = "terminal-output";
    this.outputEl.addEventListener("click", () => this.inputEl.focus());

    this.inputRow = document.createElement("div");
    this.inputRow.className = "terminal-input-row";

    this.promptEl = createPrompt(this.cwd);
    this.inputEl = document.createElement("input");
    this.inputEl.className = "terminal-input";
    this.inputEl.autocomplete = "off";
    this.inputEl.spellcheck = false;
    this.inputEl.addEventListener("input", (e) => {
      this.input = e.target.value;
    });
    this.inputEl.addEventListener("keydown", (e) => this.handleKey(e));

    this.inputRow.append(this.promptEl, this.inputEl);
    this.root.append(this.outputEl, this.inputRow);
    this.paneEl.appendChild(this.root);
  }

  isActive() {
    return this.paneEl.style.display !== "none";
  }

  focus() {
    this.inputEl.focus();
  }

  setCwd(p) {
    this.cwd = p;
    this.promptEl.replaceWith((this.promptEl = createPrompt(this.cwd)));
    this.inputRow.prepend(this.promptEl);
  }

  setFs(newFs) {
    this.fs = newFs;
  }

  addOutput(entry) {
    if (entry.type === "clear") {
      this.outputLines = [];
      this.outputEl.innerHTML = "";
      return;
    }
    this.outputLines.push({ ...entry, id: Math.random() });
    this.outputEl.appendChild(lineNode(entry));
    this.outputEl.scrollTop = this.outputEl.scrollHeight;
  }

  boot() {
    const boot = [
      { type: "ascii" },
      { type: "output", text: "" },
      {
        type: "info",
        text: "Kali GNU/Linux Rolling 2024.1 | Kernel 6.6.9-amd64",
      },
      { type: "output", text: "" },
      { type: "kv", key: "System ", value: "x86_64 GNU/Linux" },
      { type: "kv", key: "Shell  ", value: "/bin/bash" },
      { type: "kv", key: "User   ", value: "root", color: "#ff4757" },
      { type: "kv", key: "IP     ", value: "192.168.1.50", color: "#2ed573" },
      { type: "output", text: "" },
      { type: "success", text: '  Type "help" to see all available commands.' },
      {
        type: "dim",
        text: "  Try: ls, cat /etc/passwd, nmap 192.168.1.1, ping google.com",
      },
      { type: "output", text: "" },
    ];
    boot.forEach((l, i) => setTimeout(() => this.addOutput(l), i * 40));
  }

  handleKey(e) {
    if (e.key === "Enter") {
      const val = this.input.trim();
      this.addOutput({ type: "prompt-echo", cwd: this.cwd, cmd: val });
      if (val) {
        this.history = [val, ...this.history];
        this.histIdx = -1;
      }
      this.input = "";
      this.inputEl.value = "";
      if (!val) return;
      if (/^[A-Z_]+=/.test(val)) {
        this.addOutput({ type: "dim", text: "(set)" });
        return;
      }
      const segments = val.split("|").map((s) => s.trim());
      executePipe(
        segments,
        this.fs,
        (nextFs) => this.setFs(nextFs),
        this.cwd,
        (nextCwd) => this.setCwd(nextCwd),
        (entry) => this.addOutput(entry),
        this.history,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const ni = Math.min(this.histIdx + 1, this.history.length - 1);
      this.histIdx = ni;
      this.input = this.history[ni] || "";
      this.inputEl.value = this.input;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const ni = Math.max(this.histIdx - 1, -1);
      this.histIdx = ni;
      this.input = ni === -1 ? "" : this.history[ni] || "";
      this.inputEl.value = this.input;
    } else if (e.key === "Tab") {
      e.preventDefault();
      const tokens = this.input.split(" ");
      const last = tokens[tokens.length - 1];
      if (tokens.length === 1) {
        const m = ALL_COMMANDS.filter((c) => c.startsWith(last));
        if (m.length === 1) {
          this.input = m[0] + " ";
          this.inputEl.value = this.input;
        } else if (m.length > 1)
          this.addOutput({ type: "dim", text: m.join("  ") });
      } else {
        const dir = last.includes("/")
          ? last.slice(0, last.lastIndexOf("/") + 1)
          : "";
        const base = last.includes("/")
          ? last.slice(last.lastIndexOf("/") + 1)
          : last;
        const rdir = resolvePath(this.cwd, dir || ".");
        const node = this.fs[rdir];
        if (node?.type === "dir") {
          const m = node.children.filter((c) => c.startsWith(base));
          if (m.length === 1) {
            tokens[tokens.length - 1] = dir + m[0];
            const full = rdir.replace(/\/+$/, "") + "/" + m[0];
            this.input =
              tokens.join(" ") + (this.fs[full]?.type === "dir" ? "/" : " ");
            this.inputEl.value = this.input;
          } else if (m.length > 1)
            this.addOutput({ type: "dim", text: m.join("  ") });
        }
      }
    } else if (e.ctrlKey && e.key.toLowerCase() === "c") {
      this.addOutput({ type: "error", text: "^C" });
      this.input = "";
      this.inputEl.value = "";
    } else if (e.ctrlKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      this.outputLines = [];
      this.outputEl.innerHTML = "";
    }
  }
}
