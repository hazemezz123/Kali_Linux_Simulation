import { TerminalInstance } from "../terminal/TerminalInstance.js";

let tabCounter = 1;
const makeTab = () => ({ id: ++tabCounter, title: `Terminal ${tabCounter}` });

export class KaliApp {
  constructor(root) {
    this.root = root;
    this.tabs = [{ id: 1, title: "Terminal 1" }];
    this.activeTab = 1;
    this.renaming = null;
    this.renameVal = "";
    this.instances = new Map();
    this.panes = new Map();

    this.render();
    this.tickClock();
    setInterval(() => this.tickClock(), 1000);
  }

  tickClock() {
    if (this.clockEl)
      this.clockEl.textContent = new Date().toLocaleTimeString("en-GB");
  }

  addTab() {
    const t = makeTab();
    this.tabs.push(t);
    this.activeTab = t.id;
    this.render();
  }

  closeTab(id, e) {
    e.stopPropagation();
    if (this.tabs.length === 1) return;
    const idx = this.tabs.findIndex((t) => t.id === id);
    this.tabs = this.tabs.filter((t) => t.id !== id);

    const pane = this.panes.get(id);
    if (pane) pane.remove();
    this.panes.delete(id);
    this.instances.delete(id);

    if (this.activeTab === id)
      this.activeTab = this.tabs[Math.max(0, idx - 1)].id;
    this.render();
  }

  startRename(id, title, e) {
    e.stopPropagation();
    this.renaming = id;
    this.renameVal = title;
    this.render();
  }

  finishRename() {
    if (this.renameVal.trim()) {
      this.tabs = this.tabs.map((t) =>
        t.id === this.renaming ? { ...t, title: this.renameVal.trim() } : t,
      );
    }
    this.renaming = null;
    this.render();
  }

  ensurePane(tabId) {
    if (this.panes.has(tabId)) return this.panes.get(tabId);
    const pane = document.createElement("div");
    pane.className = "terminal-pane";
    this.paneHost.appendChild(pane);
    this.panes.set(tabId, pane);

    const instance = new TerminalInstance(tabId, pane);
    this.instances.set(tabId, instance);
    return pane;
  }

  updatePaneVisibility() {
    for (const tab of this.tabs) {
      const pane = this.ensurePane(tab.id);
      pane.style.display = this.activeTab === tab.id ? "flex" : "none";
    }
    for (const [id, pane] of this.panes.entries()) {
      if (!this.tabs.some((t) => t.id === id)) {
        pane.remove();
        this.panes.delete(id);
      }
    }
    const active = this.instances.get(this.activeTab);
    if (active) active.focus();
  }

  renderTabs() {
    this.tabStrip.innerHTML = "";
    for (const tab of this.tabs) {
      const tabEl = document.createElement("div");
      tabEl.className = "tab" + (this.activeTab === tab.id ? " active" : "");
      tabEl.addEventListener("click", () => {
        this.activeTab = tab.id;
        this.render();
      });

      const icon = document.createElement("span");
      icon.className = "tab-icon";
      icon.textContent = "▶";

      tabEl.appendChild(icon);

      if (this.renaming === tab.id) {
        const input = document.createElement("input");
        input.className = "tab-rename-input";
        input.value = this.renameVal;
        input.autofocus = true;
        input.addEventListener("input", (e) => {
          this.renameVal = e.target.value;
        });
        input.addEventListener("blur", () => this.finishRename());
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") this.finishRename();
          if (e.key === "Escape") {
            this.renaming = null;
            this.render();
          }
        });
        input.addEventListener("click", (e) => e.stopPropagation());
        tabEl.appendChild(input);
        setTimeout(() => input.focus(), 0);
      } else {
        const title = document.createElement("span");
        title.textContent = tab.title;
        title.addEventListener("dblclick", (e) =>
          this.startRename(tab.id, tab.title, e),
        );
        tabEl.appendChild(title);
      }

      if (this.tabs.length > 1) {
        const close = document.createElement("span");
        close.className = "tab-close";
        close.textContent = "×";
        close.addEventListener("click", (e) => this.closeTab(tab.id, e));
        tabEl.appendChild(close);
      }

      this.tabStrip.appendChild(tabEl);
    }

    const addBtn = document.createElement("button");
    addBtn.className = "tab-add-btn";
    addBtn.title = "New Tab";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => this.addTab());
    this.tabStrip.appendChild(addBtn);
  }

  render() {
    if (!this.appEl) {
      this.appEl = document.createElement("div");
      this.appEl.className = "kali-app";

      const topBar = document.createElement("div");
      topBar.className = "top-bar";

      const left = document.createElement("div");
      left.className = "top-left";
      const logo = document.createElement("span");
      logo.className = "top-logo";
      logo.textContent = "⬡ KALI";
      const distro = document.createElement("span");
      distro.className = "top-distro";
      distro.textContent = "GNU/Linux Rolling";
      left.append(logo, distro);

      this.clockEl = document.createElement("span");
      this.clockEl.className = "top-clock";

      const right = document.createElement("div");
      right.className = "top-right";
      const user = document.createElement("span");
      user.className = "top-user";
      const dot = document.createElement("span");
      dot.className = "online-dot";
      user.append(dot, document.createTextNode("root@kali"));
      const ip = document.createElement("span");
      ip.textContent = "◈ 192.168.1.50";
      const battery = document.createElement("span");
      battery.textContent = "⚡ 100%";

      const links = document.createElement("span");
      links.className = "top-owner-links";
      links.innerHTML =
        '<a href="https://github.com/hazemezz123" target="_blank" rel="noopener noreferrer"><img src="https://cdn.simpleicons.org/github/00e5ff" alt="GitHub" /> GitHub</a> · ' +
        '<a href="https://github.com/hazemezz123/Kali_Linux_Simulation" target="_blank" rel="noopener noreferrer">Repo</a> · ' +
        '<a href="https://www.linkedin.com/in/hazem-ezz-424498285/" target="_blank" rel="noopener noreferrer"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" /> LinkedIn</a>';

      right.append(user, ip, battery, links);

      topBar.append(left, this.clockEl, right);

      const chrome = document.createElement("div");
      chrome.className = "window-chrome";

      const titleBar = document.createElement("div");
      titleBar.className = "title-bar";

      const controls = document.createElement("div");
      controls.className = "window-controls";
      [
        ["#ff5f57", "close"],
        ["#febc2e", "min"],
        ["#28c840", "max"],
      ].forEach(([c, l]) => {
        const btn = document.createElement("div");
        btn.className = "wc-btn";
        btn.title = l;
        btn.style.background = c;
        controls.appendChild(btn);
      });

      this.tabStrip = document.createElement("div");
      this.tabStrip.className = "tab-strip";

      titleBar.append(controls, this.tabStrip);

      this.paneHost = document.createElement("div");
      this.paneHost.className = "pane-host";

      chrome.append(titleBar, this.paneHost);
      this.appEl.append(topBar, chrome);
      this.root.innerHTML = "";
      this.root.appendChild(this.appEl);
    }

    this.tickClock();
    this.renderTabs();
    this.updatePaneVisibility();
  }
}
