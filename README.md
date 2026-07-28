# ⚡ TaskFlow — Modern Next.js 16 & Supabase To-Do List

A fullstack, high-performance task management web application engineered with **Next.js 16 (App Router)**, **Supabase Authentication & Database (with Row Level Security)**, and **Tailwind CSS**. Designed with premium dark-mode aesthetics, fluid micro-interactions, and real-time state synchronization.

---

## ✨ Features

- 🎨 **Modern Dark-Mode UI / UX System**
  - High-contrast glassmorphism visual hierarchy.
  - Priority badges (*Urgente*, *Alta*, *Baixa*) with dynamic left-border accents.
  - Category tagging (*Trabalho*, *Pessoal*, *Estudos*, *Foco*) and due-date tracking.

- 🤹 **Interactive 3D Drag & Drop Reordering**
  - Drag handles with 60FPS fluid mouse tracking.
  - Perspective 3D jaw-opening tilt feedback on adjacent target cards.
  - Zero-layout-shift positioning engine and instant optimistic state updates.

- 📊 **Flexible Pagination & Infinite Scroll**
  - Top pagination controls with configurable page sizes (10, 30, 50, All).
  - Infinite scroll engine with dynamic batch loading (20 items/batch).
  - Head count query optimizations for instant loading feedback.

- 🔐 **Robust Authentication & Security**
  - Supabase SSR Authentication (Email/Password registration & login).
  - Next.js Proxy/Middleware session management.
  - Row Level Security (RLS) policies guaranteeing total user data isolation.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router & React 19)
- **Database & Auth**: Supabase (PostgreSQL, RLS, SSR Client)
- **Styling**: Tailwind CSS & Lucide Icons
- **Language**: TypeScript

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/NicholasdeOliveiraSica/TaskFlow.git
cd TaskFlow
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Setup (Supabase SQL)
Run the SQL schema provided in `supabase/schema.sql` inside your Supabase SQL Editor to initialize the `todos` table and RLS policies.

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
