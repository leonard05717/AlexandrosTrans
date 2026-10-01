import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

  const userClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authHeader } } }
  )

  const token = authHeader.replace(/^Bearer\s+/i, "")
  const { data: { user: caller }, error: callerError } = await userClient.auth.getUser(token)
  if (callerError || !caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } })

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: adminRow, error: adminError } = await serviceClient
    .from("admin_access").select("user_id").eq("user_id", caller.id).maybeSingle()
  if (adminError || !adminRow) return new Response(JSON.stringify({ error: "Admin access required." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } })

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const employeeCode = String(body.employee_code || "").trim()
  const fullName = String(body.full_name || "").trim()
  const department = String(body.department || "Inspection").trim()

  if (!email || !password || !employeeCode || !fullName)
    return new Response(JSON.stringify({ error: "Email, password, employee code, and full name are required." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  if (password.length < 8)
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })

  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email, password, email_confirm: true,
  })
  if (createError || !created.user)
    return new Response(JSON.stringify({ error: createError?.message || "Could not create Auth user." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })

  const { data: employee, error: employeeError } = await serviceClient.from("employees").insert({
    user_id: created.user.id,
    employee_code: employeeCode,
    full_name: fullName,
    department,
    active: true,
    role: "inspector",
  }).select("id,user_id,employee_code,full_name,department,active,role,created_at").single()

  if (employeeError) {
    await serviceClient.auth.admin.deleteUser(created.user.id)
    return new Response(JSON.stringify({ error: employeeError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }

  return new Response(JSON.stringify({ employee }), { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } })
})