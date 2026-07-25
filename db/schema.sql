-- Shared itineraries. Apply with: npm run db:setup
--
-- A shared trip is an immutable snapshot: the payload holds place ids, dates, and
-- options, and the page rebuilds the itinerary from them using the same pure functions
-- the wizard uses. Storing inputs rather than rendered output means a shared link picks
-- up later improvements to the routing and scheduling logic for free.
--
-- No user accounts: a code is the only credential, so codes must be unguessable enough
-- that trips can't be enumerated (see src/lib/shareCode.ts).

create table if not exists itineraries (
  code        text primary key,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);

-- Cheap retention sweep: created_at lets old anonymous trips be pruned on a schedule
-- without scanning the payloads.
create index if not exists itineraries_created_at_idx on itineraries (created_at);
