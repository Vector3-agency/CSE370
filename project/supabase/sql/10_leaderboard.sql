-- Table: public.leaderboard (cached scores; refreshed from user_answers)
-- Requires: 01, 04

DROP VIEW IF EXISTS public.leaderboard CASCADE;

DROP TRIGGER IF EXISTS user_answers_leaderboard_table ON public.user_answers;
DROP FUNCTION IF EXISTS public.trg_user_answers_leaderboard_table();
DROP FUNCTION IF EXISTS public.leaderboard_refresh_for_user(uuid);

CREATE TABLE IF NOT EXISTS public.leaderboard (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  score bigint NOT NULL DEFAULT 0,
  total_attempts bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  accuracy numeric(7, 2) GENERATED ALWAYS AS (
    CASE
      WHEN total_attempts > 0 THEN ROUND((100.0 * score::numeric / total_attempts::numeric), 2)
      ELSE 0::numeric
    END
  ) STORED,
  CONSTRAINT leaderboard_counts_ok CHECK (
    score >= 0
    AND total_attempts >= 0
    AND score <= total_attempts
  )
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score_desc ON public.leaderboard (score DESC);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.leaderboard_refresh_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_correct bigint;
  v_total bigint;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE ua.is_correct)::bigint,
    COUNT(*)::bigint
  INTO v_correct, v_total
  FROM public.user_answers ua
  WHERE ua.user_id = p_user_id;

  INSERT INTO public.leaderboard (user_id, score, total_attempts, updated_at)
  VALUES (p_user_id, COALESCE(v_correct, 0), COALESCE(v_total, 0), now())
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    total_attempts = EXCLUDED.total_attempts,
    updated_at = EXCLUDED.updated_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_user_answers_leaderboard_table()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    uid := OLD.user_id;
    PERFORM public.leaderboard_refresh_for_user(uid);
    RETURN OLD;
  END IF;

  uid := NEW.user_id;
  PERFORM public.leaderboard_refresh_for_user(uid);

  IF TG_OP = 'UPDATE' AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    PERFORM public.leaderboard_refresh_for_user(OLD.user_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER user_answers_leaderboard_table
  AFTER INSERT OR UPDATE OR DELETE ON public.user_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_user_answers_leaderboard_table();

DROP FUNCTION IF EXISTS public.get_leaderboard();
DROP FUNCTION IF EXISTS public.get_leaderboard(uuid);

CREATE OR REPLACE FUNCTION public.get_leaderboard(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  full_name text,
  avatar_url text,
  year text,
  score bigint,
  rank_position bigint,
  is_current_user boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_scores AS (
    SELECT
      p.id AS user_id,
      p.full_name,
      p.avatar_url,
      p.year,
      COALESCE(lb.score, 0)::bigint AS score
    FROM public.profiles p
    LEFT JOIN public.leaderboard lb ON lb.user_id = p.id
  )
  SELECT
    us.full_name,
    us.avatar_url,
    us.year,
    us.score,
    RANK() OVER (ORDER BY us.score DESC, us.user_id)::bigint AS rank_position,
    (us.user_id IS NOT DISTINCT FROM p_user_id) AS is_current_user
  FROM user_scores us
  ORDER BY us.score DESC, us.user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(uuid) TO anon;

COMMENT ON TABLE public.leaderboard IS 'Cached quiz stats per profile; synced by trigger on user_answers.';
