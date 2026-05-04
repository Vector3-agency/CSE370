-- Helper and read-only RPCs used by the student SPA (not tied to a single table).
-- Run after: profiles, flashcards, quiz, user_answers.

CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT true;
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(
    lower(trim(COALESCE((SELECT p.role::text FROM public.profiles p WHERE p.id = auth.uid()), ''))),
    ''
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_flashcard_topics(p_user_id uuid)
RETURNS TABLE(tag text, total bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT f.tag, COUNT(*)::bigint AS total
  FROM public.flashcards f
  WHERE p_user_id IS NOT NULL
    AND (f.user_id IS NULL OR f.user_id = p_user_id)
  GROUP BY f.tag
  ORDER BY f.tag;
$$;

GRANT EXECUTE ON FUNCTION public.get_flashcard_topics(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_question_topics(p_user_id uuid)
RETURNS TABLE(system text, total bigint, completed bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    q.system,
    COUNT(DISTINCT q.id)::bigint AS total,
    COUNT(DISTINCT ua.question_id)::bigint AS completed
  FROM public.quiz q
  LEFT JOIN public.user_answers ua
    ON ua.question_id = q.id
    AND p_user_id IS NOT NULL
    AND ua.user_id = p_user_id
  WHERE p_user_id IS NOT NULL
    AND (q.user_id IS NULL OR q.user_id = p_user_id)
  GROUP BY q.system
  ORDER BY q.system;
$$;

GRANT EXECUTE ON FUNCTION public.get_question_topics(uuid) TO authenticated;
