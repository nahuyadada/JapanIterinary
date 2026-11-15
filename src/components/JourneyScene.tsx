"use client";
import { useEffect, useState } from "react";
import { formatClock } from "@/lib/schedule";
import type { HopSegment } from "@/lib/simulation";

/** How long one journey takes to play, start to arrival. */
export const SCENE_MS = 5200;

const WIDTH = 600;
const GROUND = 112;
const EDGE = 64;
/** A two-minute walk next to a forty-minute ride would flash by, so every part gets a floor. */
const MIN_SHARE = 0.22;

function short(name: string): string {
  return name.length > 20 ? `${name.slice(0, 19)}…` : name;
}

function Building({ x, tall }: { x: number; tall?: boolean }) {
  const h = tall ? 62 : 46;
  const w = 44;
  const windows = [];
  for (let row = 0; row < (tall ? 4 : 3); row++) {
    for (let col = 0; col < 3; col++) {
      windows.push(
        <rect key={`${row}-${col}`} x={x - w / 2 + 6 + col * 12} y={GROUND - h + 7 + row * 13} width={7} height={7} rx={1} fill="#fff" />
      );
    }
  }
  return (
    <g>
      <rect x={x - w / 2} y={GROUND - h} width={w} height={h} rx={3} fill="#9ca3af" />
      {windows}
      <rect x={x - 5} y={GROUND - 12} width={10} height={12} fill="#4b5563" />
    </g>
  );
}

function StationHouse({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 30} y={GROUND - 30} width={60} height={30} rx={2} fill="#e5e7eb" stroke="#9ca3af" />
      <path d={`M${x - 38} ${GROUND - 30} L${x} ${GROUND - 46} L${x + 38} ${GROUND - 30} Z`} fill="#ef4444" />
      <rect x={x - 6} y={GROUND - 16} width={12} height={16} fill="#6b7280" />
      <circle cx={x} cy={GROUND - 36} r={4} fill="#fff" />
    </g>
  );
}

function Walker({ x, step }: { x: number; step: number }) {
  const swing = Math.sin(step) * 5;
  const y = GROUND - 2 - Math.abs(Math.sin(step)) * 2;
  return (
    <g stroke="#111827" strokeWidth={2.5} strokeLinecap="round" fill="none">
      <circle cx={x} cy={y - 24} r={4.5} fill="#111827" stroke="none" />
      <path d={`M${x} ${y - 19} L${x} ${y - 9}`} />
      <path d={`M${x} ${y - 9} L${x - swing} ${y}`} />
      <path d={`M${x} ${y - 9} L${x + swing} ${y}`} />
      <path d={`M${x} ${y - 16} L${x + swing * 0.8} ${y - 11}`} />
      <path d={`M${x} ${y - 16} L${x - swing * 0.8} ${y - 11}`} />
    </g>
  );
}

function Train({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 34} y={GROUND - 24} width={68} height={20} rx={6} fill="#ef4444" />
      {[-24, -8, 8].map((dx) => (
        <rect key={dx} x={x + dx} y={GROUND - 20} width={12} height={8} rx={1.5} fill="#fff" />
      ))}
      <circle cx={x - 20} cy={GROUND - 3} r={3.5} fill="#374151" />
      <circle cx={x + 20} cy={GROUND - 3} r={3.5} fill="#374151" />
    </g>
  );
}

function Car({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 22} ${GROUND - 6} v-8 h8 l5 -7 h14 l6 7 h11 v8 Z`} fill="#ef4444" />
      <circle cx={x - 12} cy={GROUND - 4} r={4} fill="#374151" />
      <circle cx={x + 12} cy={GROUND - 4} r={4} fill="#374151" />
    </g>
  );
}

const ACTION: Record<HopSegment["kind"], (to: string) => string> = {
  walk: (to) => `Walking to ${to}`,
  train: (to) => `On the train to ${to}`,
  drive: (to) => `Driving to ${to}`,
};

/**
 * One journey acted out: leave the building, walk to the station, ride, walk to the door.
 * It is a picture of the plan, not a map; distances are not to scale.
 */
export default function JourneyScene({ parts }: { parts: HopSegment[] }) {
  const [progress, setProgress] = useState(0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const startedAt = performance.now();
    const tick = (now: number) => {
      const p = reduced ? 1 : Math.min(1, (now - startedAt) / SCENE_MS);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run]);

  if (parts.length === 0) return null;

  // Where each part starts and ends along the picture, and how much of the playtime it gets.
  const nodes = parts.map((_, i) => EDGE + ((WIDTH - 2 * EDGE) * i) / parts.length).concat(WIDTH - EDGE);
  const total = parts.reduce((sum, part) => sum + (part.end - part.start), 0) || 1;
  const raw = parts.map((part) => Math.max(MIN_SHARE, (part.end - part.start) / total));
  const rawSum = raw.reduce((a, b) => a + b, 0);
  const shares = raw.map((r) => r / rawSum);

  let current = parts.length - 1;
  let within = 1;
  let passed = 0;
  for (let i = 0; i < parts.length; i++) {
    if (progress < passed + shares[i] || i === parts.length - 1) {
      current = i;
      within = Math.min(1, (progress - passed) / shares[i]);
      break;
    }
    passed += shares[i];
  }

  const part = parts[current];
  const x = nodes[current] + (nodes[current + 1] - nodes[current]) * within;
  const clock = part.start + (part.end - part.start) * within;
  const arrived = progress >= 1;
  const last = parts[parts.length - 1];

  return (
    <div className="grid gap-1.5">
      <svg
        viewBox={`0 0 ${WIDTH} 150`}
        role="img"
        aria-label={parts.map((p) => ACTION[p.kind](p.to.name)).join(", then ")}
        className="w-full rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700"
      >
        <line x1={0} y1={GROUND} x2={WIDTH} y2={GROUND} stroke="#d1d5db" strokeWidth={2} />

        {parts.map((p, i) =>
          p.kind === "walk" ? (
            <line key={i} x1={nodes[i]} y1={GROUND + 8} x2={nodes[i + 1]} y2={GROUND + 8} stroke="#9ca3af" strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
          ) : (
            <g key={i}>
              <line x1={nodes[i]} y1={GROUND + 8} x2={nodes[i + 1]} y2={GROUND + 8} stroke="#6b7280" strokeWidth={3} />
              {p.kind === "train" &&
                Array.from({ length: Math.floor((nodes[i + 1] - nodes[i]) / 14) }, (_, k) => (
                  <line key={k} x1={nodes[i] + 7 + k * 14} y1={GROUND + 4} x2={nodes[i] + 7 + k * 14} y2={GROUND + 12} stroke="#6b7280" strokeWidth={2} />
                ))}
            </g>
          )
        )}

        {nodes.map((nx, i) => {
          const isEnd = i === 0 || i === nodes.length - 1;
          const name = i === 0 ? parts[0].from.name : parts[i - 1].to.name;
          return (
            <g key={i}>
              {isEnd ? <Building x={nx} tall={i !== 0} /> : <StationHouse x={nx} />}
              <text x={nx} y={140} textAnchor="middle" fontSize={11} fill="#4b5563" fontFamily="inherit">
                {short(name)}
              </text>
            </g>
          );
        })}

        {part.kind === "walk" && <Walker x={x} step={progress * 60} />}
        {part.kind === "train" && <Train x={x} />}
        {part.kind === "drive" && <Car x={x} />}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-gray-700 dark:text-gray-300" aria-live="off">
          <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">
            {formatClock(arrived ? last.end : clock)}
          </span>{" "}
          {arrived ? `Arrived at ${last.to.name}` : ACTION[part.kind](part.to.name)}
        </p>
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="text-xs text-gray-500 dark:text-gray-400 underline hover:no-underline"
        >
          Replay journey
        </button>
      </div>
    </div>
  );
}
