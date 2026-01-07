---
description: Verify code changes locally before pushing to CI to prevent build failures.
---
# Pre-Push Verification Workflow

Follow these steps before every push to ensuring a green build.

1. **Lint Check**: Run linting across the entire monorepo to catch type errors and style issues.
// turbo
npx turbo run lint

2. **Build Check**: Ensure all apps and libs compile successfully.
// turbo
npx turbo run build

3. **Test Check**: Run unit/integration tests (optional but recommended for logic changes).
// turbo
npx turbo run test

If any step fails, FIX the errors locally before pushing. DO NOT PUSH BROKEN CODE.
