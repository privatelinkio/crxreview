# Contributing to CRX Review

Thank you for your interest in contributing to CRX Review! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Style Guide](#style-guide)
8. [Documentation](#documentation)
9. [Questions or Need Help?](#questions-or-need-help)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to conduct@example.com.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- Git for version control
- A GitHub account
- A code editor (VS Code recommended)

### First Time Setup

1. **Fork the Repository**:
   - Visit https://github.com/yourusername/crxreview
   - Click "Fork" button
   - Clone your fork locally

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/yourusername/crxreview.git
   cd crxreview
   ```

3. **Add Upstream Remote**:
   ```bash
   git remote add upstream https://github.com/originalowner/crxreview.git
   git fetch upstream
   ```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler |
| `npm test` | Run unit tests |

### IDE Setup

#### VS Code Recommended Extensions

- ESLint (dbaeumer.vscode-eslint)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- TypeScript Vue Plugin (Vue)
- EditorConfig (EditorConfig.EditorConfig)
- Prettier (esbenp.prettier-vscode)

#### VS Code Settings

Create or update `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Making Changes

### Create a Branch

Always create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

**Branch Naming Conventions**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions
- `chore/description` - Build, dependencies, etc.

### Code Changes

1. **Make your changes** to the codebase
2. **Keep commits atomic**: Each commit should be a logical unit
3. **Write descriptive messages**: Explain the "why" not just the "what"
4. **Test your changes** before pushing
5. **Keep changes focused**: One feature per branch when possible

### Code Style

We use ESLint and Prettier for consistent code style. They run automatically:

1. **Before commits**: Pre-commit hooks lint changed files
2. **In IDE**: ESLint provides real-time feedback
3. **On build**: TypeScript catches type errors

To manually check code:

```bash
npm run lint
npm run type-check
```

### File Organization

New files should follow project structure:

```
src/
├── components/     # React components
├── hooks/         # Custom React hooks
├── lib/           # Core libraries
├── pages/         # Route components
├── store/         # State management
├── types/         # Type definitions
└── utils/         # Utility functions
```

## Testing

### Run Tests

```bash
npm test
```

### Writing Tests

1. **Test files**: Place in `__tests__` directory or alongside source
2. **Naming**: Use `*.test.ts` or `*.test.tsx` pattern
3. **Structure**: Describe what component/function does
4. **Assertions**: Test behavior, not implementation

Example test structure:

```typescript
describe('FunctionName', () => {
  it('should do expected behavior', () => {
    // Arrange
    const input = /* test data */;

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it('should handle edge cases', () => {
    // ...
  });
});
```

### Test Coverage

Aim for:
- Core utilities: 90%+ coverage
- Business logic: 80%+ coverage
- UI components: Behavior-focused tests
- Edge cases: Explicitly tested

## Submitting Changes

### Prepare Your PR

1. **Sync with upstream**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**:
   ```bash
   npm run lint
   npm run type-check
   npm test
   npm run build
   ```

3. **Fix any issues** before pushing

### Push Your Changes

```bash
git push origin feature/your-feature-name
```

### Create Pull Request

1. Go to GitHub and create a pull request
2. Use the PR template (auto-filled)
3. Complete all required sections
4. Link related issues

### PR Description Template

```markdown
## Description
Brief description of the changes and why they're needed.

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes
- Change 1
- Change 2
- Change 3

## Testing
Steps to test the changes:
1. Step 1
2. Step 2

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review of code completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] All tests passing
```

### PR Review Process

1. **Automated Checks**: GitHub Actions runs tests
2. **Code Review**: Maintainers review changes
3. **Address Feedback**: Update PR based on reviews
4. **Approval**: Need at least one approval
5. **Merge**: PR is merged after approval

## Style Guide

### TypeScript/JavaScript

- **Formatting**: Prettier handles automatic formatting
- **Linting**: ESLint enforces rules
- **Types**: Use TypeScript, not JSDoc
- **Naming**:
  - Variables/functions: camelCase
  - Classes/types: PascalCase
  - Constants: UPPER_SNAKE_CASE
  - Private methods: _leadingUnderscore

Example:

```typescript
// Good
const getUserData = async (userId: string): Promise<User> => {
  const response = await fetch(`/api/users/${userId}`);
  return response.json();
};

// Avoid
const get_user_data = function(userId){
  return fetch("/api/users/" + userId).then(r => r.json());
};
```

### React Components

- **Functional Components**: Use hooks, not class components
- **Props**: Define TypeScript interface for props
- **Hooks**: Use custom hooks for logic
- **Naming**: PascalCase for components

Example:

```typescript
interface ButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  label,
  disabled = false
}) => (
  <button onClick={onClick} disabled={disabled}>
    {label}
  </button>
);
```

### CSS/Tailwind

- Use Tailwind utility classes
- Minimize custom CSS
- Use consistent spacing scale
- Responsive design mobile-first

Example:

```typescript
<div className="max-w-md mx-auto p-4 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <p className="mt-2 text-gray-600">Description</p>
</div>
```

### Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Test addition
- `chore`: Build, dependencies

Example:

```
feat(search): add regex support to file search

- Add regex pattern parsing
- Update ContentSearch component
- Add tests for regex patterns

Closes #456
```

## Documentation

### Code Comments

- Comment the "why" not the "what"
- Use JSDoc for public functions
- Keep comments up-to-date with code

Example:

```typescript
/**
 * Convert CRX file to extractable ZIP format
 * CRX files have a header and signature that must be removed
 *
 * @param crxData - Raw CRX file buffer
 * @returns ZIP data ready for extraction
 */
function convertCrxToZip(crxData: ArrayBuffer): ArrayBuffer {
  // Skip the 16-byte CRX header
  const headerSize = 16;
  const pubKeySize = new DataView(crxData).getUint32(8, true);
  // ...
}
```

### README Updates

If your changes affect:
- Installation instructions
- Feature set
- Configuration options
- Build process

Update the main README.md accordingly.

### API Documentation

For new public APIs:
- Add JSDoc comments
- Update API_REFERENCE.md
- Include usage examples

## Submitting Bug Reports

When reporting bugs:

1. **Check existing issues**: Avoid duplicates
2. **Use bug template**: Provide detailed info
3. **Include**:
   - Clear description of the bug
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser and OS info
   - Error messages/screenshots
   - Test case if possible

4. **Example**:
   ```
   **Description**: Large CRX files cause memory issues

   **Steps to Reproduce**:
   1. Open CRX Review
   2. Upload a 500MB CRX file
   3. Wait for parsing

   **Expected**: File loads in ~30 seconds
   **Actual**: Browser crashes

   **Environment**: Chrome 120, macOS 14, 16GB RAM
   **Error**: Out of memory
   ```

## Submitting Feature Requests

When requesting features:

1. **Clear description**: What and why
2. **Use cases**: How would it help
3. **Examples**: Show expected behavior
4. **Alternatives**: Any existing workarounds
5. **Examples**:
   - "Add extension comparison view"
   - "Support for WebAssembly analysis"
   - "Export detailed security report"

## Questions or Need Help?

### Getting Help

1. **Check Documentation**: Review docs first
2. **Search Issues**: Look for similar questions
3. **Discussions**: Post in GitHub Discussions
4. **Email**: Contact maintainers if needed

### Debugging Tips

1. **Use DevTools**: Browser dev tools for UI issues
2. **Check Console**: Look for error messages
3. **Use Debugger**: Set breakpoints in VS Code
4. **Add Logs**: Use console.log strategically
5. **Network Tab**: Check API calls and responses

### Common Issues

**Build Fails**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**HMR Not Working**:
```bash
# Restart dev server
npm run dev
# Check browser console for errors
```

**Tests Fail**:
```bash
# Run in verbose mode
npm test -- --verbose
# Run specific test
npm test -- filename.test.ts
```

## Recognition

Contributors are recognized in:
- CHANGELOG.md in release notes
- GitHub contributors page
- Project README acknowledgments section
- Annual contributor appreciation

## License

By contributing, you agree that your contributions will be licensed under the same MIT License as the project.

## Questions?

Feel free to reach out! The best way:

1. Open an issue for discussion
2. Ping maintainers in comments
3. Email for private concerns
4. Check existing discussions

Thank you for contributing to CRX Review!
