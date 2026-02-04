# Contributing to OpenClaw Automation Hub

Thank you for your interest in contributing! We're building something amazing together.

## 🎯 How to Contribute

### 1. Reporting Bugs

Before submitting a bug report:
- Search existing issues to avoid duplicates
- Use the bug report template
- Include:
  - Clear description of the bug
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment (OS, Node.js version)
  - Screenshots if applicable

### 2. Suggesting Features

We love new ideas! Before suggesting:
- Search existing feature requests
- Explain the use case and motivation
- Describe how it should work
- Consider alternatives you've explored

### 3. Pull Requests

#### Process

1. **Fork** the repository
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/openclaw-automation-hub.git
   cd openclaw-automation-hub
   ```

3. **Create** a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make** your changes

5. **Test** your changes:
   ```bash
   npm test
   ```

6. **Commit** with a clear message:
   ```bash
   git commit -m "Add amazing feature for automation X"
   ```

7. **Push** to your fork:
   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open** a Pull Request

#### Code Style

- Use JavaScript (ES6+)
- Follow existing code patterns
- Add comments for complex logic
- Keep functions small and focused
- Write tests for new features

#### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `test` - Adding tests
- `chore` - Maintenance tasks

Example:
```
feat(dashboard): Add visual cron expression builder

Users can now visually create cron expressions without memorizing syntax.

Closes #42
```

### 4. Improving Documentation

Documentation improvements are highly valued:
- Fix typos and grammar
- Add examples
- Improve explanations
- Translate to other languages
- Update outdated information

---

## 🏗️ Development Setup

### Prerequisites

- Node.js 18+
- Git
- An OpenClaw installation (optional, for full testing)

### Quick Start

```bash
# Clone and setup
git clone https://github.com/openclaw/openclaw-automation-hub.git
cd openclaw-automation-hub

# Install dependencies
npm install

# Run tests
npm test

# Start dashboard
npm run dashboard
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node test/run.js
```

---

## 🐛 Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `feature` | New feature request |
| `enhancement` | Improvement to existing feature |
| `documentation` | Documentation changes |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `priority: high` | High priority |
| `priority: low` | Low priority |

---

## 💬 Community

- **Discord**: [Join our server](https://discord.gg/clawd)
- **Issues**: [GitHub Issues](https://github.com/openclaw/openclaw-automation-hub/issues)
- **Discussions**: [GitHub Discussions](https://github.com/openclaw/openclaw-automation-hub/discussions)

---

## 📋 Pull Request Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] All tests pass
- [ ] Commit message follows convention
- [ ] PR description clearly describes changes
- [ ] Linked related issue (if exists)

---

## 🎖️ Contributors

Thank you to all our amazing contributors! 

*(Add yourself by opening a PR with your name and link)*

---

## 📜 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

---

<div align="center">

**Questions? Start a [Discussion](https://github.com/openclaw/openclaw-automation-hub/discussions)**

</div>
