# NBIU Convocation Survey — Admin UI

Responsive admin dashboard mockup with sample/demo records.

## Features
- Dashboard summary cards and venue preference chart
- Search by name, contact, department, batch, or response ID
- Filter by department and venue preference
- View full details for an individual response
- Download a single response as CSV
- Select multiple responses and download selected CSV
- Download all demo responses or filtered results as CSV
- Mobile responsive layout
- Supabase integration placeholders in `admin.js`

## Run
Open `index.html` in a browser or use VS Code Live Server.

## Before production
This currently uses demo data only and does not connect to Supabase. Connect Supabase Auth, replace demo records with authorized database queries, add pagination and server-side full-sheet export, and configure Row Level Security (RLS). Never expose a `service_role` key in frontend code. Charts and headline statistics are illustrative.
