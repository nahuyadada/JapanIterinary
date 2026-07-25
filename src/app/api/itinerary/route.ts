import { insertItinerary } from "@/lib/db";
import { generateShareCode } from "@/lib/shareCode";
import { parsePayload } from "@/lib/tripPayload";

// Every request writes to the database, so there is nothing to prerender or cache.
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
 * Store a trip and hand back its share code.
 *
 * The request body is untrusted: it is size-capped, then run through parsePayload, and
 * only the validated result is written. That way a stored row can never contain a place
 * id or a field the rest of the app doesn't recognise.
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

  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const code = generateShareCode();
      if (await insertItinerary(code, payload)) {
        return Response.json({ code }, { status: 201 });
      }
    }
  } catch (cause) {
    // The underlying message can name the database host or user, so it stays server-side.
    console.error("Failed to store shared itinerary", cause);
    return error("Could not save your trip. Please try again.", 500);
  }

  console.error(`Could not find an unused share code in ${MAX_ATTEMPTS} attempts`);
  return error("Could not save your trip. Please try again.", 500);
}
