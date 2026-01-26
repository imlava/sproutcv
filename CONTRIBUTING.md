# Contributing to SproutCV

Thank you for your interest in contributing to SproutCV! 🌱

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/sproutcv.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Set up the development environment (see README.md)

## Development Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp env/.env.example env/.env

# Fill in your environment variables in env/.env

# Start development server
npm run dev
```

## Code Guidelines

### General

- Write clear, readable code with meaningful variable names
- Add comments for complex logic
- Follow existing code patterns and structure
- Keep functions small and focused (single responsibility)
- Write self-documenting code when possible

### TypeScript

- Use proper types, avoid `any`
- Export interfaces/types from `src/types/`
- Use strict mode
- Leverage TypeScript's type inference
- Use `const` for immutable values, `let` for mutable

### React

- Use functional components with hooks
- Keep components small and focused
- Use custom hooks for reusable logic
- Implement React.memo for performance-critical components
- Use useCallback and useMemo appropriately
- Follow component composition patterns

### Performance

- Lazy load routes and heavy components
- Implement code splitting where beneficial
- Optimize re-renders with memoization
- Use Suspense boundaries for async components

### Accessibility

- Add ARIA labels to interactive elements
- Use semantic HTML elements
- Ensure keyboard navigation works
- Maintain sufficient color contrast
- Test with screen readers when possible

### Security

⚠️ **IMPORTANT**: Never commit secrets or credentials

- All sensitive data must use environment variables
- Run `npm run lint` before committing
- The pre-commit hook will block commits with detected secrets

## Pull Request Process

1. Ensure your code passes linting: `npm run lint`
2. Test your changes thoroughly
3. Update documentation if needed
4. Create a PR with a clear description
5. Link related issues in the PR description
6. Be responsive to code review feedback

### PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

- `feat: Add new feature` - New feature
- `fix: Fix bug description` - Bug fix
- `docs: Update documentation` - Documentation only
- `refactor: Refactor code` - Code refactoring
- `style: Format code` - Code style/formatting
- `test: Add tests` - Adding tests
- `perf: Performance improvement` - Performance optimization
- `chore: Update dependencies` - Maintenance tasks
- `ci: CI/CD changes` - Build/CI changes
- `a11y: Accessibility improvement` - Accessibility enhancement

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] No breaking changes

## Related Issues
Fixes #(issue number)
```

## Reporting Issues

- Check existing issues first
- Use issue templates when available
- Provide clear reproduction steps

## Security Issues

**DO NOT** create public issues for security vulnerabilities.
See [SECURITY.md](SECURITY.md) for responsible disclosure.

## Questions?

Feel free to open a discussion or reach out at support@sproutcv.com

## Contributors

Thanks to all the amazing contributors who help make SproutCV better! 🙌

---

By contributing, you agree that your contributions will be licensed under the MIT License.
