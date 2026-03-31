# Project Structure

## Directory Organization

```
Kali_Linux_Simulation/
├── .amazonq/rules/memory-bank/    # Amazon Q documentation
├── src/                           # Source code modules
│   ├── app/                       # Application core
│   │   └── KaliApp.js            # Main application controller
│   ├── commands/                  # Command processing
│   │   ├── pipe.js               # Pipe operation handler
│   │   └── registry.js           # Command registry and execution
│   ├── terminal/                  # Terminal emulation
│   │   └── TerminalInstance.js   # Terminal instance management
│   ├── ui/                        # User interface components
│   │   └── line-node.js          # Terminal line rendering
│   ├── utils/                     # Utility functions
│   │   ├── mobile.js             # Mobile device detection
│   │   ├── path.js               # Path manipulation utilities
│   │   └── tokenize.js           # Command tokenization
│   ├── constants.js               # Application constants
│   ├── firebase.js                # Firebase configuration and initialization
│   ├── fs.js                      # File system simulation
│   └── main.js                    # Application entry point
├── index.html                     # HTML entry point
├── script.js                      # Module loader
├── style.css                      # Application styles
├── firestore.rules                # Firebase security rules
├── .gitignore                     # Git ignore configuration
└── README.md                      # Project documentation
```

## Core Components

### Application Layer (src/app/)
**KaliApp.js**: Central application controller that orchestrates the terminal simulation, manages user sessions, handles Firebase integration, and coordinates visitor registration.

### Command Processing (src/commands/)
**registry.js**: Command registry system that maps command names to their implementations, handles command execution, and manages command validation.

**pipe.js**: Implements pipe operations allowing command output to be chained as input to subsequent commands (e.g., `ls | grep txt`).

### Terminal Emulation (src/terminal/)
**TerminalInstance.js**: Manages individual terminal instances, handles input/output operations, maintains command history, and controls terminal state.

### User Interface (src/ui/)
**line-node.js**: Renders terminal lines with proper formatting, handles prompt display, manages input fields, and controls line-level interactions.

### Utilities (src/utils/)
**mobile.js**: Detects mobile devices and adjusts UI behavior for touch interfaces.

**path.js**: Provides path manipulation utilities for simulated file system navigation (resolve, join, normalize paths).

**tokenize.js**: Parses command-line input into tokens, handling quotes, escapes, and special characters.

### Core Modules
**constants.js**: Defines application-wide constants including Firebase configuration, default values, and system settings.

**firebase.js**: Initializes Firebase SDK, configures Firestore connection, and exports database instance.

**fs.js**: Simulates a file system with directories and files, supporting navigation commands (cd, ls, pwd) and file operations.

**main.js**: Application bootstrap that initializes the KaliApp, sets up the DOM, and starts the terminal simulation.

## Architectural Patterns

### Modular Architecture
- ES6 modules with explicit imports/exports
- Clear separation of concerns across directories
- Single responsibility principle for each module

### Component-Based Design
- Terminal instances as independent components
- Reusable UI components (line-node)
- Pluggable command system via registry

### Simulation Layer
- File system abstraction (fs.js)
- Command execution simulation (registry.js)
- Terminal behavior emulation (TerminalInstance.js)

### Data Flow
1. User input → TerminalInstance
2. Command parsing → tokenize.js
3. Command lookup → registry.js
4. Command execution → specific command handler
5. Output rendering → line-node.js
6. Display update → DOM manipulation

### State Management
- Browser localStorage for user sessions
- Firebase Firestore for visitor persistence
- In-memory state for terminal instances
- Simulated file system state in fs.js

### Integration Points
- Firebase SDK for backend services
- Geolocation API for visitor tracking
- localStorage API for session persistence
- DOM API for UI rendering
