import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' };
const reply = (body, status=200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req) => {
 if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
 if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
 const url = Deno.env.get('SUPABASE_URL'), anon = Deno.env.get('SUPABASE_ANON_KEY'), service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if (!url || !anon || !service) return reply({ error: 'Server environment is incomplete.' }, 500);
 const authHeader = req.headers.get('Authorization');
 if (!authHeader) return reply({ error: 'Authentication required.' }, 401);
 const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
 const { data: callerData, error: callerError } = await caller.auth.getUser();
 if (callerError || !callerData.user) return reply({ error: 'Invalid session.' }, 401);
 const adminDb = createClient(url, service, { auth: { persistSession: false } });
 const { data: callerProfile, error: profileError } = await adminDb.from('profiles').select('role,active').eq('id', callerData.user.id).maybeSingle();
 if (profileError || callerProfile?.role !== 'admin' || callerProfile.active !== true) return reply({ error: 'Administrator access required.' }, 403);
 let body;
 try { body = await req.json(); } catch { return reply({ error: 'Invalid JSON body.' }, 400); }
 const email = String(body.email || '').trim().toLowerCase(), full_name = String(body.full_name || '').trim(), password = String(body.password || ''), role = String(body.role || '');
 if (!email || !full_name || password.length < 8 || !['driver','conductor','inspector'].includes(role)) return reply({ error: 'Provide valid email, full name, password of at least 8 characters, and a non-admin staff role.' }, 400);
 const { data: created, error: createError } = await adminDb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } });
 if (createError) return reply({ error: createError.message }, 400);
 const { error: insertError } = await adminDb.from('profiles').upsert({ id: created.user.id, full_name, role, active: true }, { onConflict: 'id' });
 if (insertError) {
   await adminDb.auth.admin.deleteUser(created.user.id);
   return reply({ error: 'Profile creation failed: ' + insertError.message }, 500);
 }
 return reply({ ok: true, user_id: created.user.id });
});