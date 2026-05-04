-- Table: public.user_answers (one row per quiz attempt)

CREATE TABLE IF NOT EXISTS public.user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.quiz(id) ON DELETE CASCADE NOT NULL,
  selected_id text NOT NULL,
  is_correct boolean NOT NULL,
  time_spent_sec integer DEFAULT 0,
  difficulty text,
  answered_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own answers" ON public.user_answers;
DROP POLICY IF EXISTS "Public aggregate visibility" ON public.user_answers;

CREATE POLICY "Users manage own answers"
  ON public.user_answers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lets authenticated peers read rows for leaderboard-style aggregates (optional in production)
CREATE POLICY "Public aggregate visibility"
  ON public.user_answers FOR SELECT
  USING (auth.role() = 'authenticated');
