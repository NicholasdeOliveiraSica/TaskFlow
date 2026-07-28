-- 1. Create 'todos' table matching the user's exact Supabase structure
CREATE TABLE IF NOT EXISTS public.todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    is_complete BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'Pessoal',
    due_date DATE,
    position INTEGER DEFAULT 0
);



-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- SELECT Policy: Users can only view their own todos
DROP POLICY IF EXISTS "Users can view their own todos" ON public.todos;
CREATE POLICY "Users can view their own todos" 
ON public.todos 
FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT Policy: Users can only insert todos for themselves
DROP POLICY IF EXISTS "Users can insert their own todos" ON public.todos;
CREATE POLICY "Users can insert their own todos" 
ON public.todos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own todos
DROP POLICY IF EXISTS "Users can update their own todos" ON public.todos;
CREATE POLICY "Users can update their own todos" 
ON public.todos 
FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own todos
DROP POLICY IF EXISTS "Users can delete their own todos" ON public.todos;
CREATE POLICY "Users can delete their own todos" 
ON public.todos 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Performance Composite Index
CREATE INDEX IF NOT EXISTS idx_todos_user_created 
ON public.todos (user_id, created_at DESC);


