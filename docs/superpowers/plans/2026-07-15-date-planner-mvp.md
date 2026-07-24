# DatePlanner MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the DatePlanner MVP — a responsive Next.js web app where users plan single- or multi-day dates with real places, budget tracking (estimated vs. actual), weather, sharing, and print/PDF export.

**Architecture:** Single Next.js (App Router, TypeScript) codebase: React UI + API route handlers, PostgreSQL via Prisma, NextAuth (credentials) for auth. Map rendering uses Leaflet + OpenStreetMap tiles (free, no key); place *search* proxies the Google Places API server-side. Weather proxies Open-Meteo. Budget/access logic lives in pure, unit-tested libs. Export = print-friendly view (browser print → PDF).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Prisma + PostgreSQL, NextAuth v5 (credentials + bcrypt), react-leaflet, Vitest, Google Places API, Open-Meteo.

**Spec:** `docs/superpowers/specs/2026-07-15-date-planner-design.md`

**Environment note:** Real `GOOGLE_PLACES_API_KEY` and `DATABASE_URL` are not yet available. Use placeholder values in `.env`; all external calls must degrade gracefully (spec requirement) so the app runs end-to-end without them. Keep the Prisma provider as `postgresql`; migrations are deferred until a Neon/Supabase `DATABASE_URL` is provided.

---

### Task 1: Scaffold project, git, and tooling

**Files:**
- Create: entire Next.js scaffold at repo root (`package.json`, `src/app/*`, `tsconfig.json`, Tailwind config, etc.)
- Create: `.env.example`, `.gitignore` additions, `vitest.config.ts`
- Modify: `CLAUDE.md` (fill in Commands section)

- [ ] **Step 1: git init and initial commit of existing docs**

```bash
cd "C:/Users/admin/Documents/DatePlanner"
git init
printf ".superpowers/\nnode_modules/\n.env\n.next/\n" > .gitignore
git add CLAUDE.md docs .gitignore
git commit -m "docs: add design spec, implementation plan, CLAUDE.md"
```

- [ ] **Step 2: Scaffold Next.js in-place**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --use-npm --no-import-alias --turbopack
```

(If it complains about a non-empty directory, scaffold into `tmp-scaffold` and move contents up, keeping our docs/CLAUDE.md/.git.)

Note: if `--no-import-alias` is used the scaffold has no `@/` alias — in that case add to `tsconfig.json` `compilerOptions.paths`: `{"@/*": ["./src/*"]}` since all plan code imports via `@/`.

- [ ] **Step 3: Install dependencies**

```bash
npm install prisma @prisma/client next-auth@beta bcryptjs leaflet react-leaflet
npm install -D vitest @types/bcryptjs @types/leaflet
```

- [ ] **Step 4: Create `.env.example` and `.env`**

`.env.example`:
```
DATABASE_URL="postgresql://user:pass@localhost:5432/dateplanner"
NEXTAUTH_SECRET="replace-me"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_PLACES_API_KEY="replace-me"
```
Copy to `.env` with a generated `NEXTAUTH_SECRET` (`openssl rand -base64 32`).

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

- [ ] **Step 6: Add npm scripts to `package.json`**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify dev server boots**

Run: `npm run dev` — expect Next.js welcome page at http://localhost:3000. Stop it.

- [ ] **Step 8: Update CLAUDE.md Commands section**

Replace the placeholder with:
```markdown
## Commands
- `npm run dev` — dev server (http://localhost:3000)
- `npm run test` — unit/integration tests (Vitest)
- `npm run lint` — ESLint
- `npx prisma migrate dev` — apply migrations
- `npx prisma studio` — inspect DB
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with Tailwind, Prisma, NextAuth, Vitest"
```

---

### Task 2: Prisma schema and client

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Write `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String             @id @default(cuid())
  email          String             @unique
  passwordHash   String
  name           String
  plans          Plan[]
  collaborations PlanCollaborator[]
  createdAt      DateTime           @default(now())
}

model Plan {
  id            String             @id @default(cuid())
  owner         User               @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  ownerId       String
  title         String
  startDate     DateTime
  endDate       DateTime
  budgetLimit   Float?
  shareToken    String             @unique @default(cuid())
  days          PlanDay[]
  collaborators PlanCollaborator[]
  createdAt     DateTime           @default(now())
}

model PlanDay {
  id       String   @id @default(cuid())
  plan     Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  planId   String
  date     DateTime
  dayOrder Int
  stops    Stop[]
}

model Stop {
  id            String   @id @default(cuid())
  planDay       PlanDay  @relation(fields: [planDayId], references: [id], onDelete: Cascade)
  planDayId     String
  name          String
  address       String   @default("")
  lat           Float?
  lng           Float?
  category      String   @default("other") // restaurant|park|scenic|entertainment|activity|shopping|other
  startTime     String?  // "18:00"
  endTime       String?
  estimatedCost Float    @default(0)
  actualCost    Float?
  notes         String   @default("")
  stopOrder     Int
  source        String   @default("manual") // manual|places_api
}

model PlanCollaborator {
  plan   Plan   @relation(fields: [planId], references: [id], onDelete: Cascade)
  planId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String
  role   String @default("editor")

  @@id([planId, userId])
}
```

- [ ] **Step 2: Write `src/lib/prisma.ts`**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Generate client (and migrate if DB reachable)**

Run: `npx prisma generate` — expect "Generated Prisma Client".
If `DATABASE_URL` points to a live DB: `npx prisma migrate dev --name init`. Otherwise note that migration is deferred until Neon is provisioned.

- [ ] **Step 4: Commit**

```bash
git add prisma src/lib/prisma.ts && git commit -m "feat: add Prisma schema for users, plans, days, stops, collaborators"
```

---

### Task 3: Budget calculation lib (TDD)

**Files:**
- Create: `src/lib/budget.ts`
- Test: `src/lib/budget.test.ts`

- [ ] **Step 1: Write the failing tests** (`src/lib/budget.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { planTotals } from "./budget";

const stop = (est: number, act: number | null = null) => ({ estimatedCost: est, actualCost: act });

describe("planTotals", () => {
  it("sums estimated costs", () => {
    expect(planTotals([stop(45), stop(28), stop(12)], null).totalEstimated).toBe(85);
  });
  it("sums only logged actual costs", () => {
    const t = planTotals([stop(45, 50), stop(28, null)], null);
    expect(t.totalActual).toBe(50);
    expect(t.hasActuals).toBe(true);
  });
  it("reports no actuals when none logged", () => {
    expect(planTotals([stop(45)], null).hasActuals).toBe(false);
  });
  it("flags over budget only when limit set and exceeded", () => {
    expect(planTotals([stop(100)], 90).overBudget).toBe(true);
    expect(planTotals([stop(100)], 100).overBudget).toBe(false);
    expect(planTotals([stop(100)], null).overBudget).toBe(false);
  });
  it("computes variance (actual - estimated) over stops with actuals", () => {
    const t = planTotals([stop(45, 50), stop(28, 20), stop(12, null)], null);
    expect(t.variance).toBe(-3); // (50-45)+(20-28)
  });
  it("handles empty plan", () => {
    const t = planTotals([], 50);
    expect(t.totalEstimated).toBe(0);
    expect(t.overBudget).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test` — expect FAIL: cannot resolve `./budget`.

- [ ] **Step 3: Implement `src/lib/budget.ts`**

```ts
export interface CostedStop {
  estimatedCost: number;
  actualCost: number | null;
}

export interface PlanTotals {
  totalEstimated: number;
  totalActual: number;
  hasActuals: boolean;
  overBudget: boolean;
  variance: number; // actual - estimated, only over stops with a logged actual
}

export function planTotals(stops: CostedStop[], budgetLimit: number | null): PlanTotals {
  const totalEstimated = stops.reduce((s, x) => s + x.estimatedCost, 0);
  const withActuals = stops.filter((x) => x.actualCost !== null);
  const totalActual = withActuals.reduce((s, x) => s + (x.actualCost as number), 0);
  const variance = withActuals.reduce((s, x) => s + ((x.actualCost as number) - x.estimatedCost), 0);
  return {
    totalEstimated,
    totalActual,
    hasActuals: withActuals.length > 0,
    overBudget: budgetLimit !== null && totalEstimated > budgetLimit,
    variance,
  };
}
```

- [ ] **Step 4: Run tests — `npm test`, expect all PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/budget.ts src/lib/budget.test.ts && git commit -m "feat: budget totals, over-budget flag, variance (TDD)"
```

---

### Task 4: Access control lib (TDD)

**Files:**
- Create: `src/lib/access.ts`
- Test: `src/lib/access.test.ts`

- [ ] **Step 1: Write the failing tests** (`src/lib/access.test.ts`)

```ts
import { describe, it, expect } from "vitest";
import { resolveRole, canEdit, canView } from "./access";

const plan = {
  ownerId: "u1",
  shareToken: "tok123",
  collaborators: [{ userId: "u2", role: "editor" }],
};

describe("resolveRole", () => {
  it("owner gets owner role", () => {
    expect(resolveRole(plan, { userId: "u1" })).toBe("owner");
  });
  it("collaborator gets editor role", () => {
    expect(resolveRole(plan, { userId: "u2" })).toBe("editor");
  });
  it("valid share token gets viewer role", () => {
    expect(resolveRole(plan, { shareToken: "tok123" })).toBe("viewer");
  });
  it("wrong token and unknown user get null", () => {
    expect(resolveRole(plan, { userId: "u9", shareToken: "nope" })).toBe(null);
    expect(resolveRole(plan, {})).toBe(null);
  });
  it("owner wins over share token", () => {
    expect(resolveRole(plan, { userId: "u1", shareToken: "tok123" })).toBe("owner");
  });
});

describe("permissions", () => {
  it("owner and editor can edit; viewer cannot", () => {
    expect(canEdit("owner")).toBe(true);
    expect(canEdit("editor")).toBe(true);
    expect(canEdit("viewer")).toBe(false);
    expect(canEdit(null)).toBe(false);
  });
  it("any non-null role can view", () => {
    expect(canView("viewer")).toBe(true);
    expect(canView(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure** — `npm test`, expect FAIL: cannot resolve `./access`.

- [ ] **Step 3: Implement `src/lib/access.ts`**

```ts
export type Role = "owner" | "editor" | "viewer" | null;

export interface PlanAccessInfo {
  ownerId: string;
  shareToken: string;
  collaborators: { userId: string; role: string }[];
}

export function resolveRole(
  plan: PlanAccessInfo,
  ctx: { userId?: string; shareToken?: string }
): Role {
  if (ctx.userId && ctx.userId === plan.ownerId) return "owner";
  if (ctx.userId && plan.collaborators.some((c) => c.userId === ctx.userId)) return "editor";
  if (ctx.shareToken && ctx.shareToken === plan.shareToken) return "viewer";
  return null;
}

export const canEdit = (r: Role) => r === "owner" || r === "editor";
export const canView = (r: Role) => r !== null;
```

- [ ] **Step 4: Run tests — `npm test`, expect all PASS**

- [ ] **Step 5: Commit**

```bash
git add src/lib/access.ts src/lib/access.test.ts && git commit -m "feat: role resolution and edit/view permissions (TDD)"
```

---

### Task 5: Auth (NextAuth credentials + registration)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/app/api/register/route.ts`
- Create: `src/types/next-auth.d.ts`

- [ ] **Step 1: Write `src/lib/auth.ts`**

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        return ok ? { id: user.id, email: user.email, name: user.name } : null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const path = request.nextUrl.pathname;
      const publicPaths = ["/login", "/register", "/shared", "/api/auth", "/api/register", "/api/weather"];
      if (publicPaths.some((p) => path.startsWith(p))) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
```

- [ ] **Step 2: Write `src/types/next-auth.d.ts`**

```ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}
```

- [ ] **Step 3: Write `src/app/api/auth/[...nextauth]/route.ts`**

```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

- [ ] **Step 4: Write `src/app/api/register/route.ts`**

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").toLowerCase().trim();
  const password = String(body?.password ?? "");
  const name = String(body?.name ?? "").trim();
  if (!email.includes("@") || password.length < 8 || !name) {
    return NextResponse.json(
      { error: "Valid email, name, and password (min 8 chars) required" },
      { status: 400 }
    );
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });
  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
```

- [ ] **Step 5: Verify build compiles**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth src/app/api/register src/types && git commit -m "feat: credentials auth with NextAuth and registration endpoint"
```

---

### Task 6: Plan API routes (CRUD + auto day generation)

**Files:**
- Create: `src/lib/planAccess.ts` (DB-backed role lookup helper)
- Create: `src/app/api/plans/route.ts`
- Create: `src/app/api/plans/[planId]/route.ts`

- [ ] **Step 1: Write `src/lib/planAccess.ts`**

```ts
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveRole, Role } from "@/lib/access";

export async function getPlanRole(
  planId: string,
  shareToken?: string
): Promise<{ role: Role; userId?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: {
      ownerId: true,
      shareToken: true,
      collaborators: { select: { userId: true, role: true } },
    },
  });
  if (!plan) return { role: null, userId };
  return { role: resolveRole(plan, { userId, shareToken }), userId };
}
```

- [ ] **Step 2: Write `src/app/api/plans/route.ts`** (GET = list my plans, POST = create with generated days)

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const plans = await prisma.plan.findMany({
    where: {
      OR: [{ ownerId: session.user.id }, { collaborators: { some: { userId: session.user.id } } }],
    },
    orderBy: { startDate: "desc" },
    include: { days: { include: { stops: true } } },
  });
  return NextResponse.json(plans);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  const start = new Date(body?.startDate);
  const end = new Date(body?.endDate ?? body?.startDate);
  const budgetLimit = body?.budgetLimit != null ? Number(body.budgetLimit) : null;
  if (!title || isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return NextResponse.json({ error: "title and valid date range required" }, { status: 400 });
  }
  // Generate one PlanDay per date in range (inclusive)
  const days: { date: Date; dayOrder: number }[] = [];
  for (let d = new Date(start), i = 0; d <= end; d.setDate(d.getDate() + 1), i++) {
    days.push({ date: new Date(d), dayOrder: i });
  }
  const plan = await prisma.plan.create({
    data: {
      ownerId: session.user.id,
      title,
      startDate: start,
      endDate: end,
      budgetLimit,
      days: { create: days },
    },
    include: { days: true },
  });
  return NextResponse.json(plan, { status: 201 });
}
```

- [ ] **Step 3: Write `src/app/api/plans/[planId]/route.ts`** (GET with totals, PATCH, DELETE — role-checked)

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanRole } from "@/lib/planAccess";
import { canEdit, canView } from "@/lib/access";
import { planTotals } from "@/lib/budget";

type Params = { params: Promise<{ planId: string }> };

export async function GET(req: Request, { params }: Params) {
  const { planId } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? undefined;
  const { role } = await getPlanRole(planId, token);
  if (!canView(role)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      days: {
        orderBy: { dayOrder: "asc" },
        include: { stops: { orderBy: { stopOrder: "asc" } } },
      },
    },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const allStops = plan.days.flatMap((d) => d.stops);
  const totals = planTotals(allStops, plan.budgetLimit);
  // viewers never receive the shareToken back
  const { shareToken, ...safe } = plan;
  return NextResponse.json({ ...safe, ...(role === "owner" ? { shareToken } : {}), role, totals });
}

export async function PATCH(req: Request, { params }: Params) {
  const { planId } = await params;
  const { role } = await getPlanRole(planId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.budgetLimit !== undefined)
    data.budgetLimit = body.budgetLimit === null ? null : Number(body.budgetLimit);
  const plan = await prisma.plan.update({ where: { id: planId }, data });
  return NextResponse.json(plan);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { planId } = await params;
  const { role } = await getPlanRole(planId);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.plan.delete({ where: { id: planId } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify compile**

Run: `npx tsc --noEmit` — expect no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/plans src/lib/planAccess.ts && git commit -m "feat: plan CRUD API with role checks, day generation, budget totals"
```

---

### Task 7: Stop API routes

**Files:**
- Create: `src/app/api/plans/[planId]/days/[dayId]/stops/route.ts` (POST create)
- Create: `src/app/api/plans/[planId]/stops/[stopId]/route.ts` (PATCH incl. actualCost, DELETE)

- [ ] **Step 1: Write the create route** (`src/app/api/plans/[planId]/days/[dayId]/stops/route.ts`)

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanRole } from "@/lib/planAccess";
import { canEdit } from "@/lib/access";

const CATEGORIES = ["restaurant", "park", "scenic", "entertainment", "activity", "shopping", "other"];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string; dayId: string }> }
) {
  const { planId, dayId } = await params;
  const { role } = await getPlanRole(planId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const day = await prisma.planDay.findFirst({ where: { id: dayId, planId } });
  if (!day) return NextResponse.json({ error: "Day not found" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const name = String(b?.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const count = await prisma.stop.count({ where: { planDayId: dayId } });
  const stop = await prisma.stop.create({
    data: {
      planDayId: dayId,
      name,
      address: String(b?.address ?? ""),
      lat: b?.lat != null ? Number(b.lat) : null,
      lng: b?.lng != null ? Number(b.lng) : null,
      category: CATEGORIES.includes(b?.category) ? b.category : "other",
      startTime: b?.startTime ?? null,
      endTime: b?.endTime ?? null,
      estimatedCost: Number(b?.estimatedCost ?? 0) || 0,
      notes: String(b?.notes ?? ""),
      stopOrder: count,
      source: b?.source === "places_api" ? "places_api" : "manual",
    },
  });
  return NextResponse.json(stop, { status: 201 });
}
```

- [ ] **Step 2: Write the update/delete route** (`src/app/api/plans/[planId]/stops/[stopId]/route.ts`)

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanRole } from "@/lib/planAccess";
import { canEdit } from "@/lib/access";

type Params = { params: Promise<{ planId: string; stopId: string }> };

async function findStopInPlan(planId: string, stopId: string) {
  return prisma.stop.findFirst({ where: { id: stopId, planDay: { planId } } });
}

export async function PATCH(req: Request, { params }: Params) {
  const { planId, stopId } = await params;
  const { role } = await getPlanRole(planId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await findStopInPlan(planId, stopId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["name", "address", "notes", "startTime", "endTime", "category"] as const) {
    if (b[k] !== undefined) data[k] = b[k];
  }
  if (b.estimatedCost !== undefined) data.estimatedCost = Number(b.estimatedCost) || 0;
  if (b.actualCost !== undefined) data.actualCost = b.actualCost === null ? null : Number(b.actualCost);
  if (b.stopOrder !== undefined) data.stopOrder = Number(b.stopOrder);
  if (b.lat !== undefined) data.lat = b.lat === null ? null : Number(b.lat);
  if (b.lng !== undefined) data.lng = b.lng === null ? null : Number(b.lng);
  const stop = await prisma.stop.update({ where: { id: stopId }, data });
  return NextResponse.json(stop);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { planId, stopId } = await params;
  const { role } = await getPlanRole(planId);
  if (!canEdit(role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!(await findStopInPlan(planId, stopId)))
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.stop.delete({ where: { id: stopId } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verify compile** — `npx tsc --noEmit`, expect no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/plans && git commit -m "feat: stop create/update/delete API with role checks and actual-cost logging"
```

---

### Task 8: Collaborator invite API

**Files:**
- Create: `src/app/api/plans/[planId]/collaborators/route.ts`

- [ ] **Step 1: Write route (POST = invite by email, owner only)**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPlanRole } from "@/lib/planAccess";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const { planId } = await params;
  const { role } = await getPlanRole(planId);
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const email = String(b?.email ?? "").toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "No account with that email. Ask them to sign up first, then invite again." },
      { status: 404 }
    );
  }
  const plan = await prisma.plan.findUnique({ where: { id: planId }, select: { ownerId: true } });
  if (plan?.ownerId === user.id)
    return NextResponse.json({ error: "You already own this plan" }, { status: 400 });
  await prisma.planCollaborator.upsert({
    where: { planId_userId: { planId, userId: user.id } },
    create: { planId, userId: user.id, role: "editor" },
    update: {},
  });
  return NextResponse.json({ ok: true, invited: user.email }, { status: 201 });
}
```

- [ ] **Step 2: Verify compile** — `npx tsc --noEmit`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/plans && git commit -m "feat: invite collaborator by email (owner only)"
```

---

### Task 9: Places search proxy (graceful fallback)

**Files:**
- Create: `src/app/api/places/search/route.ts`

- [ ] **Step 1: Write route** — proxies Google Places Text Search (New); returns `{ results, fallback }`. Any failure (missing key, network, quota) returns `fallback: true` and empty results so the UI switches to manual entry — never a 500.

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface PlaceResult {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: number | null; // 0-4, null if unknown
  estimatedCost: number; // rough per-person estimate from price level
}

const PRICE_TO_COST: Record<number, number> = { 0: 0, 1: 10, 2: 25, 3: 50, 4: 100 };

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const query = String(b?.query ?? "").trim();
  if (!query) return NextResponse.json({ results: [], fallback: false });

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || key === "replace-me") return NextResponse.json({ results: [], fallback: true });

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel",
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 8 }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ results: [], fallback: true });
    const data = await res.json();
    const PRICE_ENUM: Record<string, number> = {
      PRICE_LEVEL_FREE: 0,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };
    const results: PlaceResult[] = (data.places ?? []).map((p: any) => {
      const priceLevel = p.priceLevel != null ? PRICE_ENUM[p.priceLevel] ?? null : null;
      return {
        name: p.displayName?.text ?? "Unknown",
        address: p.formattedAddress ?? "",
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        rating: p.rating ?? null,
        userRatingCount: p.userRatingCount ?? null,
        priceLevel,
        estimatedCost: priceLevel != null ? PRICE_TO_COST[priceLevel] : 0,
      };
    });
    // Ratings-based suggestion ordering: highest rating * log(review count) first
    results.sort(
      (a, b2) =>
        (b2.rating ?? 0) * Math.log10((b2.userRatingCount ?? 0) + 1) -
        (a.rating ?? 0) * Math.log10((a.userRatingCount ?? 0) + 1)
    );
    return NextResponse.json({ results, fallback: false });
  } catch {
    return NextResponse.json({ results: [], fallback: true });
  }
}
```

- [ ] **Step 2: Verify compile** — `npx tsc --noEmit`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/places && git commit -m "feat: Places text-search proxy with rating-based ordering and graceful fallback"
```

---

### Task 10: Weather proxy (Open-Meteo, graceful fallback)

**Files:**
- Create: `src/app/api/weather/route.ts`

- [ ] **Step 1: Write route** — GET `?lat=&lng=&start=YYYY-MM-DD&end=YYYY-MM-DD`. Returns `{ days: [{date, tempMax, tempMin, precipChance, code}] }` or `{ days: null }` when unavailable (beyond ~14-day window, API down, or missing coords). Never a 500.

```ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const lat = Number(u.searchParams.get("lat"));
  const lng = Number(u.searchParams.get("lng"));
  const start = u.searchParams.get("start");
  const end = u.searchParams.get("end") ?? start;
  if (isNaN(lat) || isNaN(lng) || !start) return NextResponse.json({ days: null });
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&start_date=${start}&end_date=${end}&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ days: null });
    const d = await res.json();
    if (!d?.daily?.time) return NextResponse.json({ days: null });
    const days = d.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: d.daily.temperature_2m_max[i],
      tempMin: d.daily.temperature_2m_min[i],
      precipChance: d.daily.precipitation_probability_max[i],
      code: d.daily.weather_code[i],
    }));
    return NextResponse.json({ days });
  } catch {
    return NextResponse.json({ days: null });
  }
}
```

- [ ] **Step 2: Verify compile** — `npx tsc --noEmit`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/weather && git commit -m "feat: Open-Meteo weather proxy with graceful degradation"
```

---

### Task 11: Auth UI (login, register) + app shell

**Files:**
- Create: `src/app/login/page.tsx`, `src/app/register/page.tsx`
- Create: `src/components/AppNav.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/middleware.ts`

- [ ] **Step 1: Write `src/components/AppNav.tsx`**

```tsx
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function AppNav() {
  const session = await auth();
  return (
    <nav className="flex items-center justify-between px-4 py-3 border-b bg-white print:hidden">
      <Link href="/" className="font-bold text-rose-600 text-lg">�map DatePlanner</Link>
      {session?.user ? (
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <span className="text-sm text-gray-600 mr-3">{session.user.name}</span>
          <button className="text-sm text-gray-500 underline">Sign out</button>
        </form>
      ) : (
        <Link href="/login" className="text-sm underline">Sign in</Link>
      )}
    </nav>
  );
}
```

(Replace `�map` with `💕` — single emoji, no stray text.)

- [ ] **Step 2: Update `src/app/layout.tsx`** — set metadata title/description to "DatePlanner", render `<AppNav />` above `{children}` inside `<body>`, keep Tailwind globals import. Give `<body>` `className="bg-gray-50 min-h-screen"`.

- [ ] **Step 3: Write `src/app/login/page.tsx`** (client component)

```tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError("Invalid email or password");
    else { router.push("/"); router.refresh(); }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-xl bg-white">
      <h1 className="text-xl font-bold mb-4">Sign in</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="border rounded p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="border rounded p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="bg-rose-600 text-white rounded p-2">Sign in</button>
      </form>
      <p className="text-sm mt-3">No account? <Link className="underline" href="/register">Register</Link></p>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/register/page.tsx`** (client component)

```tsx
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Registration failed"); return; }
    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded-xl bg-white">
      <h1 className="text-xl font-bold mb-4">Create account</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className="border rounded p-2" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="border rounded p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="border rounded p-2" type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="bg-rose-600 text-white rounded p-2">Register</button>
      </form>
      <p className="text-sm mt-3">Have an account? <Link className="underline" href="/login">Sign in</Link></p>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/middleware.ts`** (the `authorized` callback was already added in Task 5)

```ts
export { auth as middleware } from "@/lib/auth";

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
```

- [ ] **Step 6: Verify** — `npm run dev`; visiting `/` unauthenticated redirects to `/login`; register → auto-login → lands on `/`. (Requires live DB; if unavailable, verify pages render and redirects fire, defer registration to Task 16.)

- [ ] **Step 7: Commit**

```bash
git add src && git commit -m "feat: login/register pages, nav shell, auth middleware"
```

---

### Task 12: Dashboard (plan list + create form)

**Files:**
- Modify: `src/app/page.tsx` (replace scaffold home)
- Create: `src/components/NewPlanForm.tsx`

- [ ] **Step 1: Write `src/components/NewPlanForm.tsx`** (client)

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPlanForm() {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startDate,
        endDate: endDate || startDate,
        budgetLimit: budgetLimit ? Number(budgetLimit) : null,
      }),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Failed to create plan"); return; }
    const plan = await res.json();
    router.push(`/plans/${plan.id}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 p-4 border rounded-xl bg-white sm:grid-cols-2">
      <input className="border rounded p-2 sm:col-span-2" placeholder="Plan title (e.g. Anniversary Weekend)" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label className="text-sm">Start date
        <input className="border rounded p-2 w-full" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
      </label>
      <label className="text-sm">End date (optional)
        <input className="border rounded p-2 w-full" type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>
      <label className="text-sm sm:col-span-2">Budget limit (optional)
        <input className="border rounded p-2 w-full" type="number" min="0" step="0.01" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} />
      </label>
      {error && <p className="text-red-600 text-sm sm:col-span-2">{error}</p>}
      <button className="bg-rose-600 text-white rounded p-2 sm:col-span-2">Create plan</button>
    </form>
  );
}
```

- [ ] **Step 2: Write `src/app/page.tsx`** (server component)

```tsx
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planTotals } from "@/lib/budget";
import NewPlanForm from "@/components/NewPlanForm";

export default async function Dashboard() {
  const session = await auth();
  const plans = await prisma.plan.findMany({
    where: {
      OR: [
        { ownerId: session!.user.id },
        { collaborators: { some: { userId: session!.user.id } } },
      ],
    },
    orderBy: { startDate: "desc" },
    include: { days: { include: { stops: true } } },
  });
  return (
    <div className="max-w-2xl mx-auto p-4 grid gap-6">
      <h1 className="text-2xl font-bold">Your date plans</h1>
      <NewPlanForm />
      <ul className="grid gap-3">
        {plans.map((p) => {
          const t = planTotals(p.days.flatMap((d) => d.stops), p.budgetLimit);
          return (
            <li key={p.id}>
              <Link href={`/plans/${p.id}`} className="block p-4 border rounded-xl bg-white hover:border-rose-400">
                <div className="flex justify-between">
                  <span className="font-semibold">{p.title}</span>
                  <span className={t.overBudget ? "text-red-600 font-semibold" : "text-gray-600"}>
                    ${t.totalEstimated.toFixed(2)}{p.budgetLimit != null && ` / $${p.budgetLimit.toFixed(2)}`}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {p.startDate.toDateString()}
                  {p.endDate.getTime() !== p.startDate.getTime() && ` – ${p.endDate.toDateString()}`}
                  {" · "}
                  {p.days.reduce((n, d) => n + d.stops.length, 0)} stops
                </p>
              </Link>
            </li>
          );
        })}
        {plans.length === 0 && <p className="text-gray-500">No plans yet — create your first date above.</p>}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — dev server: create a plan (requires DB; if not yet provisioned, verify form renders and defer the end-to-end check to Task 16).

- [ ] **Step 4: Commit**

```bash
git add src && git commit -m "feat: dashboard with plan list and create form"
```

---

### Task 13: Plan view/editor — map-first layout

**Files:**
- Create: `src/components/PlanMap.tsx` (Leaflet, client-only)
- Create: `src/components/StopCard.tsx`, `src/components/AddStopPanel.tsx`, `src/components/BudgetBar.tsx`, `src/components/WeatherStrip.tsx`
- Create: `src/components/PlanView.tsx` (client orchestrator)
- Create: `src/app/plans/[planId]/page.tsx`

- [ ] **Step 1: Write `src/components/PlanMap.tsx`** — numbered pins + polyline route for the selected day. Leaflet CSS imported here; component must be loaded with `next/dynamic` `ssr: false`.

```tsx
"use client";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapStop { id: string; name: string; lat: number; lng: number; order: number }

const numberIcon = (n: number) =>
  L.divIcon({
    className: "",
    html: `<div style="background:#e11d48;color:#fff;border-radius:9999px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export default function PlanMap({ stops }: { stops: MapStop[] }) {
  const located = stops.filter((s) => s.lat != null && s.lng != null);
  const center: [number, number] = located.length
    ? [
        located.reduce((a, s) => a + s.lat, 0) / located.length,
        located.reduce((a, s) => a + s.lng, 0) / located.length,
      ]
    : [14.5995, 120.9842]; // Manila default
  return (
    <MapContainer center={center} zoom={located.length ? 13 : 11} className="h-64 sm:h-80 w-full rounded-xl z-0">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
      {located.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]} icon={numberIcon(s.order + 1)}>
          <Popup>{s.name}</Popup>
        </Marker>
      ))}
      {located.length > 1 && (
        <Polyline positions={located.map((s) => [s.lat, s.lng] as [number, number])} color="#e11d48" dashArray="6 8" />
      )}
    </MapContainer>
  );
}
```

- [ ] **Step 2: Write `src/components/BudgetBar.tsx`**

```tsx
"use client";
export default function BudgetBar({
  totalEstimated, totalActual, hasActuals, budgetLimit, variance,
}: {
  totalEstimated: number; totalActual: number; hasActuals: boolean;
  budgetLimit: number | null; variance: number;
}) {
  const over = budgetLimit != null && totalEstimated > budgetLimit;
  const pct = budgetLimit ? Math.min(100, (totalEstimated / budgetLimit) * 100) : 0;
  return (
    <div className="p-3 border rounded-xl bg-white grid gap-1">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">Estimated total: ${totalEstimated.toFixed(2)}</span>
        {budgetLimit != null && (
          <span className={over ? "text-red-600 font-bold" : "text-gray-600"}>Limit: ${budgetLimit.toFixed(2)}</span>
        )}
      </div>
      {budgetLimit != null && (
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${over ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {over && (
        <p className="text-red-600 text-sm font-semibold">
          ⚠ Over budget by ${(totalEstimated - (budgetLimit ?? 0)).toFixed(2)}
        </p>
      )}
      {hasActuals && (
        <p className="text-sm text-gray-600">
          Actual spent: ${totalActual.toFixed(2)} ({variance >= 0 ? "+" : "−"}${Math.abs(variance).toFixed(2)} vs estimate)
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/WeatherStrip.tsx`** — fetches `/api/weather` for the plan's date range using the first located stop's lat/lng; renders per-day max/min/precip; shows "forecast closer to the date" when `days: null`; renders nothing if no stop has coordinates.

```tsx
"use client";
import { useEffect, useState } from "react";

const WMO: Record<number, string> = {
  0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 51: "🌦️",
  61: "🌧️", 63: "🌧️", 65: "🌧️", 80: "🌧️", 95: "⛈️",
};

export default function WeatherStrip({ lat, lng, start, end }: {
  lat: number | null; lng: number | null; start: string; end: string;
}) {
  const [days, setDays] = useState<
    null | { date: string; tempMax: number; tempMin: number; precipChance: number; code: number }[]
  >(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (lat == null || lng == null) { setLoaded(true); return; }
    fetch(`/api/weather?lat=${lat}&lng=${lng}&start=${start}&end=${end}`)
      .then((r) => r.json())
      .then((d) => setDays(d.days))
      .catch(() => setDays(null))
      .finally(() => setLoaded(true));
  }, [lat, lng, start, end]);
  if (!loaded || lat == null || lng == null) return null;
  if (!days) return <p className="text-sm text-gray-500">🌤 Weather forecast will be available closer to the date.</p>;
  return (
    <div className="flex gap-2 overflow-x-auto">
      {days.map((d) => (
        <div key={d.date} className="p-2 border rounded-lg bg-white text-center text-xs min-w-20">
          <div>{new Date(d.date + "T00:00").toLocaleDateString(undefined, { weekday: "short" })}</div>
          <div className="text-lg">{WMO[d.code] ?? "🌡️"}</div>
          <div>{Math.round(d.tempMax)}° / {Math.round(d.tempMin)}°</div>
          <div className="text-sky-600">{d.precipChance}% 🌧</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/StopCard.tsx`**

```tsx
"use client";
import { useState } from "react";

const ICONS: Record<string, string> = {
  restaurant: "🍽️", park: "🌳", scenic: "🏞️", entertainment: "🎬",
  activity: "🎯", shopping: "🛍️", other: "📍",
};

export interface StopData {
  id: string; name: string; address: string; category: string;
  startTime: string | null; endTime: string | null;
  estimatedCost: number; actualCost: number | null; notes: string;
}

export default function StopCard({ stop, planId, order, editable, onChanged }: {
  stop: StopData; planId: string; order: number; editable: boolean; onChanged: () => void;
}) {
  const [actual, setActual] = useState(stop.actualCost?.toString() ?? "");
  const [busy, setBusy] = useState(false);

  async function patch(body: object) {
    setBusy(true);
    await fetch(`/api/plans/${planId}/stops/${stop.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    onChanged();
  }
  async function remove() {
    setBusy(true);
    await fetch(`/api/plans/${planId}/stops/${stop.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="p-3 border rounded-xl bg-white flex gap-3">
      <div className="bg-rose-600 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold shrink-0">
        {order + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <span className="font-semibold truncate">{ICONS[stop.category] ?? "📍"} {stop.name}</span>
          <span className="text-gray-600 text-sm shrink-0">${stop.estimatedCost.toFixed(2)}</span>
        </div>
        {stop.address && <p className="text-xs text-gray-500 truncate">{stop.address}</p>}
        <p className="text-xs text-gray-500">{stop.startTime ?? "—"}{stop.endTime && ` – ${stop.endTime}`}</p>
        {stop.notes && <p className="text-xs italic text-gray-500">{stop.notes}</p>}
        {editable && (
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <label>
              Actual $
              <input
                className="border rounded p-1 w-20 ml-1" type="number" min="0" step="0.01" value={actual}
                onChange={(e) => setActual(e.target.value)}
                onBlur={() => patch({ actualCost: actual === "" ? null : Number(actual) })}
                disabled={busy}
              />
            </label>
            {stop.actualCost != null && <span className="text-emerald-700">logged ${stop.actualCost.toFixed(2)}</span>}
            <button onClick={remove} disabled={busy} className="text-red-600 underline ml-auto">Remove</button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/components/AddStopPanel.tsx`** — tabbed: "Search places" (calls `/api/places/search`; results show rating badge; picking one pre-fills the form) and "Manual". On `fallback: true`, auto-switch to Manual with a notice.

```tsx
"use client";
import { useState } from "react";

const CATEGORIES = [
  ["restaurant", "🍽️ Restaurant"], ["park", "🌳 Park"], ["scenic", "🏞️ Scenic view"],
  ["entertainment", "🎬 Entertainment"], ["activity", "🎯 Activity"],
  ["shopping", "🛍️ Shopping"], ["other", "📍 Other"],
] as const;

interface SearchResult {
  name: string; address: string; lat: number | null; lng: number | null;
  rating: number | null; userRatingCount: number | null; estimatedCost: number;
}

const EMPTY_FORM = {
  name: "", address: "", lat: null as number | null, lng: null as number | null,
  category: "other", startTime: "", endTime: "", estimatedCost: "", notes: "", source: "manual",
};

export default function AddStopPanel({ planId, dayId, onChanged }: {
  planId: string; dayId: string; onChanged: () => void;
}) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/places/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    const d = await res.json();
    if (d.fallback) {
      setTab("manual");
      setNotice("Place search unavailable — add the stop manually.");
      return;
    }
    setResults(d.results);
    setNotice(d.results.length ? "" : "No results — try a different search or add manually.");
  }

  function pick(r: SearchResult) {
    setForm({
      ...form, name: r.name, address: r.address, lat: r.lat, lng: r.lng,
      estimatedCost: String(r.estimatedCost || ""), source: "places_api",
    });
    setTab("manual");
    setNotice("Details pre-filled — set time and cost, then add.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/plans/${planId}/days/${dayId}/stops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        estimatedCost: Number(form.estimatedCost) || 0,
        startTime: form.startTime || null,
        endTime: form.endTime || null,
      }),
    });
    if (res.ok) {
      setForm(EMPTY_FORM);
      setResults([]); setQ(""); setNotice("");
      onChanged();
    }
  }

  return (
    <div className="p-3 border rounded-xl bg-white grid gap-3">
      <div className="flex gap-2 text-sm">
        <button onClick={() => setTab("search")} className={`px-3 py-1 rounded-full ${tab === "search" ? "bg-rose-600 text-white" : "bg-gray-100"}`}>🔍 Search places</button>
        <button onClick={() => setTab("manual")} className={`px-3 py-1 rounded-full ${tab === "manual" ? "bg-rose-600 text-white" : "bg-gray-100"}`}>✏️ Manual</button>
      </div>
      {notice && <p className="text-sm text-amber-700">{notice}</p>}
      {tab === "search" && (
        <>
          <form onSubmit={search} className="flex gap-2">
            <input className="border rounded p-2 flex-1" placeholder="e.g. romantic restaurant in Makati, park near BGC" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="bg-rose-600 text-white rounded px-4">Search</button>
          </form>
          <ul className="grid gap-2">
            {results.map((r, i) => (
              <li key={i}>
                <button onClick={() => pick(r)} className="w-full text-left p-2 border rounded-lg hover:border-rose-400">
                  <div className="flex justify-between">
                    <span className="font-medium">{r.name}</span>
                    {r.rating != null && <span className="text-sm text-amber-600">★ {r.rating} ({r.userRatingCount})</span>}
                  </div>
                  <p className="text-xs text-gray-500">{r.address}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {tab === "manual" && (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
          <input className="border rounded p-2 sm:col-span-2" placeholder="Stop name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="border rounded p-2 sm:col-span-2" placeholder="Address (optional)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <select className="border rounded p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input className="border rounded p-2" type="number" min="0" step="0.01" placeholder="Estimated cost" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} />
          <label className="text-xs">Start
            <input className="border rounded p-2 w-full" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          </label>
          <label className="text-xs">End
            <input className="border rounded p-2 w-full" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </label>
          <input className="border rounded p-2 sm:col-span-2" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <button className="bg-rose-600 text-white rounded p-2 sm:col-span-2">Add stop</button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Write `src/components/PlanView.tsx`** — client orchestrator: day tabs (multi-day), dynamic `PlanMap` (ssr:false), `WeatherStrip`, `BudgetBar`, sorted `StopCard` list (by startTime then stopOrder), `AddStopPanel` when editable, share/invite/export controls when owner. Uses `router.refresh()` as `onChanged`.

```tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import StopCard, { StopData } from "@/components/StopCard";
import AddStopPanel from "@/components/AddStopPanel";
import BudgetBar from "@/components/BudgetBar";
import WeatherStrip from "@/components/WeatherStrip";

const PlanMap = dynamic(() => import("@/components/PlanMap"), { ssr: false });

interface Day {
  id: string; date: string; dayOrder: number;
  stops: (StopData & { lat: number | null; lng: number | null; stopOrder: number })[];
}
interface Totals {
  totalEstimated: number; totalActual: number; hasActuals: boolean;
  overBudget: boolean; variance: number;
}

export default function PlanView({ plan, editable, isOwner }: {
  plan: {
    id: string; title: string; startDate: string; endDate: string;
    budgetLimit: number | null; shareToken?: string; days: Day[]; totals: Totals;
  };
  editable: boolean; isOwner: boolean;
}) {
  const [dayIdx, setDayIdx] = useState(0);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");
  const router = useRouter();
  const day = plan.days[dayIdx];
  const sorted = [...day.stops].sort(
    (a, b) => (a.startTime ?? "99").localeCompare(b.startTime ?? "99") || a.stopOrder - b.stopOrder
  );
  const firstLocated = plan.days.flatMap((d) => d.stops).find((s) => s.lat != null);
  const fmt = (iso: string) => iso.slice(0, 10);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/plans/${plan.id}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const d = await res.json();
    setInviteMsg(res.ok ? `Invited ${d.invited} as editor ✓` : d.error);
    if (res.ok) setInviteEmail("");
  }

  return (
    <div className="max-w-2xl mx-auto p-4 grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <div className="flex gap-2 text-sm print:hidden">
          <Link href={`/plans/${plan.id}/print`} className="border rounded px-3 py-1">🖨 Export</Link>
          {isOwner && plan.shareToken && (
            <button
              className="border rounded px-3 py-1"
              onClick={() => {
                navigator.clipboard.writeText(`${location.origin}/shared/${plan.shareToken}`);
                setInviteMsg("Share link copied ✓");
              }}
            >
              🔗 Share (view-only)
            </button>
          )}
        </div>
      </div>
      {isOwner && (
        <form onSubmit={invite} className="flex gap-2 text-sm print:hidden">
          <input className="border rounded p-1.5 flex-1" type="email" placeholder="Invite partner by email (can edit)" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
          <button className="border rounded px-3">Invite</button>
        </form>
      )}
      {inviteMsg && <p className="text-sm text-emerald-700">{inviteMsg}</p>}
      <WeatherStrip
        lat={firstLocated?.lat ?? null}
        lng={firstLocated?.lng ?? null}
        start={fmt(plan.startDate)}
        end={fmt(plan.endDate)}
      />
      {plan.days.length > 1 && (
        <div className="flex gap-2 overflow-x-auto print:hidden">
          {plan.days.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setDayIdx(i)}
              className={`px-3 py-1 rounded-full text-sm shrink-0 ${i === dayIdx ? "bg-rose-600 text-white" : "bg-gray-100"}`}
            >
              Day {i + 1} · {new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </button>
          ))}
        </div>
      )}
      <PlanMap
        stops={sorted
          .filter((s) => s.lat != null && s.lng != null)
          .map((s, i) => ({ id: s.id, name: s.name, lat: s.lat!, lng: s.lng!, order: i }))}
      />
      <BudgetBar
        totalEstimated={plan.totals.totalEstimated}
        totalActual={plan.totals.totalActual}
        hasActuals={plan.totals.hasActuals}
        variance={plan.totals.variance}
        budgetLimit={plan.budgetLimit}
      />
      <div className="grid gap-2">
        {sorted.map((s, i) => (
          <StopCard key={s.id} stop={s} planId={plan.id} order={i} editable={editable} onChanged={() => router.refresh()} />
        ))}
        {sorted.length === 0 && <p className="text-gray-500 text-sm">No stops yet for this day.</p>}
      </div>
      {editable && <AddStopPanel planId={plan.id} dayId={day.id} onChanged={() => router.refresh()} />}
    </div>
  );
}
```

- [ ] **Step 7: Write `src/app/plans/[planId]/page.tsx`** (server component)

```tsx
import { notFound } from "next/navigation";
import { getPlanRole } from "@/lib/planAccess";
import { canEdit, canView } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { planTotals } from "@/lib/budget";
import PlanView from "@/components/PlanView";

export default async function PlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const { role } = await getPlanRole(planId);
  if (!canView(role)) notFound();
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      days: {
        orderBy: { dayOrder: "asc" },
        include: { stops: { orderBy: { stopOrder: "asc" } } },
      },
    },
  });
  if (!plan) notFound();
  const totals = planTotals(plan.days.flatMap((d) => d.stops), plan.budgetLimit);
  const serialized = JSON.parse(
    JSON.stringify({ ...plan, totals, shareToken: role === "owner" ? plan.shareToken : undefined })
  );
  return <PlanView plan={serialized} editable={canEdit(role)} isOwner={role === "owner"} />;
}
```

- [ ] **Step 8: Verify** — dev server: open a plan, add stops manually with coordinates, see numbered pins + dashed route + budget bar; over-budget warning turns red when estimates exceed the limit.

- [ ] **Step 9: Commit**

```bash
git add src && git commit -m "feat: map-first plan view with stops, budget bar, weather, invite and share controls"
```

---

### Task 14: Read-only shared view

**Files:**
- Create: `src/app/shared/[token]/page.tsx`

- [ ] **Step 1: Write page** — looks up plan by `shareToken`, renders `PlanView` with `editable={false} isOwner={false}` and strips the token from the payload (the URL itself is the credential). 404 on unknown token.

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { planTotals } from "@/lib/budget";
import PlanView from "@/components/PlanView";

export default async function SharedPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const plan = await prisma.plan.findUnique({
    where: { shareToken: token },
    include: {
      days: {
        orderBy: { dayOrder: "asc" },
        include: { stops: { orderBy: { stopOrder: "asc" } } },
      },
    },
  });
  if (!plan) notFound();
  const totals = planTotals(plan.days.flatMap((d) => d.stops), plan.budgetLimit);
  const serialized = JSON.parse(JSON.stringify({ ...plan, totals, shareToken: undefined }));
  return <PlanView plan={serialized} editable={false} isOwner={false} />;
}
```

- [ ] **Step 2: Verify** — copy share link from a plan, open in an incognito window (not signed in): plan renders read-only with no edit controls; a garbage token 404s.

- [ ] **Step 3: Commit**

```bash
git add src/app/shared && git commit -m "feat: read-only shared plan view via share token"
```

---

### Task 15: Print/export view

**Files:**
- Create: `src/app/plans/[planId]/print/page.tsx`
- Create: `src/components/PrintButton.tsx`

- [ ] **Step 1: Write `src/components/PrintButton.tsx`**

```tsx
"use client";
export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="print:hidden mb-4 border rounded px-3 py-1 text-sm">
      🖨 Print / Save as PDF
    </button>
  );
}
```

- [ ] **Step 2: Write `src/app/plans/[planId]/print/page.tsx`** — server component, role-checked like the plan page; clean typographic itinerary (no map, no controls).

```tsx
import { notFound } from "next/navigation";
import { getPlanRole } from "@/lib/planAccess";
import { canView } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { planTotals } from "@/lib/budget";
import PrintButton from "@/components/PrintButton";

export default async function PrintPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params;
  const { role } = await getPlanRole(planId);
  if (!canView(role)) notFound();
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      days: {
        orderBy: { dayOrder: "asc" },
        include: { stops: { orderBy: [{ startTime: "asc" }, { stopOrder: "asc" }] } },
      },
    },
  });
  if (!plan) notFound();
  const totals = planTotals(plan.days.flatMap((d) => d.stops), plan.budgetLimit);
  return (
    <div className="max-w-xl mx-auto p-6 bg-white">
      <PrintButton />
      <h1 className="text-2xl font-bold">{plan.title}</h1>
      <p className="text-gray-600">
        {plan.startDate.toDateString()}
        {plan.endDate.getTime() !== plan.startDate.getTime() && ` – ${plan.endDate.toDateString()}`}
      </p>
      {plan.days.map((d, i) => (
        <section key={d.id} className="mt-5">
          {plan.days.length > 1 && (
            <h2 className="font-semibold border-b pb-1">Day {i + 1} — {d.date.toDateString()}</h2>
          )}
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-1">Time</th><th>Stop</th>
                <th className="text-right">Est.</th><th className="text-right">Actual</th>
              </tr>
            </thead>
            <tbody>
              {d.stops.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-1.5 whitespace-nowrap">{s.startTime ?? "—"}</td>
                  <td>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">{s.address}</div>
                  </td>
                  <td className="text-right">${s.estimatedCost.toFixed(2)}</td>
                  <td className="text-right">{s.actualCost != null ? `$${s.actualCost.toFixed(2)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <div className="mt-6 border-t pt-3 text-sm">
        <p className="font-semibold">
          Estimated total: ${totals.totalEstimated.toFixed(2)}
          {plan.budgetLimit != null && ` (limit $${plan.budgetLimit.toFixed(2)})`}
        </p>
        {totals.hasActuals && <p>Actual spent: ${totals.totalActual.toFixed(2)}</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify** — open `/plans/{id}/print`, click button, confirm browser print preview shows a clean itinerary (nav hidden via `print:hidden` in AppNav).

- [ ] **Step 4: Commit**

```bash
git add src && git commit -m "feat: print-friendly export view (browser print to PDF)"
```

---

### Task 16: End-to-end verification pass

**Files:** none new (fixes as needed)

- [ ] **Step 1: Prerequisite** — a reachable Postgres `DATABASE_URL` (Neon). Run `npx prisma migrate dev --name init` if not yet applied.

- [ ] **Step 2: Full flow check with dev server + browser:**
  1. Register user A → auto-login → dashboard.
  2. Create plan "Anniversary Weekend", 2-day range, budget 100.
  3. Add 2 manual stops with lat/lng (e.g. Rizal Park 14.5826, 120.9787; Manila Ocean Park 14.5794, 120.9726), est costs 60 + 55 → budget bar red, "Over budget by $15.00".
  4. Map shows 2 numbered pins + dashed route.
  5. Log actual cost 50 on stop 1 → "Actual spent: $50.00 (−$10.00 vs estimate)".
  6. Copy share link → open incognito → read-only, no edit controls, no invite form.
  7. Register user B in incognito; as A, invite B's email; as B, plan appears on dashboard and is editable.
  8. `/plans/{id}/print` renders and print preview is clean.
  9. Places search: with placeholder key, search auto-falls back to manual with notice (expected until a real key is provided).

- [ ] **Step 3: Run all checks**

```bash
npm test && npm run lint && npx tsc --noEmit
```
Expected: all pass.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A && git commit -m "fix: issues found in end-to-end verification"
```

---

## Deferred (explicitly out of scope for this plan)
- AI-curated suggestions (Claude API — no key yet; Places-API rating sort covers MVP suggestions)
- Reminders/notifications
- Native mobile app
- Server-rendered PDF via @react-pdf/renderer (print view covers export; revisit if users need headless PDF generation)
