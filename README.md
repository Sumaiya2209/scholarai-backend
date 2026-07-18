# ScholarAI — Backend

Express + TypeScript + MongoDB + Better Auth + Groq (AI) backend for the ScholarAI research paper platform.

## Setup

```bash
npm install
cp .env.example .env   # then fill in the values below
npm run dev
```

## Filling `.env`

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | MongoDB connection string; include a database name like `mongodb://localhost:27017/scholarai` or `mongodb+srv://user:pass@cluster.mongodb.net/scholarai` |
| `MONGODB_DB_NAME` | optional if `MONGODB_URI` does not already include a database name; sets the DB name used by Mongoose and Better Auth |
| `BETTER_AUTH_SECRET` | any long random string (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google Cloud Console → OAuth 2.0 Client → redirect URI: `http://localhost:5000/api/auth/callback/google` |
| `CLOUDINARY_*` | cloudinary.com dashboard |
| `GROQ_API_KEY` | console.groq.com (free tier) |

## Making yourself an admin

Better Auth stores users in the `user` collection. After you register normally through the frontend once, open MongoDB Atlas (or Compass) and manually flip your role:

```js
db.user.updateOne({ email: "your-email@example.com" }, { $set: { role: "admin" } })
```

Admins can now approve/reject papers via `/api/admin/*`.

## Demo login (for the assignment's "auto-fill demo credentials" requirement)

Better Auth doesn't need a special backend route for this — just:
1. Register one throwaway account normally (e.g. `demo@scholarai.com` / `Demo1234!`).
2. On the frontend login page, hardcode a "Try Demo Account" button that fills those same credentials into the form and submits.

## API overview

**Auth** (handled entirely by Better Auth)
- `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`
- `GET /api/auth/sign-in/google` (redirect flow)
- `GET /api/auth/get-session`
- `POST /api/auth/sign-out`

**Papers**
- `GET /api/papers` — public list, query params: `search, field, sort, page, limit`
- `GET /api/papers/mine` — logged-in user's own submissions
- `POST /api/papers` — multipart form: `title, abstract, authors, field, file` (PDF)
- `GET /api/papers/:id` — details page
- `GET /api/papers/:id/related` — related papers by field
- `DELETE /api/papers/:id` — owner or admin

**Admin**
- `GET /api/admin/papers/pending`
- `PATCH /api/admin/papers/:id/approve` — also runs AI summarization
- `PATCH /api/admin/papers/:id/reject` — body: `{ reason }`

**AI Chat**
- `GET /api/chat/:paperId` — this user's conversation history for a paper
- `POST /api/chat/:paperId` — body: `{ message }`, returns AI reply

## Notes for the frontend

- Send `credentials: "include"` on every fetch/axios call so the Better Auth session cookie is sent.
- `req.user.role` is available on every authenticated request (`"user" | "admin"`) — use it to conditionally show admin nav links.
