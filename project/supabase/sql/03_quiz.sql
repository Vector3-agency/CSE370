-- Table: public.quiz (MCQ bank; user_id NULL = system/shared item)

CREATE TABLE IF NOT EXISTS public.quiz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  system text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium',
  scenario text NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_id text NOT NULL,
  explanation text NOT NULL,
  takeaway text,
  lab_results jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON COLUMN public.quiz.lab_results IS 'Optional JSON for patient-specific labs, e.g. {"Na+": "140 mEq/L"}';

ALTER TABLE public.quiz ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.quiz;
DROP POLICY IF EXISTS "Anyone can read system questions" ON public.quiz;
DROP POLICY IF EXISTS "Users can read own questions" ON public.quiz;
DROP POLICY IF EXISTS "Users can create own questions" ON public.quiz;
DROP POLICY IF EXISTS "Users can update own questions" ON public.quiz;
DROP POLICY IF EXISTS "Users can delete own questions" ON public.quiz;

CREATE POLICY "Anyone can read system questions"
  ON public.quiz FOR SELECT
  USING (user_id IS NULL AND auth.role() = 'authenticated');

CREATE POLICY "Users can read own questions"
  ON public.quiz FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own questions"
  ON public.quiz FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own questions"
  ON public.quiz FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own questions"
  ON public.quiz FOR DELETE
  USING (auth.uid() = user_id);
