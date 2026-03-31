# Development Guidelines

## Code Quality Standards

### Code Formatting
- **Indentation**: 2 spaces (consistent across all files)
- **Line Length**: No strict limit, but keep lines readable
- **Semicolons**: Not required (ES6 style)
- **Quotes**: Double quotes for strings
- **Trailing Commas**: Used in multi-line arrays and objects

### Structural Conventions
- **ES6 Modules**: All files use ES6 import/export syntax
- **Class-Based Components**: Use ES6 classes for major components (KaliApp, TerminalInstance)
- **Function Declarations**: Use function expressions for command handlers
- **Arrow Functions**: Preferred for callbacks and inline functions
- **Destructuring**: Used for cleaner parameter extraction

### Naming Conventions
- **Classes**: PascalCase (e.g., `KaliApp`, `TerminalInstance`)
- **Functions**: camelCase (e.g., `buildCommands`, `saveVisitor`, `getUserName`)
- **Variables**: camelCase (e.g., `tabCounter`, `deviceId`, `firebaseConfig`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `ALL_COMMANDS`, `COLORS`)
- **Private Properties**: Prefix with `this.` in classes (e.g., `this.fs`, `this.cwd`)
- **DOM Elements**: Suffix with `El` (e.g., `inputEl`, `outputEl`, `promptEl`)

### Documentation Standards
- **Inline Comments**: Used sparingly, only for complex logic or clarification
- **Section Comments**: Used to group related functionality (e.g., "// Command registry")
- **JSDoc**: Not used in this codebase
- **README**: Comprehensive project documentation in markdown

## Semantic Patterns

### Command Registry Pattern
Commands are organized as an object with function properties:
```javascript
const cmds = {
  help() { /* implementation */ },
  ls(args) { /* implementation */ },
  cd(args) { /* implementation */ }
};
```
- Each command is a method that receives `args` array
- Commands use closure to access shared state (fs, cwd, addOutput)
- Return early for error conditions

### State Management Pattern
State is managed through closures and class properties:
```javascript
// Class-based state
this.fs = buildFS();
this.cwd = "/root";
this.history = [];

// Closure-based state
const getNode = (p) => fs[p] || null;
```

### Output Handling Pattern
All terminal output uses typed objects:
```javascript
addOutput({ type: "error", text: "Error message" });
addOutput({ type: "success", text: "Success message" });
addOutput({ type: "output", text: "Normal output" });
```
Output types: `error`, `success`, `info`, `warn`, `dim`, `output`, `dir`, `section`, `banner`, `clear`

### Async/Await Pattern
Firebase operations consistently use async/await:
```javascript
async checkAndShowWelcome() {
  try {
    const registered = await isUserRegistered();
    if (registered) {
      this.render();
    } else {
      this.showWelcomeModal();
    }
  } catch (err) {
    console.error('Error checking registration:', err);
    this.showWelcomeModal();
  }
}
```

### Event Handler Pattern
Event listeners are attached inline with arrow functions:
```javascript
this.inputEl.addEventListener("keydown", (e) => this.handleKey(e));
btn.addEventListener("click", () => this.addTab());
```

### DOM Manipulation Pattern
DOM elements are created imperatively and assembled:
```javascript
const modal = document.createElement("div");
modal.className = "welcome-modal";
const box = document.createElement("div");
box.className = "welcome-box";
modal.appendChild(box);
document.body.appendChild(modal);
```

## Internal API Usage

### File System Simulation
```javascript
// Access file system nodes
const node = getNode(resolvePath(cwd, path));

// Check node type
if (node?.type === "dir") { /* directory logic */ }
if (node?.type === "file") { /* file logic */ }

// Update file system immutably
const newFs = { ...fs };
newFs[path] = { type: "file", content: "" };
setFs(newFs);
```

### Path Resolution
```javascript
import { resolvePath, displayPath } from "../utils/path.js";

// Resolve relative paths
const target = resolvePath(cwd, args[0]);

// Display user-friendly paths
const display = displayPath(target); // converts /root to ~
```

### Command Execution
```javascript
import { executePipe } from "../commands/pipe.js";

// Execute piped commands
const segments = val.split("|").map((s) => s.trim());
executePipe(segments, fs, setFs, cwd, setCwd, addOutput, history);
```

### Firebase Integration
```javascript
import { saveVisitor, isUserRegistered, getVisitorCount, getUserName } from "../firebase.js";

// Check registration status
const registered = await isUserRegistered();

// Save visitor data
await saveVisitor(name);

// Get visitor count
const count = await getVisitorCount();

// Get stored username
const userName = getUserName();
```

### Terminal Output Rendering
```javascript
import { lineNode, createPrompt } from "../ui/line-node.js";

// Create output line
this.outputEl.appendChild(lineNode(entry));

// Create prompt element
this.promptEl = createPrompt(this.cwd);
```

## Code Idioms

### Optional Chaining for Safe Access
```javascript
const node = getNode(target);
if (!node) return addOutput({ type: "error", text: "Not found" });

// Safe property access
const isDir = n?.type === "dir";
const children = node.children || [];
```

### Array Filter and Map Chains
```javascript
const flags = args.filter((a) => a.startsWith("-")).join("");
const paths = args.filter((a) => !a.startsWith("-"));
const items = (node.children || []).filter((c) => showAll || !c.startsWith("."));
```

### Ternary Operators for Conditional Values
```javascript
const target = pathArg ? resolvePath(cwd, pathArg) : "/root";
const text = args.includes("-a") ? "detailed info" : "basic info";
tabEl.className = "tab" + (this.activeTab === tab.id ? " active" : "");
```

### Template Literals for String Building
```javascript
addOutput({ type: "error", text: `ls: cannot access '${paths[0]}': No such file` });
const deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
```

### Spread Operator for Immutable Updates
```javascript
const newFs = { ...fs };
newFs[parent] = { ...newFs[parent], children: [...(newFs[parent].children || []), name] };
this.tabs = this.tabs.map((t) => t.id === this.renaming ? { ...t, title: this.renameVal.trim() } : t);
```

### setTimeout for Async UI Updates
```javascript
setTimeout(() => this.addOutput(l), i * 40); // Staggered boot messages
setTimeout(() => input.focus(), 100); // Delayed focus
setTimeout(() => { modal.remove(); this.render(); }, 800); // Delayed transition
```

### Early Returns for Error Handling
```javascript
if (!args.length) return addOutput({ type: "error", text: "missing operand" });
if (!node) return addOutput({ type: "error", text: "No such file" });
if (node.type !== "dir") return addOutput({ type: "error", text: "Not a directory" });
```

## Best Practices

### Error Handling
- Always wrap Firebase operations in try-catch blocks
- Provide user-friendly error messages
- Log errors to console for debugging
- Gracefully degrade when services fail

### Performance
- Use `requestAnimationFrame` for smooth scrolling
- Batch DOM updates when possible
- Avoid unnecessary re-renders
- Clean up event listeners and intervals

### Mobile Support
- Detect mobile devices with `isMobile()` utility
- Handle viewport resize events for keyboard
- Prevent input blur on mobile
- Use appropriate input attributes (autocomplete="off", etc.)

### Security
- Never expose sensitive credentials in code
- Use Firestore Security Rules for data protection
- Validate user input before processing
- Sanitize data before Firebase operations

### Maintainability
- Keep functions focused and single-purpose
- Use descriptive variable names
- Group related functionality together
- Maintain consistent code style throughout
- Comment complex logic, not obvious code
