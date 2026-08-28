import { useEffect, useMemo, useState } from "react";
import { StoreProvider, useStore, computeAlerts, daysUntil } from "./store";
import { ROLE_META } from "./types";
import { Icon } from "./components/icons";
import { Overline } from "./components/ui";
import ScanModal from "./components/ScanModal";
import Login from "./views/Login";
import Dashboard from "./views/Dashboard";
import Equipments from "./views/Equipments";
import Transfers from "./views/Transfers";
import Sites from "./views/Sites";
import Maintenance from "./views/Maintenance";
import { InventoryView, AnomaliesView } from "./views/Inventory";
import { AuditView, ReportsView } from "./views/Journal";

type ViewId = "dashboard" | "equipments" | "transferts" | "sites" | "maintenance" | "inventaire" | "anomalies" | "rapports" | "audit";

export default function App() {
  const [persistWarn, setPersistWarn] = useState(0);
  useEffect(() => {
    if (!persistWarn) return;
    const t = setTimeout(() => setPersistWarn(0), 6500);
    return () => clearTimeout(t);
  }, [persistWarn]);
  return (
    <StoreProvider onPersistError={() => setPersistWarn((n) => n + 1)}>
      <Shell />
      {persistWarn > 0 && (
        <div className="anim-pop fixed bottom-5 left-1/2 z-[95] flex max-w-md -translate-x-1/2 items-start gap-3 rounded-xl border border-[#f3d3b8] bg-[#a34a08] px-4 py-3.5 text-white shadow-2xl">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-[12.5px] leading-snug">
            <b>Stockage local saturé</b> — les derniers ajouts (photos) ne sont pas sauvegardés durablement.
            Retirez d'anciennes photos de galeries pour libérer de l'espace.
          </div>
        </div>
      )}
    </StoreProvider>
  );
}

function Shell() {
  const { state, dispatch, me } = useStore();
  const [view, setView] = useState<ViewId>("dashboard");
  const [param, setParam] = useState<string | undefined>(undefined);
  const [sideOpen, setSideOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [scanOpen, setScanOpen] = useState(false);

  const alerts = useMemo(() => computeAlerts(state), [state]);
  const pendingTr = state.transfers.filter((t) => t.status === "demande").length;
  const openAn = state.anomalies.filter((a) => a.status === "ouverte").length;
  const overdue = state.equipment.filter((e) => e.nextMaintenance && !["reforme", "perdu"].includes(e.status) && daysUntil(e.nextMaintenance) < 0).length;

  const onNav = (v: string, p?: string) => {
    setView(v as ViewId);
    setParam(p);
    setSideOpen(false);
    setBellOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  if (!me) return <Login />;

  const nav: { id: ViewId; label: string; icon: string; badge?: number; tone?: "amber" | "red" }[] = [
    { id: "dashboard", label: "Tableau de bord", icon: "grid" },
    { id: "equipments", label: "Équipements", icon: "ac" },
    { id: "transferts", label: "Transferts", icon: "swap", badge: pendingTr, tone: "amber" },
    { id: "sites", label: "Sites & locaux", icon: "building" },
    { id: "maintenance", label: "Maintenance", icon: "wrench", badge: overdue, tone: "amber" },
    { id: "inventaire", label: "Inventaire", icon: "clipboard" },
    { id: "anomalies", label: "Anomalies", icon: "alert", badge: openAn, tone: "red" },
    { id: "rapports", label: "Rapports", icon: "report" },
    { id: "audit", label: "Journal d'audit", icon: "scroll" },
  ];

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-frost/15 text-frost ring-1 ring-frost/35">
          <Icon name="snow" className="h-5 w-5" strokeWidth={1.6} />
        </span>
        <div>
          <div className="font-display text-[17px] font-bold tracking-tight text-white">ClimaTrace</div>
          <Overline className="text-frost/60">Groupe Kelvia</Overline>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        <Overline className="px-2 pb-2 text-paper/35">Pilotage</Overline>
        {nav.map((n) => {
          const active = view === n.id;
          return (
            <button
              key={n.id}
              onClick={() => onNav(n.id)}
              className={`btn-press group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium transition-colors ${
                active ? "bg-frost/12 text-frost" : "text-paper/65 hover:bg-white/5 hover:text-paper"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-frost" />}
              <Icon name={n.icon} className={`h-[18px] w-[18px] ${active ? "text-frost" : "text-paper/45 group-hover:text-paper/80"}`} />
              {n.label}
              {!!n.badge && (
                <span className={`ml-auto rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold ${n.tone === "red" ? "bg-danger/20 text-[#ffb4ab]" : "bg-amber/20 text-[#ffd48a]"}`}>
                  {n.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="btn-press mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] text-paper/50 hover:bg-white/5 hover:text-paper"
        >
          <Icon name="history" className="h-4 w-4" /> Réinitialiser la démonstration
        </button>
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-frost text-ink font-display text-[13px] font-bold">{me.initials}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-white">{me.name}</div>
            <div className="truncate text-[10.5px] text-paper/55">{ROLE_META[me.role].label}</div>
          </div>
          <button onClick={() => dispatch({ type: "LOGOUT" })} className="btn-press rounded-md p-1.5 text-paper/60 hover:bg-white/10 hover:text-frost" title="Se déconnecter">
            <Icon name="out" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grain min-h-screen">
      {/* sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] bg-ink lg:block">{sidebar}</aside>

      {/* sidebar mobile */}
      {sideOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setSideOpen(false)} />
          <aside className="anim-drawer absolute inset-y-0 left-0 w-[268px] bg-ink shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-[248px]">
        {/* topbar */}
        <header className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button onClick={() => setSideOpen(true)} className="btn-press rounded-lg border border-linedark bg-card p-2 text-body lg:hidden" aria-label="Ouvrir le menu">
              <Icon name="grid" className="h-4.5 w-4.5" />
            </button>

            <div className="relative hidden max-w-md flex-1 md:block">
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) { onNav("equipments", search.trim()); setSearch(""); } }}
                placeholder="Recherche globale — CLM-000125, SN-HIS-4589237… puis Entrée"
                className="w-full rounded-lg border border-linedark bg-card py-2 pl-9 pr-3 font-mono text-[12.5px] focus:border-teal"
              />
            </div>

            <div className="ml-auto flex items-center gap-2.5">
              <span className="hidden items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-mute sm:flex">
                <span className="anim-breathe h-1.5 w-1.5 rounded-full bg-leaf" /> chaîne intègre
              </span>

              <button
                onClick={() => setScanOpen(true)}
                className="btn-press flex items-center gap-2 rounded-lg bg-ink px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-frost hover:bg-pine"
                title="Scanner une étiquette QR avec la caméra"
              >
                <Icon name="scan" className="h-4.5 w-4.5" />
                <span className="hidden sm:inline">Scanner</span>
              </button>

              <div className="relative">
                <button onClick={() => setBellOpen(!bellOpen)} className="btn-press relative rounded-lg border border-linedark bg-card p-2 text-body hover:border-teal" aria-label="Notifications">
                  <Icon name="bell" className="h-4.5 w-4.5" />
                  {alerts.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 font-mono text-[9.5px] font-bold text-white">
                      {alerts.length}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <>
                    <div className="fixed inset-0 z-[65]" onClick={() => setBellOpen(false)} />
                    <div className="anim-pop absolute right-0 z-[66] mt-2 w-[340px] rounded-xl border border-line bg-card shadow-2xl">
                      <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <span className="font-display text-[14px] font-bold text-ink">Notifications</span>
                        <span className="font-mono text-[10.5px] text-faint">{alerts.length} active{alerts.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto p-2">
                        {alerts.length === 0 && <p className="px-3 py-6 text-center text-[12.5px] text-mute">Aucune alerte — parc conforme.</p>}
                        {alerts.slice(0, 8).map((al) => (
                          <button key={al.id} onClick={() => onNav(al.view)} className="btn-press flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-paper">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${al.severity === "red" ? "bg-danger dot-pulse-red" : al.severity === "amber" ? "bg-amber dot-pulse-amber" : "bg-teal dot-pulse"}`} />
                            <span className="text-[12.5px] leading-snug text-body">{al.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="hidden items-center gap-2.5 rounded-lg border border-linedark bg-card py-1.5 pl-1.5 pr-3 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink font-display text-[11px] font-bold text-frost">{me.initials}</span>
                <div className="leading-tight">
                  <div className="text-[12px] font-semibold text-ink">{me.name}</div>
                  <div className="font-mono text-[9.5px] uppercase tracking-wider text-faint">{ROLE_META[me.role].label}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 sm:py-8">
          {view === "dashboard" && <Dashboard onNav={onNav} />}
          {view === "equipments" && <Equipments onNav={onNav} focusCode={param} />}
          {view === "transferts" && <Transfers param={param} clearParam={() => setParam(undefined)} />}
          {view === "sites" && <Sites onNav={onNav} />}
          {view === "maintenance" && <Maintenance param={param} />}
          {view === "inventaire" && <InventoryView />}
          {view === "anomalies" && <AnomaliesView onNav={onNav} />}
          {view === "rapports" && <ReportsView onToast={(m) => dispatch({ type: "TOAST", msg: m })} />}
          {view === "audit" && <AuditView onNav={onNav} />}

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-[11.5px] text-faint">
            <span className="flex items-center gap-2 font-mono uppercase tracking-[0.18em]">
              <Icon name="snow" className="h-3.5 w-3.5 text-teal" /> ClimaTrace v1.0 — MVP traçabilité
            </span>
            <span>Équipement → Identité → Emplacement → Responsable → Mouvement → Historique</span>
          </footer>
        </main>
      </div>

      {/* scan QR global */}
      <ScanModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDetected={(code) => { setScanOpen(false); onNav("equipments", code); }}
        over="Accès direct fiche"
        title="Scanner une étiquette ClimaTrace"
      />

      {/* toast */}
      {state.toast && (
        <div className="anim-pop fixed bottom-5 right-5 z-[90] flex max-w-sm items-start gap-3 rounded-xl border border-white/10 bg-ink px-4 py-3.5 text-paper shadow-2xl">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-frost text-ink">
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-frost/70">Opération journalisée</div>
            <div className="mt-0.5 text-[13px] leading-snug">{state.toast}</div>
          </div>
        </div>
      )}
    </div>
  );
}
