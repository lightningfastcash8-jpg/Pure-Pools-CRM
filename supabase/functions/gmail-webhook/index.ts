import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Gmail webhook sends notifications via Pub/Sub
    const body = await req.json();
    console.log("Gmail webhook received:", body);

    // Gmail sends a message object with a data field
    const message = body.message;
    if (!message || !message.data) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode the base64 data
    const decodedData = JSON.parse(atob(message.data));
    const { emailAddress, historyId } = decodedData;

    console.log("Processing notification for:", emailAddress, "historyId:", historyId);

    // Get the OAuth token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from("oauth_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("email", emailAddress)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error("No OAuth token found for:", emailAddress);
      return new Response(
        JSON.stringify({ error: "OAuth token not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = tokenData.access_token;

    // Check if token needs refresh
    if (new Date(tokenData.expires_at) <= new Date()) {
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: Deno.env.get("GOOGLE_CLIENT_ID") ?? "",
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "",
          refresh_token: tokenData.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        await supabase
          .from("oauth_tokens")
          .update({
            access_token: refreshData.access_token,
            expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
          })
          .eq("email", emailAddress);
      }
    }

    // Fetch new messages with the specified label
    const labelResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=Label_3491854997503915526&maxResults=10`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!labelResponse.ok) {
      throw new Error(`Gmail API error: ${await labelResponse.text()}`);
    }

    const labelData = await labelResponse.json();
    const messages = labelData.messages || [];

    console.log(`Found ${messages.length} messages with warranty label`);

    // Process each message
    for (const message of messages) {
      // Check if we already have this message
      const { data: existing } = await supabase
        .from("emails_raw")
        .select("id")
        .eq("provider_message_id", message.id)
        .maybeSingle();

      if (existing) {
        console.log(`Message ${message.id} already processed, skipping`);
        continue;
      }

      // Fetch full message details
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=full`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!msgResponse.ok) continue;

      const msgData = await msgResponse.json();
      const headers = msgData.payload.headers;

      const getHeader = (name: string) => {
        const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return header?.value || "";
      };

      // Extract body text
      let bodyText = "";
      if (msgData.payload.body.data) {
        bodyText = atob(msgData.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
      } else if (msgData.payload.parts) {
        for (const part of msgData.payload.parts) {
          if (part.mimeType === "text/plain" && part.body.data) {
            bodyText = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
            break;
          }
        }
      }

      // Insert into emails_raw
      const { data: emailRecord, error: emailError } = await supabase
        .from("emails_raw")
        .insert({
          provider: "gmail",
          provider_message_id: message.id,
          thread_id: msgData.threadId,
          label_name: "Warranty Work",
          from_name: getHeader("From"),
          from_email: getHeader("From"),
          subject: getHeader("Subject"),
          received_at: new Date(parseInt(msgData.internalDate)).toISOString(),
          body_text: bodyText,
          raw_json: msgData,
          processed_status: "new",
        })
        .select()
        .single();

      if (emailError) {
        console.error("Error inserting email:", emailError);
        continue;
      }

      console.log(`Inserted email ${message.id}, now parsing...`);

      // Trigger AI parsing
      const parseUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/parse-warranty-email`;
      await fetch(parseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          emailId: emailRecord.id,
          subject: getHeader("Subject"),
          body: bodyText,
          from: getHeader("From"),
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, processed: messages.length }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
