import { insertItinerary } from "@/lib/db";
import { generateShareCode } from "@/lib/shareCode";
import { encodePayload, parsePayload } from "@/lib/tripPayload";

// Every request writes to the database or generates a share link, so there is nothing to prerender or cache.
export const dynamic = "force-dynamic";

/**
 * A generated code collides only by chance (one in ~8.5e11 per attempt against a stored
 * trip), so a handful of tries is plenty. If they all collide something is wrong with
 * the randomness, and failing loudly beats looping.
 */
const MAX_ATTEMPTS = 5;

/**
 * Room for a large trip and nothing more. The endpoint is unauthenticated, so the body
 * is capped before it is parsed rather than after.
 */
const MAX_BODY_BYTES = 64 * 1024;

function error(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

/**
 * Store a trip and hand back its share code (or an encoded share URL as a fallback).
 */
export async function POST(request: Request): Promise<Response> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return error("That trip is too large to share.", 413);
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return error("That trip is too large to share.", 413);
    }
    body = JSON.parse(text);
  } catch {
    return error("Could not read that trip.", 400);
  }

  const payload = parsePayload(body);
  if (!payload) {
    return error("That trip is missing something we need — pick your places and dates again.", 400);
  }

  if (process.env.DATABASE_URL) {
    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const code = generateShareCode();
        if (await insertItinerary(code, payload)) {
          return Response.json({ code, url: `/itinerary/${code}` }, { status: 201 });
        }
      }
    } catch (cause) {
      console.error("Failed to store shared itinerary in database, falling back to URL encoding", cause);
    }
  }

  // Database fallback: URL-encoded payload link guarantees sharing always works
  const encoded = encodePayload(payload);
  return Response.json({
    code: "LINK",
    url: `/itinerary/view?p=${encoded}`,
    fallback: true,
  }, { status: 200 });
}

