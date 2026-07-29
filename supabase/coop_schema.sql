-- ============================================================
-- COOP TASKS FEATURE — Schema SQL
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- ============================================================
-- PARTE 1A — Tabela task_groups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_groups (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  code       TEXT NOT NULL UNIQUE,
  owner_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.task_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view groups" ON public.task_groups;
CREATE POLICY "Authenticated users can view groups"
  ON public.task_groups FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners can insert groups" ON public.task_groups;
CREATE POLICY "Owners can insert groups"
  ON public.task_groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update groups" ON public.task_groups;
CREATE POLICY "Owners can update groups"
  ON public.task_groups FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete groups" ON public.task_groups;
CREATE POLICY "Owners can delete groups"
  ON public.task_groups FOR DELETE
  USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_task_groups_code  ON public.task_groups (code);
CREATE INDEX IF NOT EXISTS idx_task_groups_owner ON public.task_groups (owner_id);

-- ============================================================
-- PARTE 1B — Tabela group_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id  UUID NOT NULL REFERENCES public.task_groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view group memberships" ON public.group_members;
CREATE POLICY "Members can view group memberships"
  ON public.group_members FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members (user_id);

-- ============================================================
-- PARTE 1C — Tabela coop_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.coop_tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.task_groups(id) ON DELETE CASCADE,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  is_complete BOOLEAN DEFAULT false,
  priority    TEXT DEFAULT 'medium',
  category    TEXT DEFAULT 'Pessoal',
  due_date    DATE,
  position    INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.coop_tasks ENABLE ROW LEVEL SECURITY;

-- Helper function: verifica se o usuário atual é membro do grupo
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

DROP POLICY IF EXISTS "Members can view group tasks" ON public.coop_tasks;
CREATE POLICY "Members can view group tasks"
  ON public.coop_tasks FOR SELECT
  USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS "Members can insert group tasks" ON public.coop_tasks;
CREATE POLICY "Members can insert group tasks"
  ON public.coop_tasks FOR INSERT
  WITH CHECK (public.is_group_member(group_id) AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Members can update group tasks" ON public.coop_tasks;
CREATE POLICY "Members can update group tasks"
  ON public.coop_tasks FOR UPDATE
  USING (public.is_group_member(group_id));

DROP POLICY IF EXISTS "Members can delete group tasks" ON public.coop_tasks;
CREATE POLICY "Members can delete group tasks"
  ON public.coop_tasks FOR DELETE
  USING (public.is_group_member(group_id));

CREATE INDEX IF NOT EXISTS idx_coop_tasks_group ON public.coop_tasks (group_id, created_at DESC);
