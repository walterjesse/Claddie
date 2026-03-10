# Claddie KENYA

Claddie KENYA is a single-page React + Vite storefront for managing shoes, customer accounts, checkout, invoices, tracking, and the private admin dashboard.

## Local editing on a desktop machine

1. Install Node.js 20 or later.
2. Open the project folder in VS Code or another desktop editor.
3. Open a terminal in the project folder.
4. Run `npm install`.
5. Run `npm run dev` to start the local development server.
6. Open the local address shown in the terminal.

## Production build

1. Run `npm run build`.
2. Deploy the generated `dist/index.html` file.

This project uses a single-file Vite build, so the production output is compact and easy to upload.

## Deployment notes

- The app uses in-app routing with the `?route=` query pattern, so it works without special server rewrite rules.
- If you use EmailJS for password recovery, enter your EmailJS credentials in the admin settings before going live.
- Browser storage is used for app data unless you connect your own shared backend.

## Supabase integration

If you'd like to store shop data in a shared database instead of browser
storage, the project is already set up to use Supabase.  
1. Create a `.env` file in the project root with the following variables:
   ```env
   VITE_SUPABASE_URL=https://eyaucwnbtagjlgdrstnm.supabase.co
   VITE_SUPABASE_KEY=sb_publishable_LO4ioPtLY_3cyGi9DdEJew_aCZqxHD6
   ```
   (the direct Postgres connection string is shown below for reference, but
   it should **never** be committed.)
2. Restart the dev server so Vite can pick up the new variables.
3. You can now access the Supabase client from `src/lib/supabase.ts` and
   query tables such as `products`, `orders`, etc.  Example code is added in
   `src/App.tsx`.

The database password is `{Ruaraka_2026}` and the connection string is:

```
postgresql://postgres:Ruaraka_2026@db.eyaucwnbtagjlgdrstnm.supabase.co:5432/postgres
```

Make sure the `.env` file remains private.  On GitHub Pages deployment the
workflow builds the site and does **not** publish this file.

You’ll also want to supply the same values as **GitHub Actions secrets** so
the site can access Supabase in production.  In the repository settings add
`VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` under **Secrets → Actions**.

### Initial database setup

Before the app can read or write data, create the necessary tables using one
of the following methods:

1. **Supabase SQL editor**
   - Open your project at
     `https://app.supabase.com/project/eyaucwnbtagjlgdrstnm`.
   - Go to **SQL → New query**.
   - Paste the contents of `db/schema.sql` and run the script.

2. **Postgres CLI (`psql`) or other client**
   ```bash
   psql "postgresql://postgres:Ruaraka_2026@db.eyaucwnbtagjlgdrstnm.supabase.co:5432/postgres" \
     -f db/schema.sql
   ```

The migration logic in `src/App.tsx` will automatically populate these tables
with any data that currently lives in browser storage when you next start the
dev server.  After the migration runs, the localStorage keys are cleared so
the process only occurs once.

## Admin access

- Admin quiz question: `Is it you..?`
- Admin quiz answer: `Junior`
- Admin password: `Junior`