-- Table: public.marked_questions (bookmarked quiz items)

CREATE TABLE IF NOT EXISTS public.marked_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_marked_question UNIQUE (user_id, question_id)
);

ALTER TABLE public.marked_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own marked questions" ON public.marked_questions;
DROP POLICY IF EXISTS "Users can insert their own marked questions" ON public.marked_questions;
DROP POLICY IF EXISTS "Users can delete their own marked questions" ON public.marked_questions;

CREATE POLICY "Users can view their own marked questions"
  ON public.marked_questions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own marked questions"
  ON public.marked_questions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marked questions"
  ON public.marked_questions FOR DELETE
  USING (auth.uid() = user_id);
