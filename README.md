# NBIU Convocation Survey — Admin Dashboard

A responsive, premium-style dashboard for reviewing **real survey submissions only**. No seeded or fabricated student records are included.

## Dashboard features
- Supabase Auth email/password sign-in and sign-out
- Live response loading from the `convocation_survey` table
- Dashboard totals and live venue/contact analytics
- Search across student, department, batch, contact and suggestions
- Department and venue filters
- Individual response detail modal, including suggested venue and comments
- CSV export for all loaded responses, filtered responses, selected responses, or one response
- Responsive mobile sidebar and refresh control
- Escaped database content when rendered in the table and detail view

## Configure Supabase

1. Open `admin.js` and set `SUPABASE_URL` to your project URL and `SUPABASE_ANON_KEY` to the project's **anon/publishable** key.
2. Keep `SUPABASE_TABLE = "convocation_survey"` aligned with the table used by the public survey form. If your real table has a different name, update this constant.
3. In Supabase Authentication, create/invite only the administrator account(s) that should access student data. Disable public sign-ups if they are not needed.
4. Configure Row Level Security (RLS) on the survey table. The dashboard intentionally does not bypass RLS. Use an explicit administrator allowlist policy, replacing the example email with the real admin email:

```sql
alter table public.convocation_survey enable row level security;

create policy "Only approved survey admins can read responses"
on public.convocation_survey
for select
to authenticated
using (
  (auth.jwt() ->> 'email') = 'replace-with-admin@example.com'
);
```

If the table already has a policy, review it rather than blindly adding duplicate policies. Do not grant public/anon read access to student submissions. Only add additional write policies if administrators genuinely need those operations.

5. Confirm the table has the expected columns (the dashboard tolerates common naming variations): `id`, `full_name`, `department`, `batch`, `phone` and/or `email`, `registration_status`, `preferred_venue`, `suggested_venue`, `opinion`, and `created_at`.
6. Deploy the static files together (`index.html`, `admin.css`, `admin.js`, and the existing logo asset) using GitHub Pages or your static host. Use HTTPS.

## Security notes
- **Never put a Supabase `service_role` key in frontend code.** Use only the anon/publishable key with Auth and restrictive RLS.
- Do not enable a broad policy such as `using (true)` for all authenticated users on student records.
- This dashboard is read-only: it does not edit or delete submissions.
- CSV files can contain personal information. Keep downloads private and delete them when no longer needed.
- Browser-side pagination operates on the records returned by Supabase; for a very large survey, implement server-side pagination and export.

## Troubleshooting
- **Sign-in screen says setup required:** add the project URL and anon/publishable key in `admin.js`.
- **Sign-in works but records fail to load:** check the table name, column names, RLS SELECT policy, and browser console.
- **No records appear:** confirm the public form is writing to `public.convocation_survey` and the administrator account matches the allowlist policy.
- **Department filter is empty or mismatched:** adjust the dropdown options in `index.html` to match the actual department values in your survey.
