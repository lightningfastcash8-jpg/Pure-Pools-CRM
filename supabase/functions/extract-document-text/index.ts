import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_CHUNK_SIZE = 8000;

function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      const lastNewline = text.lastIndexOf("\n", end);
      if (lastNewline > start) end = lastNewline;
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks.filter((c) => c.length > 0);
}

async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder("latin1");
  const raw = decoder.decode(bytes);

  const textParts: string[] = [];

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(raw)) !== null) {
    const streamContent = match[1];
    const textChunks = streamContent.match(/\(([^)\\]|\\.)*\)/g);
    if (textChunks) {
      const extracted = textChunks
        .map((t) => {
          return t
            .slice(1, -1)
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\\(/g, "(")
            .replace(/\\\)/g, ")")
            .replace(/\\\\/g, "\\")
            .replace(/[^\x20-\x7E\n\r\t]/g, " ");
        })
        .join(" ");
      if (extracted.trim().length > 3) {
        textParts.push(extracted);
      }
    }

    const tjMatches = streamContent.match(/\[((?:[^\[\]]|\\.)*)]\s*TJ/g);
    if (tjMatches) {
      for (const tjMatch of tjMatches) {
        const parts = tjMatch.match(/\(([^)\\]|\\.)*\)/g);
        if (parts) {
          const text = parts
            .map((p) =>
              p
                .slice(1, -1)
                .replace(/\\n/g, "\n")
                .replace(/\\\(/g, "(")
                .replace(/\\\)/g, ")")
                .replace(/\\\\/g, "\\")
                .replace(/[^\x20-\x7E\n\r\t]/g, " ")
            )
            .join("");
          if (text.trim().length > 3) {
            textParts.push(text);
          }
        }
      }
    }
  }

  let result = textParts.join("\n").replace(/\s{3,}/g, "\n\n").trim();

  if (result.length < 100) {
    const fallback = raw
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{3,}/g, "\n")
      .trim();
    result = fallback.substring(0, 50000);
  }

  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const docType = formData.get("doc_type") as string;

    if (!file || !title) {
      return new Response(JSON.stringify({ error: "Missing file or title" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const buffer = await file.arrayBuffer();
    const fileType = file.type || "";
    const fileName = file.name.toLowerCase();

    let extractedText = "";

    if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
      extractedText = await extractTextFromPdf(buffer);
    } else if (fileType.startsWith("text/") || fileName.endsWith(".txt")) {
      extractedText = new TextDecoder().decode(buffer);
    } else {
      extractedText = `File: ${file.name}\nSize: ${file.size} bytes\nNote: Binary file stored as reference.`;
    }

    if (!extractedText || extractedText.length < 50) {
      extractedText = `Document: ${title}\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nNote: Text could not be extracted from this file. Please use the "Paste Text" method to manually add the content from this document.`;
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const chunks = chunkText(extractedText, MAX_CHUNK_SIZE);
    const insertedIds: string[] = [];

    if (chunks.length === 1) {
      const { data, error } = await serviceClient
        .from("ai_knowledge_documents")
        .insert({
          doc_type: docType || "manual",
          title: title,
          content: chunks[0],
        })
        .select("id")
        .single();

      if (error) throw error;
      insertedIds.push(data.id);
    } else {
      for (let i = 0; i < chunks.length; i++) {
        const { data, error } = await serviceClient
          .from("ai_knowledge_documents")
          .insert({
            doc_type: docType || "manual",
            title: `${title} (Part ${i + 1} of ${chunks.length})`,
            content: chunks[i],
          })
          .select("id")
          .single();

        if (error) throw error;
        insertedIds.push(data.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        chunks: chunks.length,
        characters: extractedText.length,
        ids: insertedIds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("extract-document-text error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
