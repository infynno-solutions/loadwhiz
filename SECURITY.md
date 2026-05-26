# Security Policy

## Supported Versions

We release security fixes for the latest version on the default branch (`main`).
Older tags and forks are not actively supported unless stated in a release note.

| Version | Supported          |
| ------- | ------------------ |
| latest on `main` | :white_check_mark: |
| older tags       | :x:                |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Report security issues privately so we can assess and patch them before disclosure:

1. Email **security@infynno.com** with:
   - A description of the issue and impact
   - Steps to reproduce (proof of concept if available)
   - Affected components (API, web app, workers, etc.)
   - Your contact information for follow-up

2. You should receive an acknowledgment within **5 business days**.

3. We will work with you on a timeline for fix and coordinated disclosure when appropriate.

## Scope

In scope for this policy:

- Authentication, authorization, and session handling in the API and web app
- Organization and user data isolation
- Host verification and load test execution paths
- Dependency vulnerabilities introduced by this repository's code or configuration

Out of scope (unless they directly compromise LoadWhiz):

- Third-party services (e.g. email providers) misconfiguration on your deployment
- Social engineering or physical access to your infrastructure
- Denial-of-service attacks against deployments you operate

## Secure Deployment Reminders

When self-hosting LoadWhiz:

- Set strong, unique values for `JWT_SECRET` and database credentials
- Do not commit `.env` files or secrets to version control
- Restrict Docker socket access for Celery/k6 workers to trusted environments
- Keep dependencies updated (`bun install`, `poetry update`) and monitor advisories

Thank you for helping keep LoadWhiz and its users safe.
