# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes    |

## Reporting a Vulnerability

If you discover a security vulnerability in ResumeCraft AI, please **do not** open a public issue.

Instead, please report it responsibly:

1. **Email**: Open a private GitHub Security Advisory
2. **Go to**: [Security Advisories](https://github.com/Pavan-SCI/AI-Powerd-resume-screening/security/advisories/new)
3. Provide a clear description of the vulnerability
4. Include steps to reproduce if possible

We will respond within **48 hours** and work to resolve the issue promptly.

## Security Best Practices for Users

- **Never commit your API keys** to the repository
- Store your Gemini API key only via the Settings page (saved in `localStorage`)
- Do not share your browser's `localStorage` data with others
- Use the app only on trusted devices

## Scope

This is a client-side only application. All data is stored locally in your browser. No data is sent to any server other than the Google Gemini API when in live mode.
