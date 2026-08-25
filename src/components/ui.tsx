import { useEffect, useRef, useState, type ReactNode } from "react";
import { STATUS_META, TRANSFER_META, ROLE_META, INV_META, type EquipStatus, type TransferStatus, type Role, type InvResult } from "../types";
import { Icon } from "./icons";

/* ---------------- hooks ---------------- */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

/* ---------------- micro-typographie ---------------- */

export function Overline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`font-mono text-[10.5px] font-medium uppercase tracking-[0.22em] text-faint ${className}`}>
      {children}
    </div>
  );
}

/* ---------------- badges ---------------- */

export const StatusBadge = ({ s, pulse = false }: { s: EquipStatus; pulse?: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_META[s].chip}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${pulse && (s === "transfert" ? "dot-pulse" : s === "a_verifier" || s === "perdu" ? "dot-pulse-red" : "")}`} style={{ backgroundColor: STATUS_META[s].dot }} />
    {STATUS_META[s].label}
  </span>
);

export const TransferBadge = ({ s }: { s: TransferStatus }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TRANSFER_META[s].chip}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${s === "transit" ? "dot-pulse" : ""}`} style={{ backgroundColor: TRANSFER_META[s].dot }} />
    {TRANSFER_META[s].label}
  </span>
);

export const RoleBadge = ({ r }: { r: Role }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_META[r].chip}`}>
    {ROLE_META[r].label}
  </span>
);

export const InvBadge = ({ r }: { r: InvResult }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${INV_META[r].chip}`}>
    {INV_META[r].label}
  </span>
);

/* ---------------- boutons / champs ---------------- */

export const btnPrimary =
  "btn-press inline-flex items-center gap-2 rounded-lg bg-tealdeep px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal disabled:opacity-40 disabled:cursor-not-allowed";
export const btnGhost =
  "btn-press inline-flex items-center gap-2 rounded-lg border border-linedark bg-white px-4 py-2.5 text-sm font-semibold text-body hover:border-teal hover:text-tealdeep disabled:opacity-40 disabled:cursor-not-allowed";
export const btnDanger =
  "btn-press inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b93a3a] disabled:opacity-40 disabled:cursor-not-allowed";
export const btnDark =
  "btn-press inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-frost hover:bg-pine disabled:opacity-40 disabled:cursor-not-allowed";
export const inputCls =
  "w-full rounded-lg border border-linedark bg-white px-3 py-2.5 text-sm text-body placeholder:text-faint focus:border-teal";
export const labelCls = "mb-1.5 block font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-mute";

/* ---------------- modale ---------------- */

export function Modal({ open, onClose, title, over, children, wide = false }: { open: boolean; onClose: () => void; title: string; over?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/65 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`anim-pop relative max-h-[88vh] w-full overflow-y-auto rounded-xl border border-line bg-card shadow-2xl ${wide ? "max-w-3xl" : "max-w-xl"}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-card/95 px-6 py-4 backdrop-blur">
          <div>
            {over && <Overline className="text-teal">{over}</Overline>}
            <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          </div>
          <button onClick={onClose} className="btn-press rounded-md p-1.5 text-mute hover:bg-paper hover:text-ink" aria-label="Fermer">
            <Icon name="x" className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- tiroir latéral ---------------- */

export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="anim-drawer absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-line bg-paper shadow-2xl">
        {children}
      </aside>
    </div>
  );
}

/* ---------------- compteurs & effets ---------------- */

export function CountUp({ value, duration = 950, className = "" }: { value: number; duration?: number; className?: string }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) { setN(value); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduced]);
  return <span className={className}>{n.toLocaleString("fr-FR")}</span>;
}

const GLYPHS = "▓▒░<>/#CLM-TRF0123456789";
export function Scramble({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  const [out, setOut] = useState(reduced ? text : "");
  useEffect(() => {
    if (reduced) { setOut(text); return; }
    let frame = 0;
    let iv: ReturnType<typeof setInterval>;
    const to = setTimeout(() => {
      iv = setInterval(() => {
        frame++;
        const fixed = Math.floor(frame / 2.2);
        const s = text
          .split("")
          .map((c, i) => (c === " " ? " " : i < fixed ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join("");
        setOut(s);
        if (fixed >= text.length) clearInterval(iv);
      }, 34);
    }, delay);
    return () => { clearTimeout(to); clearInterval(iv); };
  }, [text, delay, reduced]);
  return <span className={className}>{out || "\u00A0"}</span>;
}

export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- visualisations ---------------- */

export function SegBar({ items, className = "h-3" }: { items: { value: number; color: string; key: string }[]; className?: string }) {
  const total = Math.max(1, items.reduce((a, b) => a + b.value, 0));
  return (
    <div className={`flex w-full overflow-hidden rounded-full bg-line/70 ${className}`}>
      {items.filter((i) => i.value > 0).map((i) => (
        <div key={i.key} className="transition-all duration-700" style={{ width: `${(i.value / total) * 100}%`, backgroundColor: i.color }} title={`${i.key} : ${i.value}`} />
      ))}
    </div>
  );
}

export function BarRow({ label, value, max, color = "#0e7c8a", right }: { label: string; value: number; max: number; color?: string; right?: string }) {
  return (
    <div className="group">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-body">{label}</span>
        <span className="font-mono text-xs font-semibold text-mute">{right ?? value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line/70">
        <div
          className="h-full rounded-full transition-all duration-700 group-hover:brightness-110"
          style={{ width: `${Math.max(3, (value / Math.max(1, max)) * 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ---------------- stepper de workflow ---------------- */

export interface Step { label: string; state: "done" | "current" | "pending" | "rejected"; meta?: string }
export function Stepper({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-start">
      {steps.map((st, i) => (
        <div key={st.label} className={`flex items-start ${i < steps.length - 1 ? "flex-1" : ""}`}>
          <div className="flex w-16 flex-col items-center text-center sm:w-20">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                st.state === "done"
                  ? "border-tealdeep bg-tealdeep text-white"
                  : st.state === "current"
                    ? "dot-pulse border-teal bg-icefrost text-tealdeep"
                    : st.state === "rejected"
                      ? "border-danger bg-danger text-white"
                      : "border-linedark bg-white text-faint"
              }`}
            >
              {st.state === "done" ? <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> : st.state === "rejected" ? <Icon name="x" className="h-4 w-4" strokeWidth={2.4} /> : i + 1}
            </div>
            <div className={`mt-1.5 font-mono text-[9.5px] uppercase tracking-wider ${st.state === "pending" ? "text-faint" : st.state === "rejected" ? "text-danger" : "text-tealdeep"}`}>{st.label}</div>
            {st.meta && <div className="mt-0.5 text-[10px] leading-tight text-mute">{st.meta}</div>}
          </div>
          {i < steps.length - 1 && (
            <div className={`mx-1 mt-4 h-0.5 flex-1 rounded ${st.state === "done" ? "bg-tealdeep" : "bg-linedark"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------- QR déterministe ---------------- */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function PseudoQR({ seed, size = 132, className = "" }: { seed: string; size?: number; className?: string }) {
  const N = 21;
  const rnd = mulberry32(hashStr(seed));
  const cells: boolean[] = [];
  const inFinder = (r: number, c: number) =>
    (r < 8 && c < 8) || (r < 8 && c >= N - 8) || (r >= N - 8 && c < 8);
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++) {
      if (inFinder(r, c)) { cells.push(false); continue; }
      if (r === 8 || c === 8) { cells.push((r + c) % 2 === 0); continue; }
      cells.push(rnd() < 0.46);
    }
  const finder = (x: number, y: number, key: string) => (
    <g key={key}>
      <rect x={x} y={y} width={7} height={7} fill="none" stroke="#0a2a33" strokeWidth={1} />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0a2a33" />
    </g>
  );
  const cell = 100 / N;
  return (
    <svg viewBox="-1 -1 23 23" width={size} height={size} className={className} role="img" aria-label={`QR ${seed}`}>
      <rect x={-1} y={-1} width={23} height={23} fill="#ffffff" />
      {cells.map((on, i) =>
        on ? <rect key={i} x={(i % N) * cell} y={Math.floor(i / N) * cell} width={cell * 0.92} height={cell * 0.92} fill="#0a2a33" /> : null
      )}
      {finder(0, 0, "f1")}
      {finder(N - 7, 0, "f2")}
      {finder(0, N - 7, "f3")}
    </svg>
  );
}

/* ---------------- divers ---------------- */

export function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-linedark bg-white/60 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-icefrost text-tealdeep">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <div className="font-display text-base font-bold text-ink">{title}</div>
      <div className="max-w-sm text-sm text-mute">{sub}</div>
    </div>
  );
}
