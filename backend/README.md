# PrepAI Backend

Express backend for PrepAI.

## Scripts

- `npm run dev` - start the backend in watch mode
- `npm run start` - start the backend once
- `npm run migrate` - recreate the fresh Neon schema

## Environment

The backend expects these values in `backend/.env`:

- `PORT`
- `DATABASE_URL`
- `BACKEND_INTERNAL_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_TEXT_MODEL` (optional, defaults to `openrouter/free`)
- `UNSPLASH_ACCESS_KEY`
