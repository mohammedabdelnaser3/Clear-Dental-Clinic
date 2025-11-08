# Git Hooks Setup Guide

## Overview
This guide helps you set up automated code quality checks before commits.

## Option 1: Using Husky (Recommended)

### Install Husky
```bash
npm install --save-dev husky
npx husky install
npm pkg set scripts.prepare="husky install"
```

### Add Pre-commit Hook
```bash
npx husky add .husky/pre-commit "npm run lint-staged"
```

### Install lint-staged
```bash
npm install --save-dev lint-staged
```

### Add to package.json
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "git add"
    ],
    "*.{ts,tsx,js,jsx,json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

## Option 2: Manual Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh

echo "🔍 Running pre-commit checks..."

# Run linter
npm run lint --silent
LINT_EXIT_CODE=$?

if [ $LINT_EXIT_CODE -ne 0 ]; then
  echo "❌ Linting failed. Please fix errors before committing."
  echo "💡 Tip: Run 'npm run lint -- --fix' to auto-fix some issues"
  exit 1
fi

# Run tests
npm test --silent --passWithNoTests
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "❌ Tests failed. Please fix failing tests before committing."
  exit 1
fi

echo "✅ Pre-commit checks passed!"
exit 0
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

## Option 3: GitHub Actions CI/CD

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test -- --coverage
    
    - name: Build
      run: npm run build
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
```

## VS Code Integration

### Recommended Extensions
- ESLint
- Prettier
- Jest Runner
- Error Lens

### VS Code Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.tsdk": "node_modules/typescript/lib",
  "jest.autoRun": "off"
}
```

## Recommended Workflow

1. **Before Committing**
   ```bash
   npm run lint -- --fix    # Fix auto-fixable issues
   npm test                 # Run tests
   npm run build            # Ensure build works
   ```

2. **Commit with Meaningful Message**
   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

3. **Push to Remote**
   ```bash
   git push origin feature-branch
   ```

## Benefits

- 🚀 **Catch errors early** - Before they reach CI/CD
- 🧹 **Consistent code style** - Automated formatting
- ✅ **Confidence** - Tests run automatically
- ⚡ **Fast feedback** - Issues found immediately
- 👥 **Team alignment** - Everyone follows same standards
