-- Table: public.question_mistake_stats (per-user wrong counts; updated by trigger)
-- Requires: public.user_answers (04)

CREATE TABLE IF NOT EXISTS public.question_mistake_stats (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.quiz(id) ON DELETE CASCADE,
  wrong_count integer NOT NULL DEFAULT 0 CHECK (wrong_count >= 0),
  last_wrong_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_mistake_stats_user_wrong
  ON public.question_mistake_stats (user_id, wrong_count DESC);

ALTER TABLE public.question_mistake_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own mistake stats" ON public.question_mistake_stats;
CREATE POLICY "Users read own mistake stats"
  ON public.question_mistake_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.trg_user_answers_mistake_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF NEW.is_correct = false THEN
    INSERT INTO public.question_mistake_stats AS m (user_id, question_id, wrong_count, last_wrong_at)
    VALUES (NEW.user_id, NEW.question_id, 1, COALESCE(NEW.answered_at, now()))
    ON CONFLICT (user_id, question_id) DO UPDATE SET
      wrong_count = m.wrong_count + 1,
      last_wrong_at = COALESCE(EXCLUDED.last_wrong_at, now());
  ELSE
    UPDATE public.question_mistake_stats m
    SET wrong_count = GREATEST(0, m.wrong_count - 1)
    WHERE m.user_id = NEW.user_id AND m.question_id = NEW.question_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_answers_mistake_stats ON public.user_answers;
CREATE TRIGGER user_answers_mistake_stats
  AFTER INSERT ON public.user_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_user_answers_mistake_stats();

COMMENT ON TABLE public.question_mistake_stats IS 'Wrong-answer counts per user/question; maintained by trigger on user_answers.';
