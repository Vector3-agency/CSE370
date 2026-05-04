-- Table: public.flashcards

CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  difficulty text NOT NULL DEFAULT 'Medium',
  question text NOT NULL,
  answer text NOT NULL,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own flashcards" ON public.flashcards;
CREATE POLICY "Users manage own flashcards"
  ON public.flashcards FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
