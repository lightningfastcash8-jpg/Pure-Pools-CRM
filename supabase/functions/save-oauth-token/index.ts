import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TokenPayload {
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at: string;
  scope?: string;
  email?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const payload: TokenPayload = await req.json();

    if (!payload.user_id || !payload.provider || !payload.access_token) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingToken } = await supabase
      .from("oauth_tokens")
      .select("id")
      .eq("user_id", payload.user_id)
      .eq("provider", payload.provider)
      .maybeSingle();

    let dbError;
    if (existingToken) {
      const { error } = await supabase
        .from("oauth_tokens")
        .update({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          expires_at: payload.expires_at,
          scope: payload.scope,
          email: payload.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingToken.id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from("oauth_tokens")
        .insert({
          user_id: payload.user_id,
          provider: payload.provider,
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          expires_at: payload.expires_at,
          scope: payload.scope,
          email: payload.email,
          updated_at: new Date().toISOString(),
        });
      dbError = error;
    }

    if (dbError) {
      console.error("Database error:", JSON.stringify(dbError));
      return new Response(
        JSON.stringify({ error: dbError.message || "Database operation failed", code: dbError.code }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
