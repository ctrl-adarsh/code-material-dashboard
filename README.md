# 🧠 Coding Brain

**Coding Brain** is an AI-powered curriculum builder that turns your scattered bookmarks into a structured learning path.

Paste a link from **YouTube, Medium, React Docs, or any blog**, and the app uses **Google Gemini AI** to analyze the content, generate a summary, assign difficulty levels, and categorize it into topics (like "System Design", "Graph Algorithms", or "CSS").

## ✨ Features

- **Universal Import:** Works with YouTube videos, Blogs, Documentation, and Articles.
- **AI Analysis:** Automatically extracts:
- **Topic** (e.g., Arrays, DP, React)
- **Difficulty** (Easy, Medium, Hard)
- **Summary** (10-word concise overview)
- **Tags**

- **Smart Library:** Automatically groups your resources into a structured curriculum based on topics.
- **Optimistic UI:** Instant feedback with Toast notifications.
- **Visual Cards:** Auto-fetches video thumbnails and generates beautiful gradient cards for articles.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), React Router, Lucide Icons
- **Backend:** Supabase (PostgreSQL, Edge Functions, Auth)
- **AI Engine:** Google Gemini (Gemini Pro/Flash)
- **Deployment:** Vercel (Frontend), Supabase (Backend)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/coding-brain.git
cd coding-brain
cd coding-dashboard
npm install

```

### 2. Set Up Supabase (Backend)

1. Create a new project at [database.new](https://database.new).
2. Go to the **SQL Editor** in the sidebar and run this script to create the table:

```sql
create table completed_videos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid default auth.uid(),
  url text not null,
  title text,
  thumbnail text,
  status text default 'completed',
  topic text,
  difficulty text,
  summary text,
  tags text[],
  content_type text
);

-- Optional: Enable Row Level Security (RLS) if you want users to only see their own data
alter table completed_videos enable row level security;

create policy "Users can see their own videos"
on completed_videos for select
using ( auth.uid() = user_id );

create policy "Users can insert their own videos"
on completed_videos for insert
with check ( auth.uid() = user_id );

create policy "Users can delete their own videos"
on completed_videos for delete
using ( auth.uid() = user_id );

```

3. **Enable Anonymous Sign-ins:**

- Go to **Authentication** > **Providers**.
- Toggle **Anonymous Sign-ins** to **ON**.

### 3. Deploy the Edge Function (The Brain)

This function handles the scraping and AI analysis.

1. Install Supabase CLI if you haven't: `npm install -g supabase`
2. Login: `npx supabase login`
3. Link your project:

```bash
npx supabase link --project-ref your-project-id

```

4. Deploy the function:

```bash
npx supabase functions deploy analyze-video --no-verify-jwt

```

### 4. Set Environment Variables & Secrets

**Frontend (`.env`):**
Create a `.env` file in the `coding-dashboard` folder:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

```

**Backend Secrets (Supabase Cloud):**
You need a Google Gemini API Key. Get one [here](https://aistudio.google.com/app/apikey).
Then run this in your terminal:

```bash
npx supabase secrets set GEMINI_API_KEY=your_gemini_key_here

```

_(Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are usually auto-injected by Supabase, but if you renamed them in `index.ts`, ensure they match)._

### 5. Run Locally

```bash
npm run dev

```

Open `http://localhost:5173` and start building your brain!

---

## 📦 Deployment

### Frontend (Vercel)

1. Push your code to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add the Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel Settings.
4. Deploy!

### Backend

Your backend is already "deployed" on Supabase Cloud.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.
