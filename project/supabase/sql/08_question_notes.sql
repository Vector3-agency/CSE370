-- Table: public.question_notes (per-user notes on a quiz row)

CREATE TABLE IF NOT EXISTS public.question_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_question_note UNIQUE (user_id, question_id)
);

ALTER TABLE public.question_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notes" ON public.question_notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.question_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.question_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.question_notes;

CREATE POLICY "Users can view their own notes"
  ON public.question_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.question_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.question_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.question_notes FOR DELETE
  USING (auth.uid() = user_id);
