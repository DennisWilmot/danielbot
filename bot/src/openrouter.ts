import { ParsedReceipt, ParsedReceiptSchema } from "./types.js";
import { readFile } from "fs/promises";
import pdfParse from "pdf-parse";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");
  return apiKey;
}

const PARSING_PROMPT = `You are a receipt parsing assistant. Extract structured data from the receipt information provided.

Return ONLY a valid JSON object matching this exact schema (no markdown, no code blocks, just the JSON):
{
  "merchant": string | null,
  "date": "YYYY-MM-DD" | null,
  "currency": string | null,
  "total": number | null,
  "tax": number | null,
  "paymentMethod": string | null,
  "items": [
    {
      "name": string,
      "quantity": number | null,
      "unitPrice": number | null,
      "lineTotal": number | null
    }
  ],
  "notes": string | null,
  "confidence": number (0.0 to 1.0),
  "category": string | null,
  "location": string | null,
  "purchase": string | null
}

Rules:
- Return ONLY the JSON object, no other text
- Numbers must be numbers, not strings
- Dates must be in YYYY-MM-DD format when possible, otherwise null
- If a field cannot be determined, set it to null
- If items cannot be read, use an empty array
- confidence should reflect how confident you are (0.0 = not confident, 1.0 = very confident)
- category must be one of: "Software", "Equipment", "Infrastructure", "Training", "Marketing", "Services", "Other" (or null if cannot determine)
  * "Software": Software licenses, subscriptions, SaaS tools, apps
  * "Equipment": Hardware, computers, monitors, office furniture, physical devices
  * "Infrastructure": Cloud services, hosting, servers, networking equipment
  * "Training": Courses, books, educational materials, certifications
  * "Marketing": Advertising, promotional materials, social media ads, print materials
  * "Services": Consulting, professional services, maintenance, support
  * "Other": Anything that doesn't fit the above categories
- location should be the city/place where the purchase was made (e.g., "Kingston, Jamaica", "Remote", "New York, USA") or null if cannot determine
- purchase should be a concise, descriptive name for what was purchased (e.g., "Development Software Licenses", "Office Equipment & Supplies", "Cloud Infrastructure Services"). This should summarize the purpose or nature of the purchase, not just list items. If multiple items, create a general category name. If cannot determine, set to null.
- Do not include any fields not in the schema above`;

async function parseWithLLM(
  content: string,
  isImage: boolean = false,
  imagePath?: string
): Promise<ParsedReceipt> {
  const messages: Array<{ role: string; content: unknown }> = [
    { role: "system", content: PARSING_PROMPT },
  ];

  if (isImage && imagePath) {
    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";

    messages.push({
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64Image}` },
        },
        {
          type: "text",
          text:
            content || "Extract receipt information from this image.",
        },
      ],
    });
  } else {
    messages.push({
      role: "user",
      content:
        content || "Extract receipt information from this text.",
    });
  }

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API error: ${response.status} - ${errorText}`
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const contentText = data.choices?.[0]?.message?.content;
  if (!contentText) throw new Error("No response from LLM");

  let jsonText = contentText.trim();
  if (jsonText.startsWith("```json"))
    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  else if (jsonText.startsWith("```"))
    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Failed to parse LLM response as JSON");
  }

  return ParsedReceiptSchema.parse(parsed);
}

export async function parseTextReceipt(
  text: string
): Promise<ParsedReceipt> {
  return parseWithLLM(text, false);
}

export async function parseImageReceipt(
  imagePath: string,
  optionalText?: string
): Promise<ParsedReceipt> {
  return parseWithLLM(
    optionalText || "Extract receipt information from this image.",
    true,
    imagePath
  );
}

export async function parsePdfReceipt(
  pdfPath: string
): Promise<ParsedReceipt> {
  const pdfBuffer = await readFile(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  const extractedText = pdfData.text.trim();
  if (!extractedText || extractedText.length < 10) {
    throw new Error(
      "PDF extraction returned empty or insufficient text"
    );
  }
  return parseWithLLM(extractedText, false);
}
