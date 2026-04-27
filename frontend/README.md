# PrepAI Frontend

Next.js frontend for PrepAI.

## Runs On

- Next.js 16
- Clerk
- Tailwind CSS 4
- OpenRouter vision for pantry image scan

## Required Environment

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

BACKEND_API_URL=http://127.0.0.1:4000/api
BACKEND_INTERNAL_API_KEY=

OPENROUTER_API_KEY=
OPENROUTER_VISION_MODEL=openrouter/free
```

## Local Development

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Notes

- Pantry scan uses OpenRouter from server actions.
- App data is loaded through the Express backend, not directly from the database.
