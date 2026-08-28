import { useMemo, useState } from "react";
import { useStore } from "../store";
import { ROLE_META, perms, type User } from "../types";
import { Icon } from "../components/icons";
import { Scramble, Overline, RoleBadge } from "../components/ui";

const CHAIN = ["Équipement", "Identité", "Emplacement", "Responsable", "Mouvement", "Historique"];

function ColdWaves() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden opacity-25">
      <svg className="anim-wave absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M0 60 Q 75 30 150 60 T 300 60 T 450 60 T 600 60 T 750 60 T 900 60 T 1050 60 T 1200 60 V100 H0 Z" fill="#7fd8e4" opacity="0.5" />
        <path d="M0 72 Q 75 46 150 72 T 300 72 T 450 72 T 600 72 T 750 72 T 900 72 T 1050 72 T 1200 72 V100 H0 Z" fill="#0e7c8a" opacity="0.55" />
      </svg>
    </div>
  );
}

export default function Login() {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState<User | null>(null);
  const [pwd, setPwd] = useState("kelvia-2026");
  const [touched, setTouched] = useState(false);

  const ticker = useMemo(() => state.audit.slice(0, 9), [state.audit]);
  const valid = selected !== null && pwd.trim().length > 0;

  const submit = () => {
    setTouched(true);
    if (!selected || !valid) return;
    dispatch({ type: "LOGIN", userId: selected.id });
  };

  return (
    <div className="grain flex min-h-screen">
      {/* ——— Panneau identité ——— */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-ink p-10 text-paper lg:flex xl:p-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(700px 420px at 20% -10%, rgba(127,216,228,0.14), transparent 60%), radial-gradient(560px 380px at 110% 80%, rgba(14,124,138,0.28), transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-frost/15 text-frost ring-1 ring-frost/40">
              <Icon name="snow" className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div>
              <div className="font-display text-xl font-bold tracking-tight text-white">ClimaTrace</div>
              <Overline className="text-frost/70">Régie du parc froid · Groupe Kelvia</Overline>
            </div>
          </div>

          <h1 className="mt-14 max-w-md font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight text-white xl:text-5xl">
            Chaque climatiseur.
            <br />
            Chaque mouvement.
            <br />
            <span className="text-frost">
              <Scramble text="Tracé." delay={500} />
            </span>
          </h1>

          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-paper/70">
            Inventaire, emplacement officiel, transferts validés et journal d'audit inaltérable.
            Un équipement ne change de place que si la chaîne le dit.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-y-2">
            {CHAIN.map((c, i) => (
              <span key={c} className="flex items-center">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-frost/80">{c}</span>
                {i < CHAIN.length - 1 && <span className="flow-line mx-2 w-6 text-frost/50" />}
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <Overline className="mb-2 text-frost/70">Journal en direct</Overline>
          <div className="h-36 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
            <div className="anim-ticker">
              {[...ticker, ...ticker].map((a, i) => (
                <div key={i} className="flex items-baseline gap-3 border-b border-white/5 px-4 py-2">
                  <span className="shrink-0 font-mono text-[10px] text-frost/70">
                    {new Date(a.at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                  </span>
                  <span className="shrink-0 rounded bg-frost/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-frost">
                    {a.action}
                  </span>
                  <span className="truncate text-xs text-paper/75">{a.detail}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 flex gap-8 font-mono text-xs text-paper/60">
            <span><b className="text-frost">{state.equipment.length}</b> équipements</span>
            <span><b className="text-frost">{state.sites.length}</b> sites</span>
            <span><b className="text-frost">{state.audit.length}</b> écritures d'audit</span>
          </div>
        </div>
        <ColdWaves />
      </div>

      {/* ——— Panneau accès ——— */}
      <div className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="anim-fade-up w-full max-w-lg">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-frost">
              <Icon name="snow" className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-lg font-bold text-ink">ClimaTrace</div>
              <Overline>Régie du parc froid · Groupe Kelvia</Overline>
            </div>
          </div>

          <Overline className="text-teal">Point de contrôle d'accès</Overline>
          <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Badge de session</h2>
          <p className="mt-2 text-sm text-mute">
            Sélectionnez un profil de démonstration. Les droits appliqués sont ceux du rôle réel —
            un auditeur ne peut rien modifier, un responsable de site confirme les réceptions.
          </p>

          <div className="mt-6 space-y-2.5">
            {state.users.map((u) => {
              const on = selected?.id === u.id;
              const site = state.sites.find((s) => s.id === u.siteId);
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={`ticket-notch btn-press relative flex w-full items-center gap-4 rounded-lg border px-4 py-3 text-left transition-colors ${
                    on ? "border-tealdeep bg-icefrost shadow-md" : "border-line bg-card hover:border-linedark"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold ${
                      on ? "bg-tealdeep text-white" : "bg-paper text-tealdeep"
                    }`}
                  >
                    {u.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-ink">{u.name}</span>
                      <RoleBadge r={u.role} />
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-mute">
                      {site ? `Rattaché · ${site.name}` : "Périmètre national"} · {u.email}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      on ? "border-tealdeep bg-tealdeep text-white" : "border-linedark bg-white text-transparent"
                    }`}
                  >
                    <Icon name="check" className="h-3 w-3" strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          </div>

          {selected && (
            <p className="anim-fade-up mt-3 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-mute">
              <span className="font-semibold text-tealdeep">{ROLE_META[selected.role].label} — </span>
              {ROLE_META[selected.role].desc}
              {perms(selected.role).readOnly && <span className="ml-1 font-semibold text-plum">Lecture seule sur l'ensemble du système.</span>}
            </p>
          )}

          <div className="mt-5">
            <label className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-mute">Mot de passe de session</label>
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="mt-1.5 w-full rounded-lg border border-linedark bg-white px-3 py-2.5 font-mono text-sm text-body focus:border-teal"
              placeholder="••••••••••••"
            />
            <p className="mt-1.5 text-[11px] text-faint">Environnement de démonstration — n'importe quel mot de passe est accepté.</p>
          </div>

          <button
            onClick={submit}
            disabled={!valid}
            className="btn-press mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3.5 font-display text-sm font-bold uppercase tracking-[0.14em] text-frost hover:bg-pine disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="scan" className="h-4.5 w-4.5" />
            Ouvrir la session
          </button>
          {touched && !selected && (
            <p className="mt-2 text-center text-xs font-medium text-danger">Sélectionnez d'abord un profil de badge.</p>
          )}
        </div>
      </div>
    </div>
  );
}
