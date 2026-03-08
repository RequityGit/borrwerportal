import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

interface ExtractedField {
  value: string | number | boolean;
  confidence: number;
  source: string;
}

interface ExtractionResponse {
  deal_fields: Record<string, ExtractedField>;
  extracted_fields: Record<string, ExtractedField>;
  summary: string;
}

export async function POST(req: NextRequest) {
  // Auth: check for service role key or session-based auth
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    // Fall back to cookie-based auth
    const { createClient: createServerClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const cardTypeId = formData.get("card_type_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!cardTypeId) {
      return NextResponse.json(
        { error: "No card_type_id provided" },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI extraction is not configured" },
        { status: 500 }
      );
    }

    // Look up card type's uw_fields for the target schema
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: cardType, error: ctError } = await admin
      .from("unified_card_types")
      .select("label, uw_fields, property_fields")
      .eq("id", cardTypeId)
      .single();

    if (ctError || !cardType) {
      return NextResponse.json(
        { error: "Card type not found" },
        { status: 404 }
      );
    }

    // Reject unsupported file types early
    const fileName = file.name.toLowerCase();
    if (
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx") ||
      file.type.includes("msword") ||
      file.type.includes("officedocument")
    ) {
      return NextResponse.json(
        {
          error:
            "Word documents are not supported for AI extraction. Please upload a PDF or image file.",
        },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Determine media type
    let mediaType: string;
    if (file.type.startsWith("image/")) {
      mediaType = file.type;
    } else {
      mediaType = "application/pdf";
    }

    // Build the target field descriptions from uw_fields
    const uwFields = (cardType.uw_fields ?? []) as Array<{
      key: string;
      label: string;
      type: string;
      options?: string[];
    }>;
    const propertyFields = (cardType.property_fields ?? []) as Array<{
      key: string;
      label: string;
      type: string;
      options?: string[];
    }>;

    const uwFieldDescriptions = uwFields
      .map((f) => {
        let desc = `- ${f.key} (${f.type}): ${f.label}`;
        if (f.options?.length) {
          desc += ` [options: ${f.options.join(", ")}]`;
        }
        return desc;
      })
      .join("\n");

    const propertyFieldDescriptions = propertyFields
      .map((f) => {
        let desc = `- ${f.key} (${f.type}): ${f.label}`;
        if (f.options?.length) {
          desc += ` [options: ${f.options.join(", ")}]`;
        }
        return desc;
      })
      .join("\n");

    const prompt = `Extract deal information from this document for a real estate lending platform. This is a "${cardType.label}" deal type.

Standard deal fields to extract:
- name (text): Deal name, property address, or project name
- amount (currency): Loan amount, deal size, or investment amount
- expected_close_date (date, YYYY-MM-DD format): Expected closing date
- asset_class (select from: sfr, duplex_fourplex, multifamily, mhc, rv_park, campground, commercial, mixed_use, land): Property/asset type

${uwFieldDescriptions ? `Underwriting fields to extract:\n${uwFieldDescriptions}` : ""}

${propertyFieldDescriptions ? `Property fields to extract:\n${propertyFieldDescriptions}` : ""}

For each field, extract the value if found in the document. Rate your confidence (0.0 to 1.0) in the extraction accuracy. Reference where in the document you found the data.

Respond with ONLY valid JSON in this exact format:
{
  "deal_fields": {
    "<field_name>": { "value": <extracted_value>, "confidence": <0.0-1.0>, "source": "<page/section reference>" }
  },
  "extracted_fields": {
    "<uw_field_key>": { "value": <extracted_value>, "confidence": <0.0-1.0>, "source": "<page/section reference>" }
  },
  "summary": "<2-3 sentence summary of the document>"
}

Only include fields that you can actually find data for in the document. Do not guess or fabricate values.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const apiMessage =
        errorData?.error?.message ?? "Unknown API error";
      console.error(
        "Anthropic API error:",
        response.status,
        apiMessage,
        errorData
      );
      return NextResponse.json(
        { error: `AI extraction failed: ${apiMessage}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { error: "No extraction result from AI" },
        { status: 502 }
      );
    }

    const parsed: ExtractionResponse = JSON.parse(
      text.replace(/```json|```/g, "").trim()
    );

    return NextResponse.json({
      deal_fields: parsed.deal_fields ?? {},
      extracted_fields: parsed.extracted_fields ?? {},
      summary: parsed.summary ?? "",
    });
  } catch (error) {
    console.error("extract-from-document error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to extract document",
      },
      { status: 500 }
    );
  }
}
