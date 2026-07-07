// Shared admin auth check for edge functions.
// Requires either:
//  - a service_role JWT (server-to-server invocations), OR
//  - a user JWT belonging to a user with the 'admin' role.
// Returns null on success, or a Response to short-circuit with 401/403.
import { createClient } from "npm:@supabase/supabase-js@2";

export interface RequireAdminOk {
  userId: string | null;
  role: "service_role" | "admin";
}

export async function requireAdminOrService(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<RequireAdminOk | Response> {
  const auth = req.headers.get("Authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "").trim();
  const json = (b: unknown, status: number) =>
    new Response(JSON.stringify(b), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  if (!jwt) return json({ error: "unauthorized" }, 401);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // Fast path: service_role invocations pass the service_role key as bearer.
  if (jwt === SERVICE_KEY) return { userId: null, role: "service_role" };

  // Otherwise decode as user JWT and check admin role.
  const { data: claims } = await admin.auth.getClaims(jwt);
  const sub = claims?.claims?.sub;
  if (claims?.claims?.role === "service_role") {
    return { userId: null, role: "service_role" };
  }
  if (!sub) return json({ error: "unauthorized" }, 401);
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", sub)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) return json({ error: "forbidden" }, 403);
  return { userId: sub, role: "admin" };
}
