# FitPro Gym Dashboard

A lightweight, mobile-first PWA for gym owners to track members, payments, and automated reminders.

## 🚀 Setup & Deployment

### 1. Supabase Setup
1. Create a new project on [Supabase](https://supabase.com).
2. Go to **SQL Editor** and run the following migration files in order:
   - `supabase/migrations/0000_initial.sql`
   - `supabase/migrations/0001_add_due_date.sql`
   - `supabase/migrations/0002_add_frozen.sql`
   - `supabase/migrations/0003_cron.sql`
3. Go to **Authentication -> Users** and create two users:
   - One for the Owner.
   - One for the Sub-Admin.
4. Manually insert these users into the `profiles` table via the SQL Editor or Table Editor:
   ```sql
   INSERT INTO profiles (id, role, name) VALUES 
   ('owner-uuid-here', 'owner', 'Admin Name'),
   ('subadmin-uuid-here', 'subadmin', 'Subadmin Name');
   ```

### 2. Resend Setup (Email Reminders)
1. Create an account on [Resend](https://resend.com).
2. Generate an API Key.
3. Verify your sending domain (e.g., `gym.com`) if you want to send from a custom email, otherwise testing emails will only send to your verified address.

### 3. Edge Function Deployment
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Set the Resend API secret:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```
5. Deploy the function:
   ```bash
   supabase functions deploy send-reminders
   ```

### 4. Environment Variables
Create a `.env.example` file in the root of the project to track required vars:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Frontend Deployment (Vercel / Netlify)
1. Push the code to GitHub.
2. Connect the repository to a free static host like Vercel or Netlify.
3. Ensure the Build Command is `npm run build` and Output Directory is `dist`.
4. Add the Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in the host's settings.

---

## 📱 How to Install the PWA

**On Android (Chrome):**
1. Open the deployed website in Chrome.
2. Tap the three dots (menu) in the top right.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. The app will appear in your app drawer.

**On iPhone (Safari):**
1. Open the deployed website in Safari.
2. Tap the Share icon (square with an arrow pointing up) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. The app will appear on your home screen and run in full screen without browser UI.
