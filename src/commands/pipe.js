import { tokenize } from "../utils/tokenize.js";
import { buildCommands } from "./registry.js";

// Small pipe runner (MVP): supports 2-segment pipelines, matching old behavior.
export function executePipe(
  segments,
  fs,
  setFs,
  cwd,
  setCwd,
  addOutput,
  historyList,
) {
  if (segments.length === 1) {
    const [cmd, ...args] = tokenize(segments[0].trim());
    if (!cmd) return;
    const cmds = buildCommands(fs, setFs, cwd, setCwd, addOutput, historyList);
    if (cmds[cmd]) cmds[cmd](args);
    else {
      const binPaths = ["/usr/bin", "/bin"];
      let found = false;
      for (const bp of binPaths) {
        if (fs[bp + "/" + cmd]) {
          addOutput({ type: "warn", text: `[${cmd}] Simulated execution.` });
          found = true;
          break;
        }
      }
      if (!found)
        addOutput({ type: "error", text: `bash: ${cmd}: command not found` });
    }
    return;
  }

  const captured = [];
  const capAdd = (entry) => {
    if (entry.type !== "clear") captured.push(entry);
  };
  const [cmd, ...args] = tokenize(segments[0].trim());
  const cmds = buildCommands(fs, setFs, cwd, setCwd, capAdd, historyList);
  if (cmds[cmd]) cmds[cmd](args);

  const capturedText = captured.map((e) => e.text || "").join("\n");
  const [cmd2, ...args2] = tokenize(segments[1].trim());

  if (cmd2 === "grep") {
    const flags = args2.filter((a) => a.startsWith("-")).join("");
    const pattern = args2.find((a) => !a.startsWith("-"));
    if (!pattern)
      return addOutput({ type: "error", text: "grep: pattern required" });
    const regex = new RegExp(pattern, flags.includes("i") ? "i" : "");
    capturedText.split("\n").forEach((l) => {
      if (regex.test(l)) addOutput({ type: "success", text: l });
    });
  } else if (cmd2 === "sort") {
    const rev = args2.includes("-r");
    const lines = capturedText.split("\n").filter(Boolean).sort();
    (rev ? lines.reverse() : lines).forEach((l) =>
      addOutput({ type: "output", text: l }),
    );
  } else if (cmd2 === "head") {
    const n =
      parseInt(
        args2.find((a) => /^\d+$/.test(a)),
        10,
      ) || 10;
    capturedText
      .split("\n")
      .slice(0, n)
      .forEach((l) => addOutput({ type: "output", text: l }));
  } else if (cmd2 === "tail") {
    const n =
      parseInt(
        args2.find((a) => /^\d+$/.test(a)),
        10,
      ) || 10;
    const lines2 = capturedText.split("\n");
    lines2
      .slice(Math.max(0, lines2.length - n))
      .forEach((l) => addOutput({ type: "output", text: l }));
  } else if (cmd2 === "wc") {
    const lines2 = capturedText.split("\n").filter(Boolean);
    if (args2.includes("-l"))
      addOutput({ type: "output", text: String(lines2.length).padStart(7) });
    else
      addOutput({
        type: "output",
        text: `${String(lines2.length).padStart(7)} ${String(capturedText.split(/\s+/).filter(Boolean).length).padStart(7)}`,
      });
  } else if (cmd2 === "uniq") {
    const lines2 = capturedText.split("\n").filter(Boolean);
    lines2
      .filter((l, i) => i === 0 || l !== lines2[i - 1])
      .forEach((l) => addOutput({ type: "output", text: l }));
  } else {
    captured.forEach((e) => addOutput(e));
    addOutput({
      type: "warn",
      text: `[pipe] '${cmd2}' not supported as pipe target in MVP`,
    });
  }
}
