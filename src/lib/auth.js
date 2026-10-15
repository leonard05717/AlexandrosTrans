import { supabase } from './supabase.js';
export async function getCurrentProfile(userId) {
 if (!supabase || !userId) return { profile:null,error:new Error('Supabase is not configured or no user is signed in.') };
 const {data,error}=await supabase.from('profiles').select('id,full_name,role,active,assigned_bus_id').eq('id',userId).maybeSingle();
 if(error)return {profile:null,error};
 if(!data)return {profile:null,error:new Error('No staff profile is linked to this account. Ask an administrator to provision your role.')};
 if(!data.active)return {profile:null,error:new Error('This staff account is inactive. Contact your administrator.')};
 return {profile:data,error:null};
}