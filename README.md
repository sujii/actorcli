#### 　
#### 　

# **ActorCLI**

A CLI tool for managing GitHub Actions workflows and environment variables.<br />
> Associate with [nektos / act](https://github.com/nektos/act) to manipulate the workflows.
#### 　
#### 　

---

## **📖 Table of Contents**

1. [Features](#-features)
2. [Configuration](#%EF%B8%8F-configuration)
   - [Environment Options](#environment-options)
3. [Quick Start](#-quick-start)
4. [Commands](#-commands)
5. [Development](#-development)
   - [Setup](#setup)
   - [Build](#build)
   - [Testing](#testing)
   - [Scripts](#scripts)
6. [Project Structure](#-project-structure)
7. [Error Handling](#%EF%B8%8F-error-handling)
8. [Contributing](#-contributing)
9. [Support](#-support)
10. [Authoer](#%EF%B8%8F-author)
11. [License](#-license)

---

## **🚀 Features**

- **🔐 Environment Management**

  - Load and sync `.env` files across environments.
  - Secure variable handling with validation.
  - Pre/post operation hooks.

- **⚙️ Workflow Management**

  - Simulate GitHub Actions workflows locally using `act`.
  - List available workflows and monitor execution status.

- **🛠️ Developer Tools**
  - Automated setup with extensible plugin support.
  - Configurable and reusable CLI hooks.

---

## **⚙️ Configuration**

You can configure `ActorCLI` using a `config.json` file:

```json
{
  "environments": ["development", "staging", "production"],
  "defaultEnv": "development",
  "hooks": {
    "pre-sync": "./scripts/pre-sync.js",
    "post-load": "./scripts/post-load.js"
  }
}
```

### **Environment Options**

- `-e, --env`: Target environment (e.g., `development`, `staging`, `production`).
- `-f, --force`: Force the operation.
- `-w, --workflow`: Workflow name to use (for `simulate`).
- `--format`: Output format for `list` (default: `table`).

---

## **⚡ Quick Start**

1. **Install ActorCLI globally**:

   ```bash
   npm install -g actorcli
   ```

2. **Initialize in your project**:

   ```bash
   cp .env.sample .env
   sudo nano .env
   ```

3. **Load environment variables**:

   ```bash
   actor load -e development
   ```

4. **List workflows**:
   ```bash
   actor list
   ```

---

## **📜 Commands**

| Command    | Description                                 | Example                    |
| ---------- | ------------------------------------------- | -------------------------- |
| `load`     | Load environment variables.                 | `actor load -e production` |
| `sync`     | Sync environment variables across services. | `actor sync -f`            |
| `simulate` | Simulate a GitHub Actions workflow locally. | `actor simulate -w build`  |
| `list`     | Show available workflows.                   | `actor list -f json`       |
| `help`     | Show help information.                      | `actor help`               |

---

## **🔧 Development**

### **Setup**

```sh
# Install dependencies
npm install
```

### **Build**

```sh
npm run build
```

### **Testing**

```sh
# Run all tests
npm test

# Run specific suite
npm test -- workflow

# Generate coverage report
npm run coverage
```

### **Scripts**

| Script   | Description             |
| -------- | ----------------------- |
| `build`  | Build the project.      |
| `dev`    | Start development mode. |
| `test`   | Run tests.              |
| `lint`   | Lint the codebase.      |
| `format` | Format the code.        |

---

## **📂 Project Structure**

```plaintext
actorcli/
├── src/
│   ├── commands/       # Command implementations
│   ├── hooks/          # Custom hooks
│   └── utils/          # Utility functions
├── tests/              # Unit and integration tests
├── docs/               # Documentation
└── scripts/            # Helper scripts for hooks
```

---

## **🛠️ Error Handling**

### **Common Issues and Solutions**

- **Invalid Environment**:

  ```plaintext
  Error: Environment 'test' not found.
  Solution: Use one of: development, staging, production.
  ```

- **Sync Failure**:

  ```plaintext
  Error: Sync failed: Permission denied.
  Solution: Check GitHub token permissions.
  ```

- **Workflow Not Found**:
  ```plaintext
  Error: Workflow 'deploy' does not exist.
  Solution: Verify the workflow name in `.github/workflows`.
  ```

---

## **🤝 Contributing**

We welcome contributions!
Follow these steps to get started:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes and commit them.
4. Submit a pull request for review.

---

## **📢 Support**

If you encounter any issues or have questions, feel free to:

- Open an issue on GitHub.
- Start a discussion in the repository.
- Refer to the official documentation.

### **What's Optimized**

- Added **Table of Contents** for easy navigation.
- Improved **Quick Start** and command references.
- Enhanced **Error Handling** and **Development** sections.
- Refined overall readability and organization.

---

## **🖋️ Author**

#### _Susumu Fujii 👋_

---

## **📜 License**

MIT License
