import { supabase } from '../supabase/client.js';

export async function getCurrentUser(){
  if(!supabase) return null;
  const {data}=await supabase.auth.getUser();
  return data.user||null;
}

export async function isCurrentUserAdmin(){
  const user=await getCurrentUser();
  if(!user) return false;
  const {data,error}=await supabase.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();
  return !error && Boolean(data?.is_admin);
}
