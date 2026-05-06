# Engineering Decision Log

**Project**: PrepAI  
**Purpose**: Capture high-value product and engineering decisions in a way that is useful to maintainers, reviewers, and future employers.  
**Last Updated**: 2026-05-06

## What Belongs Here
- Changes that improve performance, reliability, UX quality, or maintainability.
- Fixes where the reasoning matters more than the code diff alone.
- Decisions with tradeoffs that future contributors should understand quickly.

## What Does Not Belong Here
- Tiny cosmetic edits with no lasting impact.
- Obvious refactors that are fully explained by the diff.
- Repetitive work logs or step-by-step implementation diaries.

## Entry Format
Each entry follows the same structure:
- `User Problem`: what surfaced from product behavior or user feedback
- `Root Cause`: why it was happening
- `Solution`: what changed
- `Code Notes`: where the implementation lives and what changed in code
- `Effect`: what improved

---

## 2026-05-06 14:25:31 IST
**Area**: Frontend optimization and UI performance  
**Scope**: Shared fetch flow, motion layer, homepage shell, image handling, header, build reliability

### User Problem
- The app needed targeted code optimization, animation performance cleanup, and UI refinement without making blind or risky changes.

### Root Cause
- Several pages mirrored fetched data into local state, which increased render work and triggered React lint friction.
- Motion-heavy features were always active, including on reduced-motion and coarse-pointer devices.
- The homepage marquee and shell used heavier-than-needed animation behavior.
- The frontend layout depended on remote Google font fetching, which made build verification fragile in this environment.
- Some media/UI paths were less efficient than they should be, including base64 image previews and a raw avatar image path.

### Solution
- Stabilized the shared `useFetch` hook and cleaned up fetch-driven page dependencies.
- Refactored pantry and recipe pages to derive data directly from fetch results where appropriate.
- Added a reusable media-query hook and made the custom cursor and smooth scrolling respect reduced-motion and coarse-pointer contexts.
- Replaced the JS-driven marquee with a CSS-based version and simplified unnecessary home-page motion wiring.
- Switched layout typography to curated local font stacks.
- Replaced heavy preview handling with `URL.createObjectURL`, moved the header avatar to `next/image`, and aligned host config accordingly.

### Code Notes
- [use-fetch.js](/Users/deepak/Downloads/prepAI/frontend/hooks/use-fetch.js): wrapped the shared async executor in `useCallback` so fetch consumers can depend on a stable function reference.
- [use-media-query.js](/Users/deepak/Downloads/prepAI/frontend/hooks/use-media-query.js): introduced a reusable `useSyncExternalStore`-based hook for reduced-motion and pointer capability checks.
- [CustomCursor.jsx](/Users/deepak/Downloads/prepAI/frontend/components/ui/CustomCursor.jsx) and [SmoothScroll.jsx](/Users/deepak/Downloads/prepAI/frontend/components/ui/SmoothScroll.jsx): gated motion-heavy behavior behind media-query checks instead of always enabling it.
- [Marquee.jsx](/Users/deepak/Downloads/prepAI/frontend/components/ui/Marquee.jsx) and [globals.css](/Users/deepak/Downloads/prepAI/frontend/app/globals.css): replaced JS-driven marquee movement with CSS animation and reduced-motion fallbacks.
- [layout.js](/Users/deepak/Downloads/prepAI/frontend/app/layout.js) and [page.jsx](/Users/deepak/Downloads/prepAI/frontend/app/page.jsx): removed remote font dependency and simplified home-page motion setup.
- [ImageUploader.jsx](/Users/deepak/Downloads/prepAI/frontend/components/extras/ImageUploader.jsx) and [header.jsx](/Users/deepak/Downloads/prepAI/frontend/components/extras/header.jsx): improved preview/avatar rendering paths for lighter, more robust media handling.

### Effect
- Frontend state flow is leaner and easier to reason about.
- Motion behavior is more resilient across device classes and accessibility preferences.
- Media handling is more efficient.
- Production build verification is more reliable in the current environment.

### Verification
- `frontend`: `npm run lint`
- `frontend`: `npm run build`  
  Note: build verification required one rerun outside the sandbox because Turbopack worker creation was blocked inside the sandbox.

---

## 2026-05-06 14:42:00 IST
**Area**: Pantry recipe suggestions reliability  
**Scope**: Backend recipe suggestion generation

### User Problem
- Launching pantry-based recipe suggestions could fail with an AI unavailability message instead of producing usable results.

### Root Cause
- The suggestion endpoint depended entirely on OpenRouter.
- If the provider was unavailable, rate-limited, timed out, or returned malformed JSON, the request degraded into an error state instead of a functional fallback.

### Solution
- Added a deterministic pantry-based fallback suggestion generator keyed to available ingredients and selected diet.
- Added safer JSON-array extraction for AI responses.
- Changed the backend suggestion flow to return fallback suggestions when AI is unavailable or returns invalid output.

### Code Notes
- [recipes.service.js](/Users/deepak/Downloads/prepAI/backend/src/services/recipes.service.js): added `extractJsonArray()` so partially wrapped model output can still be parsed safely.
- [recipes.service.js](/Users/deepak/Downloads/prepAI/backend/src/services/recipes.service.js): added `buildFallbackRecipeSuggestions()` with pantry-aware templates and simple ingredient scoring.
- [recipes.service.js](/Users/deepak/Downloads/prepAI/backend/src/services/recipes.service.js): changed `listRecipeSuggestions()` to return functional fallback results when OpenRouter is unavailable or malformed instead of throwing a user-facing failure.

### Effect
- The pantry-to-recipe flow remains usable even when the AI provider has a bad moment.
- AI suggestions are still preferred when they work, but the feature is no longer brittle.

### Verification
- Backend service syntax check passed.
- Runtime note: full DB-backed end-to-end verification was not possible in this shell because `DATABASE_URL` was not configured here.

---

## 2026-05-06 14:47:53 IST
**Area**: Recipe save flow reliability  
**Scope**: Recipe page save behavior, frontend action routing, backend persistence path

### User Problem
- Clicking `Save` on some recipe pages appeared to do nothing.

### Root Cause
- The recipe page save handler returned early whenever `recipeId` was missing.
- Some generated recipes could render before they had been persisted, leaving the UI with a visible save button but no database ID to send to the standard save endpoint.

### Solution
- Updated the recipe page save flow to send the full recipe payload when no `recipeId` is available.
- Added a backend route and service path to persist generated recipes on demand, then save them to the user’s collection.
- Updated the frontend save action to choose between the existing save endpoint and the new generated-recipe save endpoint.
- After successful save, the page now stores the returned `recipeId` locally so future save/remove actions use the standard path.

### Code Notes
- [page.jsx](/Users/deepak/Downloads/prepAI/frontend/app/(main)/recipe/page.jsx): changed the save handler so it no longer silently returns when `recipeId` is missing; it now submits either `recipeId` or serialized recipe data.
- [recipe.actions.js](/Users/deepak/Downloads/prepAI/frontend/actions/recipe.actions.js): updated `saveRecipeToCollection()` to route between `/:recipeId/save` and the generated-recipe save path.
- [recipes.routes.js](/Users/deepak/Downloads/prepAI/backend/src/routes/recipes.routes.js): added `POST /recipes/save-generated` for recipes that have rendered before persistence.
- [recipes.service.js](/Users/deepak/Downloads/prepAI/backend/src/services/recipes.service.js): added `ensureRecipeRecord()` and `saveGeneratedRecipeForUser()` so the backend can persist then save in one flow.

### Effect
- The save button now works for both already-persisted recipes and freshly generated recipes.
- The save/remove flow is resilient instead of assuming persistence already happened earlier in the request lifecycle.

### Verification
- Backend syntax checks passed for updated service and route files.
- `frontend`: `npm run lint`

---

## 2026-05-06 14:52:15 IST
**Area**: Notification system polish  
**Scope**: Toast presentation, typography, state styling

### User Problem
- Toasts felt generic and did not match the editorial tone of the rest of the product.

### Root Cause
- The app was still close to the default Sonner presentation, with only light icon/theme customization.
- Typography, spacing, surfaces, and status treatments were not aligned with the product’s visual direction.

### Solution
- Restyled the shared toast wrapper with custom class mappings, close-button support, and tighter presentation defaults.
- Added editorial toast styling for surface treatment, display-font titles, restrained copy styling, pill-shaped actions, and status-specific accent rails.
- Removed `richColors` so the custom system fully controls toast appearance.

### Code Notes
- [sonner.jsx](/Users/deepak/Downloads/prepAI/frontend/components/ui/sonner.jsx): mapped Sonner toast parts to product-specific class names and added better defaults such as `closeButton`, `expand`, and visibility control.
- [globals.css](/Users/deepak/Downloads/prepAI/frontend/app/globals.css): added the editorial toast surface, typography, action, and status-accent styles.
- [layout.js](/Users/deepak/Downloads/prepAI/frontend/app/layout.js): removed `richColors` from the shared toaster mount so custom styling owns the full visual result.

### Effect
- Toasts now feel integrated into the product rather than layered on top of it.
- Success, error, warning, info, and loading states are easier to scan while staying visually restrained.

### Verification
- `frontend`: `npm run lint`

---

## Review Standard
- Prefer concise entries over diary-style narration.
- Record decisions, not just activity.
- Include verification whenever a change can be validated.
- Optimize for fast scanning by someone who did not make the change.
