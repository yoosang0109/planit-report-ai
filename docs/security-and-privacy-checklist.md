# Security & Privacy Checklist (MVP)

## Current guardrails
- API payloads validated with Zod before DB writes.
- Prisma ORM used for DB access (no raw SQL in app routes).
- AI error logging now sanitized to `name + message` (no full object dump).
- Seed data uses demo-only fake parent phone numbers.

## Risks to track
1. No authentication/authorization yet (all APIs are effectively open in local MVP).
2. Parent name/phone are stored in plaintext DB fields.
3. `OPENAI_API_KEY` handling relies on env management discipline.

## MVP next actions
- Add simple auth gate (at least session-based teacher login).
- Mask phone number in list/detail UI by default.
- Add request logging policy: avoid raw request body logs.
- Add retention policy for reports containing student performance notes.
