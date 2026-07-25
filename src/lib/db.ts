import { Pool } from "pg";

/**
 * Shared Postgres pool.
 *
 * Next.js hot-reloads modules in dev, which would otherwise open a new pool on every
 * edit until the database refuses connections. Stashing it on globalThis keeps exactly
 * one pool per process.
 */
const globalForDb = globalThis as unknown as { itineraryPool?: Pool };

function getConnectionString(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  let str = raw.trim().replace(/^["']|["']$/g, "");
  try {
    const match = str.match(/^(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@.+)$/);
    if (match) {
      const [, prefix, pass, suffix] = match;
      if (/[!*#$%/:]/.test(pass) && !/%[0-9A-Fa-f]{2}/.test(pass)) {
        str = `${prefix}${encodeURIComponent(pass)}${suffix}`;
      }
    }
  } catch {
    // ignore
  }
  return str;
}


function pool(): Pool {
  if (!globalForDb.itineraryPool) {
    const connectionString = getConnectionString();
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set — add it to .env.local");
    }
    const p = new Pool({
      connectionString,
      // Supabase's pooler presents a cert this client doesn't chain to; the connection
      // is still encrypted in transit.
      ssl: { rejectUnauthorized: false },
      max: 4,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    p.on("error", (err) => {
      console.error("Unexpected error on idle database pool client", err);
      globalForDb.itineraryPool = undefined;
    });
    globalForDb.itineraryPool = p;
  }
  return globalForDb.itineraryPool;
}

/** A stored trip snapshot. `payload` is validated by tripPayload.ts before use. */
export type StoredItinerary = {
  code: string;
  payload: unknown;
  createdAt: Date;
};

let schemaEnsured = false;

async function ensureSchema(p: Pool) {
  if (schemaEnsured) return;
  try {
    await p.query(`
      create table if not exists itineraries (
        code        text primary key,
        payload     jsonb not null,
        created_at  timestamptz not null default now()
      );
      create index if not exists itineraries_created_at_idx on itineraries (created_at);
    `);
    schemaEnsured = true;
  } catch (err) {
    console.error("Failed to ensure database schema:", err);
  }
}

/** Insert a trip under `code`. Returns false when the code is already taken or DB is unavailable. */
export async function insertItinerary(code: string, payload: unknown): Promise<boolean> {
  if (!getConnectionString()) return false;
  try {
    const p = pool();
    await ensureSchema(p);
    const result = await p.query(
      "insert into itineraries (code, payload) values ($1, $2) on conflict (code) do nothing",
      [code, JSON.stringify(payload)]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (cause) {
    console.error("Database insert failed:", cause);
    return false;
  }
}

/** Fetch a trip by code, or null when no such trip exists or DB is unavailable. */
export async function getItinerary(code: string): Promise<StoredItinerary | null> {
  if (!getConnectionString()) return null;
  try {
    const p = pool();
    await ensureSchema(p);
    const result = await p.query<{ code: string; payload: unknown; created_at: Date }>(
      "select code, payload, created_at from itineraries where code = $1",
      [code]
    );
    const row = result.rows[0];
    return row ? { code: row.code, payload: row.payload, createdAt: row.created_at } : null;
  } catch (cause) {
    console.error("Database query failed:", cause);
    return null;
  }
}



