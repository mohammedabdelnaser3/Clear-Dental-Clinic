# Contributing to DentalPro Manager

Thank you for your interest in contributing to DentalPro Manager! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to uphold our Code of Conduct, which expects all contributors to maintain a respectful and inclusive environment.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. Before creating a bug report, please check if the issue has already been reported. When you create a bug report, please include as many details as possible:

- A clear and descriptive title
- Steps to reproduce the behavior
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Your environment (OS, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are also tracked as GitHub issues. When suggesting an enhancement, please include:

- A clear and descriptive title
- A detailed description of the proposed functionality
- Any potential implementation details you can provide
- Why this enhancement would be useful to most users

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bugfix
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Submit a pull request

## Development Setup

Please refer to the [Developer Guide](./DEVELOPER_GUIDE.md) for detailed instructions on setting up the development environment.

## Coding Guidelines

### JavaScript/TypeScript

- Follow the ESLint configuration provided in the project
- Use TypeScript for all new code
- Write meaningful variable and function names
- Add JSDoc comments for functions and complex code blocks

### React

- Use functional components and hooks
- Keep components small and focused on a single responsibility
- Use the provided UI components from the component library

### CSS/Styling

- Use Tailwind CSS for styling
- Follow the design system and use existing color variables
- Ensure responsive design for all new UI components

### Testing

- Write tests for all new features
- Maintain or improve code coverage
- Test across different browsers and devices when applicable

## Git Workflow

### Branch Naming

- `feature/short-description` for new features
- `bugfix/issue-number-short-description` for bug fixes
- `docs/short-description` for documentation changes
- `refactor/short-description` for code refactoring

### Commit Messages

Follow the conventional commits specification:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding or modifying tests
- `chore:` for maintenance tasks

### Pull Request Process

1. Update the README.md or documentation with details of changes if applicable
2. Update the CHANGELOG.md following the Keep a Changelog format
3. The PR must be approved by at least one maintainer
4. PRs will be merged by a maintainer after approval

## Release Process

The project follows Semantic Versioning. The release process is managed by the core team and includes:

1. Updating the CHANGELOG.md
2. Creating a new version tag
3. Building and deploying the new version

## Questions?

If you have any questions about contributing, please open an issue with the label "question".

Thank you for contributing to DentalPro Manager!