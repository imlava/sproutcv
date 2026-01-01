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

### TypeScript

- Use proper types, avoid `any`
- Export interfaces/types from `src/types/`
- Use strict mode

### React

- Use functional components with hooks
- Keep components small and focused
- Use custom hooks for reusable logic

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

### PR Title Format

- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `refactor: Refactor code`
- `style: Format code`
- `test: Add tests`

## Reporting Issues

- Check existing issues first
- Use issue templates when available
- Provide clear reproduction steps

## Security Issues

**DO NOT** create public issues for security vulnerabilities.
See [SECURITY.md](SECURITY.md) for responsible disclosure.

## Questions?

Feel free to open a discussion or reach out at support@sproutcv.com

---

By contributing, you agree that your contributions will be licensed under the MIT License.
