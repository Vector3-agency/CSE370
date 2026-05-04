-- Table: public.study_sessions

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  system text NOT NULL,
  difficulty text,
  total_questions integer DEFAULT 0,
  correct_count integer DEFAULT 0,
  duration_sec integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sessions" ON public.study_sessions;
CREATE POLICY "Users manage own sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
