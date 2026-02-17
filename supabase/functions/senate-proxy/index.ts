/**
 * Senate.gov CORS Proxy Edge Function
 *
 * Proxies XML requests to senate.gov to bypass browser CORS restrictions.
 * Used by the admin VotesPage to fetch roll call vote lists and detail XMLs.
 *
 * No secrets required — senate.gov XML is public data.
 * Auth: requires a valid Supabase session with admin role.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_HOST = "www.senate.gov";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  // Verify the caller is an authenticated admin
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return errorResponse("Missing authorization header", 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return errorResponse("Unauthorized", 401);
  }

  if (user.user_metadata?.role !== "admin") {
    return errorResponse("Admin access required", 403);
  }

  // Parse request body
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body");
  }

  const targetUrl = body.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    return errorResponse("Missing 'url' in request body");
  }

  // Validate URL is on senate.gov
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return errorResponse("Invalid URL");
  }

  if (parsed.hostname !== ALLOWED_HOST) {
    return errorResponse(`Only ${ALLOWED_HOST} URLs are allowed`);
  }

  if (!parsed.pathname.endsWith(".xml")) {
    return errorResponse("Only .xml URLs are allowed");
  }

  // Fetch the XML from senate.gov (server-side, no CORS issue)
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "TheMidtermProject/1.0 (civic education tool)",
      },
    });

    if (!resp.ok) {
      return errorResponse(
        `Senate.gov returned HTTP ${resp.status}`,
        resp.status >= 500 ? 502 : resp.status,
      );
    }

    const xml = await resp.text();

    return new Response(xml, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return errorResponse(`Failed to fetch from senate.gov: ${message}`, 502);
  }
});
