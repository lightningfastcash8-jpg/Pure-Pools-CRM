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
    const { emailId, subject, body, from } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const prompt = `Extract customer and warranty information from this email. Return ONLY valid JSON with this exact structure:

{
  "customer": {
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "phone": "string",
    "address_line1": "string",
    "city": "string",
    "state": "string",
    "zip": "string"
  },
  "equipment": {
    "asset_type": "Pool Heater|Pool Pump|Pool Filter|Pool Cleaner|Salt System|Control System|Other",
    "brand": "string",
    "model_raw": "string",
    "serial": "string",
    "installed_by": "string",
    "install_date": "YYYY-MM-DD"
  },
  "issue": {
    "description": "string",
    "priority": "normal|high|urgent"
  },
  "dispatched_by": "string (name of person who sent this)"
}

Email Subject: ${subject}
Email From: ${from}
Email Body:
${body}

Return only the JSON, no markdown or explanations.`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY") ?? ""}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a warranty claim extraction assistant. Extract customer and equipment information from emails. Return only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    let extracted = aiData.choices?.[0]?.message?.content || "{}";

    extracted = extracted.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(extracted);

    let customerId = null;

    // Create or find customer
    if (parsedData.customer?.email) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", parsedData.customer.email)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;

        // Update customer info if we have better data
        await supabase
          .from("customers")
          .update({
            first_name: parsedData.customer.first_name || existingCustomer.first_name,
            last_name: parsedData.customer.last_name || existingCustomer.last_name,
            phone: parsedData.customer.phone || existingCustomer.phone,
            address_line1: parsedData.customer.address_line1 || existingCustomer.address_line1,
            city: parsedData.customer.city || existingCustomer.city,
            state: parsedData.customer.state || existingCustomer.state,
            zip: parsedData.customer.zip || existingCustomer.zip,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCustomer.id);
      } else {
        const { data: newCustomer } = await supabase
          .from("customers")
          .insert({
            first_name: parsedData.customer.first_name || "Unknown",
            last_name: parsedData.customer.last_name || "",
            email: parsedData.customer.email,
            phone: parsedData.customer.phone || "",
            address_line1: parsedData.customer.address_line1 || "",
            city: parsedData.customer.city || "",
            state: parsedData.customer.state || "FL",
            zip: parsedData.customer.zip || "",
          })
          .select()
          .single();

        customerId = newCustomer?.id;
      }
    }

    let assetId = null;

    // Create asset if we have equipment info
    if (customerId && parsedData.equipment?.serial) {
      const { data: existingAsset } = await supabase
        .from("assets")
        .select("id")
        .eq("customer_id", customerId)
        .eq("serial", parsedData.equipment.serial)
        .maybeSingle();

      if (existingAsset) {
        assetId = existingAsset.id;
      } else {
        const { data: newAsset } = await supabase
          .from("assets")
          .insert({
            customer_id: customerId,
            asset_type: parsedData.equipment.asset_type || "Other",
            brand: parsedData.equipment.brand || "",
            model_raw: parsedData.equipment.model_raw || "",
            serial: parsedData.equipment.serial || "",
            install_date: parsedData.equipment.install_date || null,
            source: "email",
          })
          .select()
          .single();

        assetId = newAsset?.id;
      }
    }

    let workOrderId = null;

    // Create work order in "queued" stage
    if (customerId) {
      const { data: workOrder } = await supabase
        .from("work_orders")
        .insert({
          customer_id: customerId,
          primary_asset_id: assetId,
          type: "warranty",
          status: "open",
          workflow_stage: "queued",
          installed_by: parsedData.equipment?.installed_by || "",
          installation_date: parsedData.equipment?.install_date || null,
          product_issue: parsedData.issue?.description || "",
          source_type: "gmail",
          source_ref: emailId,
        })
        .select()
        .single();

      workOrderId = workOrder?.id;
    }

    // Create warranty claim
    if (customerId && workOrderId) {
      await supabase.from("warranty_claims").insert({
        work_order_id: workOrderId,
        customer_id: customerId,
        stage: "intake",
        priority: parsedData.issue?.priority || "normal",
        vendor: "Fluidra/Jandy",
        dispatched_by: parsedData.dispatched_by || "",
        requestor_email: parsedData.customer?.email || "",
        requestor_phone: parsedData.customer?.phone || "",
        claim_notes: parsedData.issue?.description || "",
        email_id: emailId,
      });
    }

    // Update email status
    await supabase
      .from("emails_raw")
      .update({ processed_status: "parsed" })
      .eq("id", emailId);

    // Store extraction result
    await supabase.from("extraction_results").insert({
      email_id: emailId,
      customer_id: customerId,
      work_order_id: workOrderId,
      extracted_json: parsedData,
      confidence: 0.85,
      needs_review: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        customerId,
        workOrderId,
        extracted: parsedData,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Parse error:", error);

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
