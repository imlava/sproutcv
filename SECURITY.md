# Security Policy

## Reporting a Vulnerability

We take security seriously at SproutCV. If you discover a security vulnerability, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please email us at: **hello@sproutcv.app**

Include the following information:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: Within 30 days (depending on severity)

## Security Best Practices

### For Contributors

1. **Never commit secrets**
   - All API keys, tokens, and credentials must be in environment variables
   - Use `env/.env` for local development (gitignored)
   - Use `env/.env.example` as a template (no real values)

2. **Environment Variables**
   - Frontend variables must be prefixed with `VITE_`
   - Backend/Edge Functions use `Deno.env.get()`
   - Never use hardcoded fallback values for credentials

3. **Code Review**
   - All PRs require security review for auth/payment changes
   - Use the pre-commit hooks to catch accidental secret commits

### For Deployment

1. **Production Secrets**
   - Use Vercel/Netlify environment variables
   - Use Supabase Secrets for Edge Functions
   - Rotate keys periodically

2. **Supabase Security**
   - Enable Row Level Security (RLS) on all tables
   - Use service role key only in Edge Functions
   - Never expose service role key to frontend

3. **API Security**
   - Rate limiting is enabled
   - CORS is configured for production domains
   - All endpoints require authentication where applicable

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅                 |
| < 1.0   | ❌                 |

## Security Features

- **Authentication**: Supabase Auth with email verification
- **Authorization**: Row Level Security (RLS) policies
- **Data Protection**: All data encrypted at rest and in transit
- **Payment Security**: PCI-compliant payment processing via Dodo Payments
- **CAPTCHA**: hCaptcha protection on forms

## Acknowledgments

We appreciate security researchers who help keep SproutCV safe. Responsible disclosure will be acknowledged (with permission) in our release notes.
