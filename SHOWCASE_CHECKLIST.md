# PrepAI Showcase Checklist

Use this before sending the project to employers or recording a demo.

## Must Pass

- [ ] Frontend lint passes: `cd frontend && npm run lint`
- [ ] Frontend build passes: `cd frontend && npm run build`
- [ ] Frontend E2E smoke passes: `cd frontend && npm run test:e2e`
- [ ] Backend tests pass: `cd backend && npm test`
- [ ] Backend starts: `cd backend && npm start`
- [ ] No secrets are committed
- [ ] Demo account exists with realistic data
- [ ] Deployed frontend URL works
- [ ] Deployed backend health endpoint works

## Demo Data

Prepare one account with:

- [ ] Fitness profile completed
- [ ] 8-12 pantry items
- [ ] At least 2 saved recipes
- [ ] One generated weekly meal plan
- [ ] One saved grocery list
- [ ] 3-5 nutrition logs
- [ ] 2-3 body measurements
- [ ] 2-4 supplements
- [ ] A short AI coach chat history

## Demo Flow

1. Landing page: explain PrepAI in one sentence.
2. Pantry: show manual items and image scan.
3. Recipe suggestions: generate from pantry context.
4. Recipe detail: show nutrition, instructions, save, and PDF export.
5. Fitness profile: show macro targets.
6. Meal planner: show Weekly Plan and Grocery List tabs.
7. Nutrition/body/supplements: show tracking workflows.
8. Progress: show the dashboard summary.
9. AI coach: ask a contextual question.

## Talking Points

- Full-stack product with Next.js, Express, Postgres, Clerk, and OpenRouter
- AI used in practical places: scan, recipes, meal plans, grocery lists, coach
- Saved grocery generation reduces repeated token spend
- Authenticated user-specific data across multiple domains
- Mobile-first UX improvements across chat, meal planner, forms, cards, and navigation
- Product restraint: existing features polished instead of adding feature bloat

## Known Gaps To Mention Honestly

- Automated end-to-end testing is still the next major improvement
- AI outputs depend on provider availability and configured model quality
- The public demo should use safe seeded data, not a personal account
