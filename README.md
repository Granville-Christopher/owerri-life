# Owerri Life

A browser life sim set in Owerri, built with Next.js.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The city is stored in MongoDB. Put your connection string in `.env.local` (this file stays off git):

```
MONGODB_URI=your-connection-string
SESSION_SECRET=a-long-random-string
```

On Vercel, add the same `MONGODB_URI` and a long `SESSION_SECRET` in the project settings. The live site will not sign people in without `SESSION_SECRET`.
