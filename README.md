# School ID System

A polished parent registration portal that saves student details and passport photos, provides a private edit link, creates a printable ID card PDF, and gives staff a searchable review page.

## Deploy to Vercel + Supabase

1. In Supabase, open **SQL Editor**, run `database.sql`, then copy the project URL and **service_role** key from **Settings → API**.
2. In Vercel, import this GitHub repository. In **Settings → Environment Variables**, add every value in `.env.example`. Never put the service-role key in frontend code or commit it to GitHub.
3. Deploy. Your parent form is at `/`; staff can search records at `/staff.html` using `ADMIN_ACCESS_KEY`.

## Local run

Install Node.js 20+, then run `npm install`, copy `.env.example` to `.env`, fill in the values, and run `npm run dev`.

## Parent editing

After a parent submits, the confirmation screen displays a private edit URL. Anyone holding that URL can edit that one record until staff approves it, so parents should not share it. For production, add SMS/email OTP and a privacy notice before accepting real student data.
