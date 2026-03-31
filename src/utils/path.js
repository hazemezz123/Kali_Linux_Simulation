// Path utilities used by commands and tab completion.
export function resolvePath(cwd, p) {
  if (!p || p === "~") return "/root";
  if (p.startsWith("~")) p = "/root" + p.slice(1);
  if (!p.startsWith("/")) p = cwd.replace(/\/+$/, "") + "/" + p;
  const parts = p.split("/").filter(Boolean);
  const resolved = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") resolved.pop();
    else resolved.push(part);
  }
  return "/" + resolved.join("/");
}

export function displayPath(cwd) {
  if (cwd === "/root") return "~";
  if (cwd.startsWith("/root/")) return "~" + cwd.slice(5);
  return cwd;
}
