import { useMemo } from "react";
import { useStore, computeAlerts, locLabel, fmtDate, daysUntil } from "../store";
import { STATUS_META, STATUS_ORDER, TRANSFER_META } from "../types";
import { Icon } from "../components/icons";
import { Overline, Scramble, Reveal, CountUp, SegBar, BarRow, TransferBadge, EmptyState } from "../components/ui";

const SEV_DOT: Record<string, string> = {
  red: "bg-danger dot-pulse-red",
  amber: "bg-amber dot-pulse-amber",
  cyan: "bg-teal dot-pulse",
};

export default function Dashboard({ onNav }: { onNav: (view: string, param?: string) => void }) {
  const { state, me } = useStore();
  const s = state;

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    s.equipment.forEach((e) => m.set(e.status, (m.get(e.status) ?? 0) + 1));
    return m;
  }, [s.equipment]);

  const bySite = useMemo(
    () =>
      s.sites.map((site) => ({
        site,
        count: s.equipment.filter((e) => s.locations.find((l) => l.id === e.locationId)?.siteId === site.id).length,
        rooms: s.locations.filter((l) => l.siteId === site.id).length,
      })),
    [s]
  );

  const alerts = useMemo(() => computeAlerts(s), [s]);
  const activeTransfers = s.transfers.filter((t) => ["demande", "valide", "transit"].includes(t.status));
  const openAnomalies = s.anomalies.filter((a) => a.status === "ouverte");
  const dueSoon = s.equipment.filter((e) => e.nextMaintenance && !["reforme", "perdu"].includes(e.status) && daysUntil(e.nextMaintenance) <= 15);

  const lastSession = useMemo(() => s.sessions.filter((x) => x.closedAt).sort((a, b) => (a.closedAt! < b.closedAt! ? 1 : -1))[0], [s.sessions]);
  const coverage = useMemo(() => {
    if (!lastSession) return null;
    const expected = s.equipment.filter((e) => s.locations.find((l) => l.id === e.locationId)?.siteId === lastSession.siteId).length;
    const checked = s.checks.filter((c) => c.sessionId === lastSession.id).length;
    return { checked, expected, code: lastSession.code, site: lastSession.siteId };
  }, [lastSession, s]);

  const chain = [
    { label: "Équipement", count: s.equipment.length, view: "equipments", icon: "ac" },
    { label: "Identité", count: s.equipment.filter((e) => e.serial).length, view: "equipments", icon: "tag" },
    { label: "Emplacement", count: s.locations.length, view: "sites", icon: "pin" },
    { label: "Responsable", count: new Set(s.equipment.map((e) => e.responsible)).size, view: "sites", icon: "user" },
    { label: "Mouvement", count: s.transfers.length, view: "transferts", icon: "swap" },
    { label: "Historique", count: s.audit.length, view: "audit", icon: "scroll" },
  ] as const;

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-7">
      {/* entête */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline className="text-teal">Groupe Kelvia · Parc froid national</Overline>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            <Scramble text="Tableau de bord" />
          </h1>
          <p className="mt-1.5 text-sm text-mute">
            Bonjour {me?.name.split(" ")[0]} — {today}. La chaîne de traçabilité est active.
          </p>
        </div>
        <button onClick={() => onNav("transferts", "new")} className="btn-press inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-frost hover:bg-pine">
          <Icon name="swap" className="h-4 w-4" />
          Demander un transfert
        </button>
      </div>

      {/* chaîne de traçabilité */}
      <Reveal>
        <div className="rounded-xl border border-line bg-ink px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-y-3">
            {chain.map((c, i) => (
              <span key={c.label} className="flex items-center">
                <button onClick={() => onNav(c.view)} className="btn-press group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-frost/10 text-frost ring-1 ring-frost/25">
                    <Icon name={c.icon} className="h-4 w-4" />
                  </span>
                  <span className="text-left">
                    <span className="block font-mono text-[9.5px] uppercase tracking-[0.18em] text-paper/50">{c.label}</span>
                    <span className="block font-display text-lg font-bold leading-none text-frost group-hover:text-white">{c.count}</span>
                  </span>
                </button>
                {i < chain.length - 1 && <span className="flow-line mx-2 w-7 text-frost/40 sm:w-10" />}
              </span>
            ))}
            <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.2em] text-paper/40 xl:block">
              chaîne vérifiée · 0 rupture
            </span>
          </div>
        </div>
      </Reveal>

      {/* KPIs */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="card-hover h-full rounded-xl border border-line bg-card p-6">
            <div className="flex items-start justify-between">
              <Overline>Parc total</Overline>
              <span className="flex items-center gap-1.5 rounded-full bg-icefrost px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-tealdeep">
                <span className="anim-breathe h-1.5 w-1.5 rounded-full bg-teal" /> temps réel
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <CountUp value={s.equipment.length} className="font-display text-6xl font-bold tracking-tight text-ink" />
              <span className="text-sm text-mute">climatiseurs<br />identifiés</span>
            </div>
            <div className="mt-5">
              <SegBar items={STATUS_ORDER.map((st) => ({ key: st, value: byStatus.get(st) ?? 0, color: STATUS_META[st].dot }))} className="h-3.5" />
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {STATUS_ORDER.filter((st) => (byStatus.get(st) ?? 0) > 0).map((st) => (
                  <div key={st} className="flex items-center justify-between gap-2 text-[12.5px]">
                    <span className="flex items-center gap-1.5 text-mute">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: STATUS_META[st].dot }} />
                      {STATUS_META[st].label}
                    </span>
                    <span className="font-mono font-semibold text-body">{byStatus.get(st)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 lg:col-span-7">
          {[
            { label: "Transferts en cours", value: activeTransfers.length, sub: activeTransfers.length ? `${activeTransfers.filter((t) => t.status === "demande").length} à valider` : "aucun mouvement bloqué", icon: "swap", tone: "text-tealdeep bg-icefrost", pulse: activeTransfers.length > 0, view: "transferts" },
            { label: "Anomalies ouvertes", value: openAnomalies.length, sub: openAnomalies.length ? "régularisation requise" : "parc conforme", icon: "alert", tone: openAnomalies.length ? "text-danger bg-[#fadfda]" : "text-leaf bg-[#e2f3ea]", pulse: openAnomalies.length > 0, view: "anomalies" },
            { label: "Maintenances ≤ 15 j", value: dueSoon.length, sub: `${dueSoon.filter((e) => daysUntil(e.nextMaintenance!) < 0).length} déjà en retard`, icon: "clock", tone: "text-[#8a5b06] bg-[#fbeed3]", pulse: false, view: "maintenance" },
            { label: "Dernier inventaire", value: coverage ? Math.round((coverage.checked / Math.max(1, coverage.expected)) * 100) : 0, suffix: "%", sub: coverage ? `${coverage.code} · ${coverage.checked}/${coverage.expected} contrôlés` : "aucune session close", icon: "clipboard", tone: "text-[#46636e] bg-[#e4ecf0]", pulse: false, view: "inventaire" },
          ].map((k, i) => (
            <Reveal key={k.label} delay={i * 70}>
              <button onClick={() => onNav(k.view)} className="card-hover flex h-full w-full flex-col justify-between rounded-xl border border-line bg-card p-5 text-left">
                <div className="flex items-center justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}>
                    <Icon name={k.icon} className={`h-4.5 w-4.5 ${k.pulse ? "dot-pulse rounded-full" : ""}`} />
                  </span>
                  <Icon name="chevR" className="h-4 w-4 text-faint" />
                </div>
                <div className="mt-4">
                  <div className="font-display text-4xl font-bold tracking-tight text-ink">
                    <CountUp value={k.value} />{k.suffix ?? ""}
                  </div>
                  <div className="mt-0.5 text-[13px] font-semibold text-body">{k.label}</div>
                  <div className="text-xs text-mute">{k.sub}</div>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* sites + alertes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <div className="card-hover h-full rounded-xl border border-line bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <Overline>Répartition géographique</Overline>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">Équipements par site</h2>
              </div>
              <button onClick={() => onNav("sites")} className="btn-press inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-tealdeep hover:bg-icefrost">
                Voir le référentiel <Icon name="chevR" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-4">
              {bySite.map((r) => (
                <BarRow
                  key={r.site.id}
                  label={`${r.site.city} — ${r.site.name}`}
                  value={r.count}
                  max={Math.max(...bySite.map((x) => x.count))}
                  right={`${r.count} · ${r.rooms} locaux`}
                  color={r.count === Math.max(...bySite.map((x) => x.count)) ? "#0a5c68" : "#1493a6"}
                />
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="card-hover h-full rounded-xl border border-line bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Overline>Centre d'alertes</Overline>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">À traiter</h2>
              </div>
              <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-xs font-semibold text-mute">{alerts.length}</span>
            </div>
            {alerts.length === 0 ? (
              <EmptyState icon="check" title="Aucune alerte" sub="Toutes les échéances et anomalies sont traitées." />
            ) : (
              <div className="space-y-1.5">
                {alerts.slice(0, 7).map((al) => (
                  <button
                    key={al.id}
                    onClick={() => onNav(al.view)}
                    className="btn-press flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left hover:border-line hover:bg-paper"
                  >
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${SEV_DOT[al.severity]}`} />
                    <span className="text-[12.5px] leading-snug text-body">{al.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* mouvements + maintenances */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <div className="card-hover h-full rounded-xl border border-line bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Overline>Derniers mouvements</Overline>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">Transferts récents</h2>
              </div>
              <button onClick={() => onNav("transferts")} className="btn-press inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-tealdeep hover:bg-icefrost">
                Tout voir <Icon name="chevR" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {[...s.transfers].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1)).slice(0, 4).map((t) => {
                const e = s.equipment.find((x) => x.id === t.equipmentId)!;
                return (
                  <button key={t.id} onClick={() => onNav("transferts", t.code)} className="btn-press block w-full rounded-lg border border-line bg-paper/60 px-3.5 py-3 text-left hover:border-teal/50 hover:bg-icefrost/50">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-tealdeep">{t.code}</span>
                      <TransferBadge s={t.status} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[13px] text-body">
                      <span className="font-mono font-semibold">{e.code}</span>
                      <span className="text-mute">·</span>
                      <span className="truncate">{locLabel(s, t.fromLocationId)}</span>
                      <Icon name="arrow" className="h-3.5 w-3.5 shrink-0 text-teal" />
                      <span className="truncate">{locLabel(s, t.toLocationId)}</span>
                    </div>
                    <div className="mt-1 text-[11.5px] text-mute">Demandeur : {t.requester} · {fmtDate(t.requestedAt)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={90}>
          <div className="card-hover h-full rounded-xl border border-line bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <Overline>Préventif</Overline>
                <h2 className="mt-1 font-display text-xl font-bold text-ink">Prochaines maintenances</h2>
              </div>
              <button onClick={() => onNav("maintenance")} className="btn-press inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-tealdeep hover:bg-icefrost">
                Interventions <Icon name="chevR" className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-2">
              {s.equipment
                .filter((e) => e.nextMaintenance && !["reforme", "perdu"].includes(e.status))
                .sort((a, b) => (a.nextMaintenance! < b.nextMaintenance! ? -1 : 1))
                .slice(0, 5)
                .map((e) => {
                  const d = daysUntil(e.nextMaintenance);
                  return (
                    <button key={e.id} onClick={() => onNav("maintenance")} className="btn-press flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-paper/60 px-3.5 py-2.5 text-left hover:border-teal/50 hover:bg-icefrost/50">
                      <span className="min-w-0">
                        <span className="block font-mono text-[12px] font-semibold text-body">{e.code}</span>
                        <span className="block truncate text-[12px] text-mute">{e.brand} {e.model} · {locLabel(s, e.locationId)}</span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10.5px] font-semibold ${
                          d < 0 ? "bg-[#fadfda] text-[#9e3327]" : d <= 15 ? "bg-[#fbeed3] text-[#8a5b06]" : "bg-[#e4ecf0] text-[#46636e]"
                        }`}
                      >
                        {d < 0 ? `Retard ${Math.abs(d)} j` : `J-${d}`}
                      </span>
                    </button>
                  );
                })}
            </div>
            <div className="mt-3 border-t border-dashed border-linedark pt-3 text-[11.5px] text-faint">
              Règle appliquée : toute intervention consigne automatiquement la prochaine échéance.
            </div>
          </div>
        </Reveal>
      </div>

      {/* rappel workflow */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-line bg-card px-5 py-4 text-[12.5px] text-mute">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-tealdeep">Workflow de transfert</span>
          {(["Demande", "Validation", "Préparation", "Transport", "Réception", "Validation finale"] as const).map((st, i) => (
            <span key={st} className="flex items-center gap-6">
              <span className="text-body">{st}</span>
              {i < 5 && <Icon name="arrow" className="h-3.5 w-3.5 text-frost" />}
            </span>
          ))}
          <span className="ml-auto hidden font-mono text-[10px] text-faint md:block">réf. cahier des charges §8 · {TRANSFER_META.demande.label} → clôture</span>
        </div>
      </Reveal>
    </div>
  );
}
