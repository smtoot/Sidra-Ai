
# Sidra Engineering Rules (MANDATORY)

1) No feature implementation without a Feature Spec in docs/features/.
2) Feature Spec must be reviewed/approved before coding.
3) Any DB schema change MUST include a migration.
4) Never manually modify Production DB.
5) Never edit old migrations after they are applied.
6) Use migrate dev only locally; use migrate deploy for staging/production.
7) No direct commits to main.
8) DONE means: builds OK + staging deploy OK + all acceptance criteria met.
9) **CRITICAL PRIVACY RULE**: NEVER expose PII (Email, Phone) to other users.
   - Notifications and UI must NEVER fallback to email/phone if a name is missing.
   - Use generic placeholders (e.g., 'User', 'مستخدم') or First Name only.

If unsure, ask before writing code.
Source of truth: docs/ENGINEERING_RULES.md
