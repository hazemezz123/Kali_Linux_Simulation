import { COLORS } from "../constants.js";
import { displayPath } from "../utils/path.js";

export function createPrompt(cwd, inline = false) {
  const wrap = document.createElement("span");
  wrap.className = "prompt" + (inline ? " inline" : "");

  const user = document.createElement("span");
  user.className = "prompt-user";
  user.textContent = "root";

  const at = document.createElement("span");
  at.className = "prompt-sep";
  at.textContent = "@";

  const host = document.createElement("span");
  host.className = "prompt-host";
  host.textContent = "kali";

  const colon = document.createElement("span");
  colon.className = "prompt-sep";
  colon.textContent = ":";

  const path = document.createElement("span");
  path.className = "prompt-path";
  path.textContent = displayPath(cwd);

  const hash = document.createElement("span");
  hash.className = "prompt-hash";
  hash.textContent = "#";

  wrap.append(user, at, host, colon, path, hash);
  return wrap;
}

export function lineNode(line) {
  const base = document.createElement("div");
  base.className = "line";

  if (line.type === "ascii") {
    const pre = document.createElement("pre");
    pre.className = "line-ascii";
    pre.textContent = `██╗  ██╗ █████╗ ██╗     ██╗
██║ ██╔╝██╔══██╗██║     ██║
█████╔╝ ███████║██║     ██║
██╔═██╗ ██╔══██║██║     ██║
██║  ██╗██║  ██║███████╗██║
╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝`;
    return pre;
  }

  if (line.type === "prompt-echo") {
    const cmd = document.createElement("span");
    cmd.style.color = "#e0e0ff";
    cmd.textContent = line.cmd;
    base.append(createPrompt(line.cwd, true), cmd);
    return base;
  }

  if (line.type === "kv") {
    const key = document.createElement("span");
    key.className = "line-dim";
    key.textContent = `  ${line.key}: `;
    const val = document.createElement("span");
    val.style.color = line.color || "#e0e0ff";
    val.textContent = line.value;
    base.append(key, val);
    return base;
  }

  if (line.type === "banner") {
    base.classList.add("line-banner");
    base.textContent = line.text;
    return base;
  }

  if (line.type === "section") {
    base.classList.add("line-section");
    base.textContent = line.text;
    return base;
  }

  if (line.type === "helprow") {
    const cmd = document.createElement("span");
    cmd.className = "line-help-cmd";
    cmd.textContent = line.cmd;
    const desc = document.createElement("span");
    desc.className = "line-dim";
    desc.textContent = line.desc;
    base.append(cmd, desc);
    return base;
  }

  if (line.type === "ls-grid") {
    const grid = document.createElement("div");
    grid.className = "line line-ls-grid";
    for (const item of line.items) {
      const el = document.createElement("span");
      el.className = "line-ls-item";
      if (item.isDir) el.classList.add("dir");
      else if (item.isExe) el.classList.add("exe");
      el.textContent = item.name + (item.isDir ? "/" : "");
      grid.appendChild(el);
    }
    return grid;
  }

  if (line.type === "ls-long") {
    const meta = document.createElement("span");
    meta.className = "line-dim";
    meta.textContent = `${line.perm}  1 root root ${line.size.padStart(6)} ${line.date} `;
    const name = document.createElement("span");
    name.className = line.isDir ? "line-dir" : "line-output";
    name.textContent = line.item + (line.isDir ? "/" : "");
    base.append(meta, name);
    return base;
  }

  if (line.type === "nmap-row") {
    const p = document.createElement("span");
    p.className = "line-nmap-port";
    p.textContent = line.port;
    const st = document.createElement("span");
    st.className =
      "line-nmap-state " + (line.state === "open" ? "open" : "other");
    st.textContent = line.state;
    const svc = document.createElement("span");
    svc.className = "line-nmap-svc";
    svc.textContent = line.service;
    const ver = document.createElement("span");
    ver.className = "line-dim";
    ver.textContent = line.version;
    base.append(p, st, svc, ver);
    return base;
  }

  if (line.type === "dir") {
    base.classList.add("line-dir");
    base.textContent = line.text;
    return base;
  }

  const cls = "line-" + (line.type || "output");
  base.classList.add(cls);
  if (!COLORS[line.type]) base.classList.add("line-output");
  base.textContent = line.text ?? "";
  return base;
}
