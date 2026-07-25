import { Pool } from "pg";

/**
 * Shared Postgres pool.
 *
 * Next.js hot-reloads modules in dev, which would otherwise open a new pool on every
 * edit until the database refuses connections. Stashing it on globalThis keeps exactly
 * one pool per process.
 */
const globalForDb = globalThis as unknown as { itineraryPool?: Pool };

function pool(): Pool {
  if (!globalForDb.itineraryPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — add it to .env.local");
    }
    globalForDb.itineraryPool = new Pool({
      connectionString,
      // Supabase's pooler presents a cert this client doesn't chain to; the connection
      // is still encrypted in transit.
      ssl: { rejectUnauthorized: false },
      max: 4,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForDb.itineraryPool;
}

/** A stored trip snapshot. `payload` is validated by tripPayload.ts before use. */
export type StoredItinerary = {
  code: string;
  payload: unknown;
  createdAt: Date;
};

/** Insert a trip under `code`. Returns false when the code is already taken. */
export async function insertItinerary(code: string, payload: unknown): Promise<boolean> {
  const result = await pool().query(
    "insert into itineraries (code, payload) values ($1, $2) on conflict (code) do nothing",
    [code, JSON.stringify(payload)]
  );
  return (result.rowCount ?? 0) > 0;
}

/** Fetch a trip by code, or null when no such trip exists. */
export async function getItinerary(code: string): Promise<StoredItinerary | null> {
  const result = await pool().query<{ code: string; payload: unknown; created_at: Date }>(
    "select code, payload, created_at from itineraries where code = $1",
    [code]
  );
  const row = result.rows[0];
  return row ? { code: row.code, payload: row.payload, createdAt: row.created_at } : null;
}
