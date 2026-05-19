# Testing Strategy

PrepAI tests are designed to protect the product flows that matter in a portfolio/demo setting without calling live AI providers or mutating a real database.

## Backend Contract Tests

Run:

```bash
cd backend
npm test
```

Current coverage:

- Public health endpoint
- Internal API-key protection for backend routes
- Fitness macro calculation validation
- Daily nutrition macro validation
- Meal planner grocery-list cache read and forced refresh forwarding
- AI chat message validation, user/assistant persistence sequence, and clear history
- Body tracking validation, query defaults/forwarding, and not-found responses
- Supplement validation, default log servings, query forwarding, suggestions, and not-found responses

These tests use Node's built-in `node:test` runner and mocked service modules. That keeps the suite fast and deterministic while still testing the actual Express route contracts.

## Frontend E2E Smoke Tests

The Playwright suite lives in:

```text
frontend/tests/e2e/public-mobile.spec.js
```

It covers:

- Home page rendering
- Signed-out AI chat hidden
- Mobile menu behavior
- `SIGN IN` route navigation
- Protected route redirects when signed out
- Auth page mobile/tablet overflow checks

Install Playwright browsers before first local use:

```bash
cd frontend
npx playwright install chromium
```

Run:

```bash
cd frontend
npm run test:e2e
```

## What Is Intentionally Mocked

- AI generation calls
- Database service calls
- User upsert behavior in backend route tests

Mocking these keeps tests stable and avoids token spend. Live AI/database behavior should be covered by a separate manual smoke pass with a seeded demo account.

## Next High-Value Tests

- Signed-in Playwright flow with a seeded test account
- Meal planner tab switching while authenticated
- Pantry scan happy path with a mocked upload response
- Recipe save/export smoke test
- Backend service tests for grocery-list persistence and macro calculations
