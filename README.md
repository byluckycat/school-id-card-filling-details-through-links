# School ID System

A parent registration portal for collecting student details and passport photos, generating printable ID cards, and giving staff a searchable review page.

## 1. Set up Supabase

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor → New query** and paste the complete contents of [`database.sql`](./database.sql). Click **Run**. This creates the `students` table, enables row-level security, and creates the `student-photos` storage bucket.
3. Open **Project Settings → API**. Copy the **Project URL** and the **service_role secret key**. The service-role key is server-only: never put it in `public/`, browser JavaScript, GitHub, or a `NEXT_PUBLIC_` variable.

The API intentionally uses the service-role key on the server. The database has no public table policy, so parents cannot query all student records from the browser. They can access only the record addressed by their private edit token through the API.

## 2. Configure Vercel

Import this GitHub repository into Vercel. In **Project Settings → Environment Variables**, add these values for **Production, Preview, and Development**:

| Name | Value |
| --- | --- |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service-role secret |
| `ADMIN_ACCESS_KEY` | A long, random staff-only password |
| `SITE_URL` | Your Vercel website URL |

Leave **Build Command** and **Output Directory** blank. Set **Root Directory** to `/` and **Framework Preset** to **Other**, then deploy the latest `main` branch.

The parent form is at `/`. The staff search page is at `/staff.html`; staff must enter `ADMIN_ACCESS_KEY`. After a submission, the parent receives a private edit URL that can update the record and photo until the school approves it.

## 3. Local development

Install Node.js 20, run `npm install`, copy `.env.example` to `.env`, fill in the four values, and run `npm run dev`. Open `http://localhost:3000`.

## Privacy and production checklist

Student records and photographs are personal information. Use HTTPS, restrict the staff key, enable Supabase backups, and add a school privacy notice and parent consent before collecting live data. Anyone with a private edit URL can edit that record, so parents must not share their link. Add OTP verification before production use.
