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

## Admin access

- Admin quiz question: `Is it you..?`
- Admin quiz answer: `Junior`
- Admin password: `Junior`