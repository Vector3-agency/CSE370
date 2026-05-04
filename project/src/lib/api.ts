import { supabase } from './supabase';

// ============================================================
// FLASHCARDS
// ============================================================

export interface FlashcardRow {
  id: string;
  user_id: string | null;
  tag: string;
  difficulty: string;
  question: string;
  answer: string;
  source: string;
  created_at: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchFlashcards(userId: string) {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as FlashcardRow[];
}

export async function createFlashcard(userId: string, card: {
  tag: string;
  difficulty: string;
  question: string;
  answer: string;
  source?: string;
}) {
  const { data, error } = await supabase
    .from('flashcards')
    .insert({ ...card, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data as FlashcardRow;
}

export async function deleteFlashcard(id: string) {
  const { error } = await supabase
    .from('flashcards')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export interface FlashcardTopicInfo {
  tag: string;
  total: number;
}

/** Fetch unique flashcard topics with card counts */
export async function fetchFlashcardTopics(userId: string): Promise<FlashcardTopicInfo[]> {
  const { data, error } = await supabase
    .rpc('get_flashcard_topics', { p_user_id: userId });

  if (error) throw error;

  return (data || []) as FlashcardTopicInfo[];
}

/** Fetch flashcards for a specific topic/tag (all difficulties, shuffled) */
export async function fetchFlashcardsByTag(userId: string, tag: string): Promise<FlashcardRow[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('tag', tag)
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .limit(10000);

  if (error) throw error;

  // Shuffle the results randomly
  const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
  return shuffled as FlashcardRow[];
}

// ============================================================
// QUIZ rows (table public.quiz; routes still /student/qbank)
// ============================================================

export interface QuestionRow {
  id: string;
  user_id: string | null;
  system: string;
  difficulty: string;
  scenario: string;
  question: string;
  options: { id: string; text: string }[];
  correct_id: string;
  explanation: string;
  takeaway: string | null;
  lab_results?: Record<string, string>;
  created_at: string;
}

/** Admin dashboard: counts per tag for system-owned decks (user_id IS NULL). */
export async function fetchAdminSystemFlashcardTopics(): Promise<{ tag: string; card_count: number }[]> {
  const { data, error } = await supabase.rpc('admin_system_flashcard_topics');
  if (error) throw error;
  return (data || []).map((row: { tag: string; card_count: number | string }) => ({
    tag: row.tag,
    card_count: Number(row.card_count),
  }));
}

/** Admin: insert shared flashcards (user_id NULL); subscribed students see them with their own decks. */
export async function insertAdminSystemFlashcard(input: {
  tag: string;
  difficulty: string;
  question: string;
  answer: string;
  source?: string;
}): Promise<FlashcardRow> {
  const { data, error } = await supabase
    .from('flashcards')
    .insert({
      user_id: null,
      tag: input.tag.trim(),
      difficulty: input.difficulty,
      question: input.question.trim(),
      answer: input.answer.trim(),
      source: input.source ?? 'admin',
    })
    .select()
    .single();
  if (error) throw error;
  return data as FlashcardRow;
}

export async function deleteAdminSystemFlashcard(id: string): Promise<void> {
  const { error } = await supabase.from('flashcards').delete().eq('id', id).is('user_id', null);
  if (error) throw error;
}

/** Remove every system flashcard in a tag (admin only). */
export async function deleteAdminSystemFlashcardsByTag(tag: string): Promise<void> {
  const { error } = await supabase.from('flashcards').delete().eq('tag', tag).is('user_id', null);
  if (error) throw error;
}

/** Admin: all system cards in a topic (ordered). */
export async function fetchAdminSystemFlashcardsByTag(tag: string): Promise<FlashcardRow[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('tag', tag)
    .is('user_id', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as FlashcardRow[];
}

/** Admin: update a system-owned flashcard row. */
export async function updateAdminSystemFlashcard(
  id: string,
  input: {
    tag: string;
    difficulty: string;
    question: string;
    answer: string;
    source?: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from('flashcards')
    .update({
      tag: input.tag.trim(),
      difficulty: input.difficulty,
      question: input.question.trim(),
      answer: input.answer.trim(),
      ...(input.source !== undefined ? { source: input.source } : {}),
    })
    .eq('id', id)
    .is('user_id', null);
  if (error) throw error;
}

// ============================================================
// ADMIN USERS (requires admin_list_users / admin_set_user_role RPCs)
// ============================================================

export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  subscription_status: string | null;
  subscription_period_end: string | null;
}

export async function fetchAdminUsers(options?: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: AdminUserRow[]; total: number }> {
  const pageSize = Math.min(Math.max(options?.pageSize ?? 25, 1), 100);
  const page = Math.max(options?.page ?? 1, 1);
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase.rpc('admin_list_users', {
    p_search: options?.search?.trim() || null,
    p_limit: pageSize,
    p_offset: offset,
  });

  if (error) throw error;

  const raw = (data || []) as Record<string, unknown>[];
  const total = raw.length > 0 ? Number(raw[0].total_count) : 0;
  const rows: AdminUserRow[] = raw.map((r) => ({
    id: String(r.id),
    email: String(r.email ?? ''),
    full_name: (r.full_name as string | null) ?? null,
    role: String(r.role ?? 'student'),
    created_at: String(r.created_at ?? ''),
    subscription_status: (r.subscription_status as string | null) ?? null,
    subscription_period_end: (r.subscription_period_end as string | null) ?? null,
  }));

  return { rows, total };
}

export async function adminSetUserRole(userId: string, role: 'admin' | 'student'): Promise<void> {
  const { error } = await supabase.rpc('admin_set_user_role', {
    p_user_id: userId,
    p_role: role,
  });
  if (error) throw error;
}

/** KPIs for admin dashboard (requires `admin_dashboard_stats` RPC). */
export interface AdminDashboardStats {
  total_users: number;
  active_subscribers: number;
  system_questions: number;
  system_flashcard_topics: number;
  system_flashcards: number;
}

export async function fetchAdminDashboardStats(): Promise<AdminDashboardStats> {
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  return {
    total_users: Number(row.total_users ?? 0),
    active_subscribers: Number(row.active_subscribers ?? 0),
    system_questions: Number(row.system_questions ?? 0),
    system_flashcard_topics: Number(row.system_flashcard_topics ?? 0),
    system_flashcards: Number(row.system_flashcards ?? 0),
  };
}

/** Admin: list system questions for management UI (paginated). */
export async function fetchAdminSystemQuestions(options?: {
  search?: string;
  system?: string;
  difficulty?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ rows: QuestionRow[]; total: number }> {
  const pageSize = Math.min(Math.max(options?.pageSize ?? 25, 1), 100);
  const page = Math.max(options?.page ?? 1, 1);
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('quiz')
    .select('*', { count: 'exact' })
    .is('user_id', null)
    .order('created_at', { ascending: true });

  const sys = options?.system?.trim();
  if (sys) {
    query = query.eq('system', sys);
  }

  const diff = options?.difficulty?.trim().toLowerCase();
  if (diff) {
    query = query.eq('difficulty', diff);
  }

  const raw = options?.search?.trim();
  if (raw) {
    const term = `%${raw.replace(/%/g, '').replace(/,/g, '')}%`;
    query = query.or(`question.ilike.${term},system.ilike.${term},scenario.ilike.${term}`);
  }

  const { data, error, count } = await query.range(offset, offset + pageSize - 1);
  if (error) throw error;
  return { rows: (data || []) as QuestionRow[], total: count ?? 0 };
}

/** Distinct `system` values for system quiz rows (admin filter dropdown). */
export async function fetchAdminQuizSystemOptions(): Promise<string[]> {
  const { data, error } = await supabase.from('quiz').select('system').is('user_id', null);
  if (error) throw error;
  const names = new Set<string>();
  for (const row of data || []) {
    const s = (row as { system?: string | null }).system?.trim();
    if (s) names.add(s);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export async function deleteAdminSystemQuestion(id: string): Promise<void> {
  const { data, error } = await supabase.from('quiz').delete().eq('id', id).is('user_id', null).select('id');
  if (error) throw error;
  if (!data?.length) {
    throw new Error(
      'No row was deleted. Either this item is not a system question (user_id must be empty), it was already removed, or your account does not have admin delete permission on quiz.',
    );
  }
}

/** Admin: insert a system question (user_id NULL). Options stored as JSON like seeds. */
export async function insertAdminSystemQuestion(input: {
  system: string;
  difficulty: string;
  scenario: string;
  question: string;
  options: { id: string; text: string }[];
  correct_id: string;
  explanation: string;
  takeaway?: string;
  lab_results?: Record<string, string> | null;
}): Promise<QuestionRow> {
  const opts = input.options.map((o) => ({
    id: o.id.trim().toUpperCase(),
    text: o.text.trim(),
  })).filter((o) => o.text.length > 0);

  if (opts.length < 2) {
    throw new Error('Add at least two answer choices with text.');
  }
  const letters = new Set(opts.map((o) => o.id));
  const correct = input.correct_id.trim().toUpperCase();
  if (!letters.has(correct)) {
    throw new Error('Correct answer must be one of the choice letters you filled in.');
  }

  const { data, error } = await supabase
    .from('quiz')
    .insert({
      user_id: null,
      system: input.system.trim(),
      difficulty: input.difficulty.trim().toLowerCase(),
      scenario: (input.scenario.trim() || '—').slice(0, 50000),
      question: input.question.trim(),
      options: opts,
      correct_id: correct,
      explanation: input.explanation.trim(),
      takeaway: (input.takeaway ?? '').trim() || null,
      lab_results: input.lab_results ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as QuestionRow;
}

/** Admin: update an existing system question (same rules as insert). */
export async function updateAdminSystemQuestion(
  id: string,
  input: {
    system: string;
    difficulty: string;
    scenario: string;
    question: string;
    options: { id: string; text: string }[];
    correct_id: string;
    explanation: string;
    takeaway?: string;
    lab_results?: Record<string, string> | null;
  },
): Promise<void> {
  const opts = input.options.map((o) => ({
    id: o.id.trim().toUpperCase(),
    text: o.text.trim(),
  })).filter((o) => o.text.length > 0);

  if (opts.length < 2) {
    throw new Error('Add at least two answer choices with text.');
  }
  const letters = new Set(opts.map((o) => o.id));
  const correct = input.correct_id.trim().toUpperCase();
  if (!letters.has(correct)) {
    throw new Error('Correct answer must be one of the choice letters you filled in.');
  }

  const { data, error } = await supabase
    .from('quiz')
    .update({
      system: input.system.trim(),
      difficulty: input.difficulty.trim().toLowerCase(),
      scenario: (input.scenario.trim() || '—').slice(0, 50000),
      question: input.question.trim(),
      options: opts,
      correct_id: correct,
      explanation: input.explanation.trim(),
      takeaway: (input.takeaway ?? '').trim() || null,
      lab_results: input.lab_results ?? null,
    })
    .eq('id', id)
    .is('user_id', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      'No row was updated. Either this item is not a system question (user_id must be empty), the id is wrong, or your account does not have admin update permission on quiz.',
    );
  }
}

export async function fetchQuestionsBySystem(system?: string, difficulty?: string, userId?: string) {
  let query = supabase.from('quiz').select('*');
  if (system) query = query.eq('system', system);
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (userId) {
    query = query.or(`user_id.is.null,user_id.eq.${userId}`);
  } else {
    query = query.is('user_id', null);
  }

  const { data, error } = await query.order('created_at', { ascending: true }).limit(10000);
  if (error) throw error;
  return data as QuestionRow[];
}

/** Load specific questions by id (e.g. weak-spot quiz). Caps batch size for URL limits. */
export async function fetchQuestionsByIds(ids: string[], userId?: string): Promise<QuestionRow[]> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return [];
  const chunkSize = 120;
  const out: QuestionRow[] = [];
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    let q = supabase.from('quiz').select('*').in('id', chunk);
    if (userId) {
      q = q.or(`user_id.is.null,user_id.eq.${userId}`);
    } else {
      q = q.is('user_id', null);
    }
    const { data, error } = await q;
    if (error) throw error;
    if (data?.length) out.push(...(data as QuestionRow[]));
  }
  return out;
}

// ============================================================
// MISTAKE TRACKING (question_mistake_stats + trigger on user_answers)
// ============================================================

export interface QuestionMistakeStatRow {
  user_id: string;
  question_id: string;
  wrong_count: number;
  last_wrong_at: string;
}

export async function fetchMistakeStats(userId: string): Promise<QuestionMistakeStatRow[]> {
  const { data, error } = await supabase
    .from('question_mistake_stats')
    .select('user_id, question_id, wrong_count, last_wrong_at')
    .eq('user_id', userId)
    .gt('wrong_count', 0)
    .order('wrong_count', { ascending: false })
    .order('last_wrong_at', { ascending: false });

  if (error) throw error;
  return (data || []) as QuestionMistakeStatRow[];
}

export interface SystemInfo {
  name: string;
  total: number;
  completed: number;
}

/** Same semantics as `get_question_topics` RPC when that function is not deployed (404 / PGRST202). */
async function fetchAvailableSystemsFallback(userId: string): Promise<SystemInfo[]> {
  const { data: questions, error: qErr } = await supabase
    .from('quiz')
    .select('id, system')
    .or(`user_id.is.null,user_id.eq.${userId}`);

  if (qErr) throw qErr;

  const { data: answers, error: aErr } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', userId);

  if (aErr) throw aErr;

  const answeredIds = new Set((answers || []).map((a) => a.question_id as string));

  const bySystem = new Map<string, { total: number; completed: number }>();
  for (const row of questions || []) {
    const sys = (row.system as string | null) ?? '—';
    const cur = bySystem.get(sys) ?? { total: 0, completed: 0 };
    cur.total += 1;
    if (answeredIds.has(row.id as string)) cur.completed += 1;
    bySystem.set(sys, cur);
  }

  return [...bySystem.entries()]
    .map(([name, { total, completed }]) => ({ name, total, completed }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function isMissingRpcError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === 'PGRST202') return true;
  const m = error.message ?? '';
  return (
    /Could not find the function/i.test(m) ||
    /get_question_topics/i.test(m) ||
    /schema cache/i.test(m)
  );
}

export async function fetchAvailableSystems(userId?: string): Promise<SystemInfo[]> {
  if (!userId) return [];

  const { data, error } = await supabase.rpc('get_question_topics', { p_user_id: userId });

  if (!error && data != null) {
    return (data as { system: string; total: number; completed: number }[]).map((row) => ({
      name: row.system,
      total: Number(row.total),
      completed: Number(row.completed),
    }));
  }

  if (error && isMissingRpcError(error)) {
    console.warn('[fetchAvailableSystems] get_question_topics unavailable; using table fallback.', error.message);
    return fetchAvailableSystemsFallback(userId);
  }

  if (error) throw error;
  return [];
}

// ============================================================
// USER ANSWERS
// ============================================================

export interface UserAnswerRow {
  id: string;
  user_id: string;
  question_id: string;
  selected_id: string;
  is_correct: boolean;
  time_spent_sec: number;
  difficulty: string;
  answered_at: string;
}

export async function submitAnswer(params: {
  userId: string;
  questionId: string;
  selectedId: string;
  isCorrect: boolean;
  timeSpentSec?: number;
  difficulty?: string;
}) {
  const { data, error } = await supabase
    .from('user_answers')
    .insert({
      user_id: params.userId,
      question_id: params.questionId,
      selected_id: params.selectedId,
      is_correct: params.isCorrect,
      time_spent_sec: params.timeSpentSec || 0,
      difficulty: params.difficulty,
    })
    .select()
    .single();
  if (error) throw error;
  return data as UserAnswerRow;
}

export async function fetchUserAnswers(userId: string) {
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false });
  if (error) throw error;
  return data as UserAnswerRow[];
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface NotificationRow {
  id: string;
  user_id: string;
  type: 'achievement' | 'update' | 'reminder' | 'social' | 'system' | 'promo';
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  created_at: string;
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as NotificationRow[];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

export async function clearReadNotifications(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('read', true);
  if (error) throw error;
}

// ============================================================
// PROFILE
// ============================================================

export interface ProfileRow {
  id: string;
  full_name: string | null;
  year: string | null;
  avatar_url: string | null;
  university: string | null;
  cover_image_url: string | null;
  role: 'admin' | 'student' | null;
  created_at: string;
  updated_at: string;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

/** Profiles row merged with `get_my_role()` so admin routing survives RLS/cache quirks on `profiles`. */
export async function fetchProfileResolved(userId: string): Promise<ProfileRow | null> {
  const [profRes, rpcRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.rpc('get_my_role'),
  ]);

  if (profRes.error) throw profRes.error;

  const row = profRes.data as ProfileRow | null;

  let rpcRoleRaw: string | null = null;
  if (!rpcRes.error && rpcRes.data != null && rpcRes.data !== '') {
    rpcRoleRaw = String(rpcRes.data).trim().toLowerCase();
  } else if (rpcRes.error) {
    console.warn('get_my_role:', rpcRes.error.message);
  }

  const normalizedRpc: ProfileRow['role'] | null =
    rpcRoleRaw === 'admin' ? 'admin' : rpcRoleRaw === 'student' ? 'student' : null;

  const rowRoleRaw =
    row?.role != null && String(row.role).trim() !== ''
      ? String(row.role).trim().toLowerCase()
      : null;
  const normalizedRowRole: ProfileRow['role'] | null =
    rowRoleRaw === 'admin' ? 'admin' : rowRoleRaw === 'student' ? 'student' : null;

  // Prefer admin if either source says admin (avoids get_my_role defaulting to student or RPC/RLS races).
  const effectiveRole: ProfileRow['role'] | null =
    normalizedRpc === 'admin' || normalizedRowRole === 'admin'
      ? 'admin'
      : normalizedRpc === 'student' || normalizedRowRole === 'student'
        ? 'student'
        : normalizedRpc ?? normalizedRowRole;

  if (!row) {
    if (effectiveRole === 'admin') {
      return {
        id: userId,
        full_name: null,
        year: null,
        avatar_url: null,
        university: null,
        cover_image_url: null,
        role: 'admin',
        created_at: '',
        updated_at: '',
      };
    }
    return null;
  }

  return { ...row, role: effectiveRole };
}

export async function updateProfile(userId: string, updates: Partial<Omit<ProfileRow, 'id' | 'created_at'>>) {
  // Update public profile
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;

  // Sync auth metadata if full_name is changed
  if (updates.full_name !== undefined) {
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: updates.full_name }
    });
    // Log but don't fail the whole operation if auth sync fails
    if (authError) console.error("Failed to sync user metadata full_name:", authError);
  }

  return data as ProfileRow;
}

export async function uploadProfileImage(userId: string, file: File, bucket: 'avatars' | 'covers') {
  // 1. Get the profile to find the public_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('public_id')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const publicId = profile.public_id;
  const fileExt = file.name.split('.').pop();
  const filePath = `${publicId}/${Math.random()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}

// ============================================================
// SETTINGS
// ============================================================

// Helper to create profile if missing (self-healing)
async function ensureProfileExists(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      { id: userId, full_name: 'Student User' }, 
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (error) console.error("Auto-creation of profile failed:", error);
}

export async function fetchSettings(userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // No settings row yet — create default
    const { data: newData, error: insertError } = await supabase
      .from('user_settings')
      .insert({ user_id: userId })
      .select()
      .single();
    
    // If insert failed due to missing profile, try to fix and retry
    if (insertError) {
      if (insertError.code === '23503') { 
        await ensureProfileExists(userId);
        // Retry insert
        const { data: retryData, error: retryError } = await supabase
          .from('user_settings')
          .insert({ user_id: userId })
          .select()
          .single();
        if (retryError) throw retryError;
        return retryData;
      }
      throw insertError;
    }
    return newData;
  }
  if (error) throw error;
  return data;
}

export async function updateSettings(userId: string, settings: Record<string, any>) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    if (error.code === '23503') {
      // Missing profile - fix and retry
      await ensureProfileExists(userId);
      const { data: retryData, error: retryError } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (retryError) throw retryError;
      return retryData;
    }
    throw error;
  }
  return data;
}

// ============================================================
// STUDY SESSIONS
// ============================================================

export interface StudySessionRow {
  id: string;
  user_id: string;
  system: string;
  difficulty: string | null;
  total_questions: number;
  correct_count: number;
  duration_sec: number;
  started_at: string;
  ended_at: string | null;
}

export async function createStudySession(params: {
  userId: string;
  system: string;
  difficulty?: string | null;
  totalQuestions: number;
  correctCount: number;
  durationSec: number;
  startedAt: string;
}) {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: params.userId,
      system: params.system,
      difficulty: params.difficulty,
      total_questions: params.totalQuestions,
      correct_count: params.correctCount,
      duration_sec: params.durationSec,
      started_at: params.startedAt,
      ended_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) throw error;
  return data as StudySessionRow;
}

export async function fetchStudySessions(userId: string) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data as StudySessionRow[];
}



// ============================================================
// LEADERBOARD
// ============================================================

export interface LeaderboardRow {
  full_name: string;
  avatar_url: string | null;
  year: string;
  score: number;
  rank_position: number;
  is_current_user: boolean;
}

export async function fetchLeaderboard() {
  // Get the current user's ID so the function can mark their row
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id ?? null;

  const { data, error } = await supabase
    .rpc('get_leaderboard', { p_user_id: userId })
    .limit(50);

  if (error) throw error;
  return data as LeaderboardRow[];
}

// ============================================================
// PERSONAL NOTES
// ============================================================

export interface NoteRow {
  id: string;
  user_id: string;
  question_id: string;
  note: string;
  created_at: string;
  updated_at: string;
  question?: QuestionRow; // Joined data
}

export async function fetchQuestionNote(userId: string, questionId: string) {
  const { data, error } = await supabase
    .from('question_notes')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .single();

  if (error && error.code === 'PGRST116') return null; // No note found
  if (error) throw error;
  return data as NoteRow;
}

export async function saveQuestionNote(userId: string, questionId: string, note: string) {
  const { data, error } = await supabase
    .from('question_notes')
    .upsert(
      { user_id: userId, question_id: questionId, note, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,question_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as NoteRow;
}

export async function deleteQuestionNote(noteId: string) {
  const { error } = await supabase
    .from('question_notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}

export async function fetchUserNotes(userId: string) {
  const { data, error } = await supabase
    .from('question_notes')
    .select('*, question:quiz(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data as NoteRow[];
}

export async function fetchQuestionById(questionId: string) {
  const { data, error } = await supabase
    .from('quiz')
    .select('*')
    .eq('id', questionId)
    .single();

  if (error) throw error;
  return data as QuestionRow;
}

// ============================================================
// MARKED QUESTIONS
// ============================================================

export interface MarkedQuestionRow {
  id: string;
  user_id: string;
  question_id: string;
  created_at: string;
  question?: QuestionRow; // Joined data
}

export async function fetchUserMarkedQuestions(userId: string) {
  const { data, error } = await supabase
    .from('marked_questions')
    .select('*, question:quiz(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as MarkedQuestionRow[];
}

/** Returns true if this question is marked by the user */
export async function fetchIsQuestionMarked(userId: string, questionId: string) {
  const { data, error } = await supabase
    .from('marked_questions')
    .select('id')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
}

/** Fetch the set of all marked question IDs for a user (for bulk loading) */
export async function fetchMarkedQuestionIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('marked_questions')
    .select('question_id')
    .eq('user_id', userId);

  if (error) throw error;
  return new Set((data || []).map((row: { question_id: string }) => row.question_id));
}

export async function saveMarkedQuestion(userId: string, questionId: string) {
  const { data, error } = await supabase
    .from('marked_questions')
    .upsert(
      { user_id: userId, question_id: questionId },
      { onConflict: 'user_id,question_id', ignoreDuplicates: true }
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  return data as MarkedQuestionRow | null;
}

export async function deleteMarkedQuestion(userId: string, questionId: string) {
  const { error } = await supabase
    .from('marked_questions')
    .delete()
    .eq('user_id', userId)
    .eq('question_id', questionId);

  if (error) throw error;
}

// ============================================================
// DASHBOARD STATS
// ============================================================

/** PostgREST / Postgres: RPC missing, wrong signature, or undefined relation in an old function body. */
function isDashboardRpcRecoverableError(error: { code?: string; message?: string; details?: string } | null): boolean {
  if (!error) return false;
  const msg = `${error.message ?? ''} ${error.details ?? ''}`;
  if (error.code === 'PGRST202' || error.code === '42883' || error.code === '42P01') return true;
  if (/could not find.*function/i.test(msg) || /does not exist/i.test(msg)) return true;
  return false;
}

export interface DashboardStats {
  total_questions: number;
  correct_questions: number;
  accuracy: number;
  streak: number;
}

const EMPTY_DASHBOARD_STATS: DashboardStats = {
  total_questions: 0,
  correct_questions: 0,
  accuracy: 0,
  streak: 0,
};

export async function fetchDashboardStats(userId: string) {
  const { data, error } = await supabase.rpc('get_dashboard_stats', { p_user_id: userId });
  if (error) {
    if (isDashboardRpcRecoverableError(error)) {
      console.warn('[dashboard] get_dashboard_stats failed; using empty stats. Apply fix_student_dashboard_rpcs.sql if needed.', error.message);
      return EMPTY_DASHBOARD_STATS;
    }
    throw error;
  }
  return data as DashboardStats;
}

export interface WeeklyActivityRow {
  activity_date: string;
  question_count: number;
  correct_count: number;
}

export async function fetchWeeklyActivity(userId: string) {
  const { data, error } = await supabase.rpc('get_weekly_activity', { p_user_id: userId });
  if (error) {
    if (isDashboardRpcRecoverableError(error)) {
      console.warn('[dashboard] get_weekly_activity failed; using empty week.', error.message);
      return [];
    }
    throw error;
  }
  return data as WeeklyActivityRow[];
}

export interface SubjectPerformanceRow {
  system: string;
  total_attempts: number;
  correct_count: number;
  accuracy: number;
}

export async function fetchSubjectPerformance(userId: string) {
  const { data, error } = await supabase.rpc('get_subject_performance', { p_user_id: userId });
  if (error) {
    if (isDashboardRpcRecoverableError(error)) {
      console.warn('[dashboard] get_subject_performance failed; using empty subjects.', error.message);
      return [];
    }
    throw error;
  }
  return data as SubjectPerformanceRow[];
}

export interface ActivityHistoryRow {
  period_label: string;
  question_count: number;
  correct_count: number;
  accuracy: number;
}

export async function fetchActivityHistory(userId: string, period: string) {
  const { data, error } = await supabase.rpc('get_activity_history', { p_user_id: userId, p_period: period });
  if (error) {
    if (isDashboardRpcRecoverableError(error)) {
      console.warn('[dashboard] get_activity_history failed; using empty history.', error.message);
      return [];
    }
    throw error;
  }
  return data as ActivityHistoryRow[];
}

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export async function fetchSubscription(userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
    
  if (error) throw error;
  return data as SubscriptionRow | null;
}

export async function createCheckoutSession(priceId: string, returnUrl: string, withTrial?: boolean) {
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { priceId, returnUrl, withTrial: withTrial === true },
  });
  
  if (error) throw error;
  return data as { url: string };
}

export async function createPortalSession(returnUrl: string) {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: { returnUrl },
  });

  if (error) throw error;
  return data as { url: string };
}

export async function syncSubscription() {
  const { data, error } = await supabase.functions.invoke('sync-subscription');
  if (error) throw error;
  return data as { success: boolean; status: string };
}

// ============================================================
// GLOBAL SEARCH
// ============================================================

export interface SearchResult {
  id: string;
  type: 'flashcard' | 'question' | 'topic';
  title: string;
  subtitle: string;
  url: string;
}

export async function searchGlobal(query: string, userId?: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];
  if (!userId) return [];

  const searchTerm = `%${query.trim()}%`;
  const results: SearchResult[] = [];

  try {
    // Shared admin decks (user_id null) + student's own cards
    const fcQuery = supabase
      .from('flashcards')
      .select('id, tag, question')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .or(`tag.ilike.${searchTerm},question.ilike.${searchTerm}`)
      .limit(5);

    const { data: flashcards, error: fcError } = await fcQuery;
    if (!fcError && flashcards) {
      flashcards.forEach((fc: any) => {
        results.push({
          id: `fc-${fc.id}`,
          type: 'flashcard',
          title: fc.question,
          subtitle: `Flashcard • ${fc.tag}`,
          url: `/student/flashcards?id=${fc.id}`
        });
      });
    }

    const qQuery = supabase
      .from('quiz')
      .select('id, system, question')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .or(`system.ilike.${searchTerm},question.ilike.${searchTerm}`)
      .limit(5);

    const { data: questions, error: qError } = await qQuery;
    if (!qError && questions) {
      questions.forEach((q: any) => {
        results.push({
          id: `q-${q.id}`,
          type: 'question',
          title: q.question,
          subtitle: `Quiz • ${q.system}`,
          url: `/student/qbank?questionId=${q.id}`
        });
      });
    }

    return results;
  } catch (error) {
    console.error("Global search failed:", error);
    return [];
  }
}

