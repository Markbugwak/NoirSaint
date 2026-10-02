import { supabase, isSupabaseConfigured } from '../supabase/client.js';

export async function getSession() {
  if (!isSupabaseConfigured()) return null;
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured()) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  if (!isSupabaseConfigured()) throw new Error('NOIRSAINT authentication requires Supabase configuration.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, name) {
  if (!isSupabaseConfigured()) throw new Error('NOIRSAINT authentication requires Supabase configuration.');
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/#account` }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (isSupabaseConfigured()) await supabase.auth.signOut();
}

export async function isAdmin() {
  if (!isSupabaseConfigured()) return false;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;
  const { data, error } = await supabase
    .from('noirsaint_profiles')
    .select('is_admin')
    .eq('id', userData.user.id)
    .maybeSingle();
  return !error && Boolean(data?.is_admin);
}
