import { useEffect, useMemo, useState } from "react";
import { useStore, fmtDate, fmtDateTime, locLabel, locFull, siteLabel, isTransferActive, daysUntil } from "../store";
import { STATUS_META, STATUS_ORDER, perms, type Equipment, type EquipStatus } from "../types";
import { Icon } from "../components/icons";
import { Overline, Reveal, StatusBadge, InvBadge, Drawer, Modal, PseudoQR, EmptyState, btnPrimary, btnGhost, inputCls, labelCls } from "../components/ui";

const ACTION_ICON: Record<string, string> = {
  CREATION: "tag", CHANGEMENT_STATUT: "ac", DEMANDE_TRANSFERT: "swap", VALIDATION_TRANSFERT: "check",
  REFUS_TRANSFERT: "x", EXPEDITION_TRANSFERT: "truck", RECEPTION_TRANSFERT: "box", INTERVENTION: "wrench",
  CONTROLE_INVENTAIRE: "clipboard", ANOMALIE: "alert", REGULARISATION_ANOMALIE: "check",
};

export default function Equipments({ onNav, focusCode }: { onNav: (v: string, p?: string) => void; focusCode?: string }) {
  const { state: s, dispatch, me } = useStore();
  const p = perms(me?.role);

  const [q, setQ] = useState("");
  const [fSite, setFSite] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fBrand, setFBrand] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const [tab, setTab] = useState<"fiche" | "historique" | "maintenance">("fiche");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (focusCode) {
      const e = s.equipment.find((x) => x.code.toLowerCase() === focusCode.toLowerCase());
      if (e) { setSel(e.id); setTab("fiche"); }
      else setQ(focusCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCode]);

  const brands = useMemo(() => [...new Set(s.equipment.map((e) => e.brand))].sort(), [s.equipment]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.equipment.filter((e) => {
      const site = s.locations.find((l) => l.id === e.locationId)?.siteId;
      if (fSite !== "all" && site !== fSite) return false;
      if (fStatus !== "all" && e.status !== fStatus) return false;
      if (fBrand !== "all" && e.brand !== fBrand) return false;
      if (needle) {
        const hay = `${e.code} ${e.serial} ${e.brand} ${e.model} ${e.responsible} ${locLabel(s, e.locationId)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [s, q, fSite, fStatus, fBrand]);

  const selEq = sel ? s.equipment.find((e) => e.id === sel) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline className="text-teal">Module équipements</Overline>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Registre des climatiseurs</h1>
          <p className="mt-1.5 text-sm text-mute">
            {s.equipment.length} fiches · identité unique <span className="font-mono text-xs">CLM-xxxxxx</span> · n° série constructeur verrouillé en unicité.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} disabled={!p.manageEquip} className={`${btnPrimary} disabled:opacity-40`} title={!p.manageEquip ? "Réservé administrateur / gestionnaire" : ""}>
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
          Nouvel équipement
        </button>
      </div>

      {/* filtres */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-card p-3.5">
          <div className="relative min-w-[220px] flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ID, n° série, marque, emplacement… (ex. SN-HIS-4589237)" className={`${inputCls} pl-9`} />
          </div>
          <select value={fSite} onChange={(e) => setFSite(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">Tous les sites</option>
            {s.sites.map((x) => <option key={x.id} value={x.id}>{x.city} — {x.name}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">Tous les statuts</option>
            {STATUS_ORDER.map((x) => <option key={x} value={x}>{STATUS_META[x].label}</option>)}
          </select>
          <select value={fBrand} onChange={(e) => setFBrand(e.target.value)} className={`${inputCls} w-auto`}>
            <option value="all">Toutes les marques</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <span className="ml-auto font-mono text-xs text-mute">{filtered.length} résultat{filtered.length > 1 ? "s" : ""}</span>
        </div>
      </Reveal>

      {/* table */}
      <Reveal delay={60}>
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-line bg-paper/70 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                  <th className="px-4 py-3">Équipement</th>
                  <th className="px-4 py-3">N° série</th>
                  <th className="px-4 py-3">Emplacement officiel</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Dernier contrôle</th>
                  <th className="w-8 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} onClick={() => { setSel(e.id); setTab("fiche"); }} className="row-live cursor-pointer border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[12.5px] font-semibold text-tealdeep">{e.code}</div>
                      <div className="text-[13px] font-medium text-body">{e.brand} <span className="text-mute">{e.model} · {e.power}</span></div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-body">{e.serial}</td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] text-body">{locLabel(s, e.locationId)}</div>
                      <div className="text-[11px] text-faint">{locFull(s, e.locationId)}</div>
                    </td>
                    <td className="px-4 py-3"><StatusBadge s={e.status} pulse /></td>
                    <td className="px-4 py-3 text-[13px] text-body">{e.responsible}</td>
                    <td className="px-4 py-3">
                      {e.lastInventory ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-mute">{fmtDate(e.lastInventory)}</span>
                          {e.lastInventoryResult && <InvBadge r={e.lastInventoryResult} />}
                        </div>
                      ) : (
                        <span className="text-[12px] text-faint">jamais contrôlé</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-faint"><Icon name="chevR" className="h-4 w-4" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-6">
              <EmptyState icon="search" title="Aucun équipement trouvé" sub="Ajustez la recherche ou les filtres — le n° série est le moyen le plus sûr de retrouver une unité." />
            </div>
          )}
        </div>
      </Reveal>

      <EquipDrawer eq={selEq} tab={tab} setTab={setTab} onClose={() => setSel(null)} onNav={onNav} p={p} />
      <AddEquipmentModal open={showAdd} onClose={() => setShowAdd(false)} dispatch={dispatch} state={s} />
    </div>
  );
}

/* ================= Tiroir fiche ================= */

function EquipDrawer({ eq, tab, setTab, onClose, onNav, p }: {
  eq: Equipment | null; tab: "fiche" | "historique" | "maintenance";
  setTab: (t: "fiche" | "historique" | "maintenance") => void;
  onClose: () => void; onNav: (v: string, p?: string) => void;
  p: ReturnType<typeof perms>;
}) {
  const { state: s, dispatch } = useStore();
  if (!eq) return null;

  const history = s.audit.filter((a) => a.entityId === eq.code);
  const interventions = s.interventions.filter((i) => i.equipmentId === eq.id);
  const activeTr = s.transfers.find((t) => t.equipmentId === eq.id && ["demande", "valide", "transit"].includes(t.status));
  const site = s.locations.find((l) => l.id === eq.locationId)?.siteId;

  const canTransfer = p.request && !activeTr && !["transfert", "reforme", "perdu"].includes(eq.status);

  const fields: [string, string][] = [
    ["Type", eq.type], ["Puissance", eq.power], ["Technologie", eq.tech], ["Fluide frigorigène", eq.refrigerant],
    ["Capacité", eq.capacity], ["Consommation", eq.consumption], ["Année fabrication", String(eq.yearFab)],
    ["Année acquisition", String(eq.yearAcq)], ["Fournisseur", eq.supplier], ["Facture / réf.", eq.invoice],
    ["Fin de garantie", fmtDate(eq.warrantyEnd)], ["Créé le", fmtDate(eq.createdAt)],
  ];

  return (
    <Drawer open onClose={onClose}>
      <div className="sticky top-0 z-10 border-b border-line bg-paper/95 px-6 py-5 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">{eq.code}</h2>
              <StatusBadge s={eq.status} pulse />
              {activeTr && <span className="font-mono text-[10.5px] uppercase tracking-wider text-amber">{activeTr.code} en cours</span>}
            </div>
            <div className="mt-1 text-sm text-mute">{eq.brand} {eq.model} · {eq.power} · <span className="font-mono text-xs">{eq.serial}</span></div>
          </div>
          <button onClick={onClose} className="btn-press rounded-md p-1.5 text-mute hover:bg-card hover:text-ink" aria-label="Fermer la fiche">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 flex gap-1.5">
          {(["fiche", "historique", "maintenance"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`btn-press rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold capitalize ${tab === t ? "bg-ink text-frost" : "bg-card text-mute hover:text-ink"}`}>
              {t === "fiche" ? "Fiche & identité" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-6 py-6">
        {/* emplacement officiel + QR */}
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-line bg-card p-5 sm:col-span-3">
            <div className="flex items-center justify-between">
              <Overline className="text-teal">Emplacement officiel</Overline>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                <Icon name="lock" className="h-3.5 w-3.5" /> protégé
              </span>
            </div>
            <div className="mt-2.5 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-icefrost text-tealdeep"><Icon name="pin" className="h-5 w-5" /></span>
              <div>
                <div className="font-display text-lg font-bold text-ink">{locLabel(s, eq.locationId)}</div>
                <div className="text-[13px] text-mute">{siteLabel(s, site ?? "")} · {locFull(s, eq.locationId)}</div>
                <div className="mt-1 text-[12.5px] text-body">Responsable actuel : <b>{eq.responsible}</b></div>
              </div>
            </div>
            <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-[11.5px] leading-relaxed text-mute">
              Règle n°3 — cet emplacement ne se modifie jamais directement. Tout déplacement passe par un
              <b className="text-tealdeep"> transfert validé puis réceptionné</b>.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-card p-4 sm:col-span-2">
            <PseudoQR seed={eq.code} size={116} className="rounded-lg border border-line" />
            <div className="mt-2 font-mono text-[11px] font-semibold text-ink">{eq.code}</div>
            <div className="text-[10.5px] text-faint">Étiquette QR à apposer sur l'unité</div>
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNav("transferts", `new:${eq.id}`)}
            disabled={!canTransfer}
            className={btnPrimary}
            title={!canTransfer ? (activeTr ? "Transfert déjà en cours (règle n°6)" : "Statut incompatible ou droits insuffisants") : ""}
          >
            <Icon name="swap" className="h-4 w-4" /> Demander un transfert
          </button>
          {p.manageEquip && (
            <label className="flex items-center gap-2 rounded-lg border border-linedark bg-card px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-mute">Statut</span>
              <select
                value={eq.status}
                onChange={(e) => dispatch({ type: "SET_STATUS", id: eq.id, status: e.target.value as EquipStatus })}
                className="bg-transparent text-sm font-semibold text-body focus:outline-none"
              >
                {STATUS_ORDER.map((st) => <option key={st} value={st}>{STATUS_META[st].label}</option>)}
              </select>
            </label>
          )}
          {eq.comment && <span className="w-full rounded-lg bg-[#fbeed3]/60 px-3 py-2 text-[12px] text-[#8a5b06]">{eq.comment}</span>}
        </div>

        {tab === "fiche" && (
          <div className="anim-fade-up rounded-xl border border-line bg-card p-5">
            <Overline className="mb-4 text-teal">Identification & caractéristiques</Overline>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {fields.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">{k}</dt>
                  <dd className="mt-0.5 text-[13.5px] font-medium text-body">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {tab === "historique" && (
          <div className="anim-fade-up space-y-0">
            <Overline className="mb-3 text-teal">Historique complet — journalisé, inaltérable</Overline>
            {[...history, ...(history.some((h) => h.action === "CREATION") ? [] : [{ id: "birth", at: eq.createdAt, user: "Système", role: "admin" as const, action: "CREATION", entity: "Équipement", entityId: eq.code, detail: `Fiche ${eq.code} créée — ${eq.brand} ${eq.model}, SN ${eq.serial}.` }])]
              .sort((a, b) => (a.at < b.at ? 1 : -1))
              .map((h, i) => (
                <div key={h.id} className="relative flex gap-4 pb-5">
                  {i < history.length && <span className="absolute left-[15px] top-8 h-full w-px bg-linedark" />}
                  <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-card text-tealdeep">
                    <Icon name={ACTION_ICON[h.action] ?? "history"} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-icefrost px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-tealdeep">{h.action}</span>
                      <span className="font-mono text-[11px] text-faint">{fmtDateTime(h.at)}</span>
                    </div>
                    <div className="mt-1 text-[13px] leading-snug text-body">{h.detail}</div>
                    <div className="mt-0.5 text-[11.5px] text-mute">par {h.user}</div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === "maintenance" && (
          <div className="anim-fade-up space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-line bg-card px-5 py-4">
              <div>
                <Overline className="text-teal">Échéance préventive</Overline>
                <div className="mt-1 font-display text-lg font-bold text-ink">
                  {eq.nextMaintenance ? fmtDate(eq.nextMaintenance) : "non planifiée"}
                </div>
                {eq.nextMaintenance && (
                  <div className={`text-[12px] font-semibold ${daysUntil(eq.nextMaintenance) < 0 ? "text-danger" : "text-mute"}`}>
                    {daysUntil(eq.nextMaintenance) < 0 ? `En retard de ${Math.abs(daysUntil(eq.nextMaintenance))} jours` : `Dans ${daysUntil(eq.nextMaintenance)} jours`}
                  </div>
                )}
              </div>
              <button onClick={() => onNav("maintenance", eq.id)} className={btnGhost}>
                <Icon name="wrench" className="h-4 w-4" /> Consigner une intervention
              </button>
            </div>
            {interventions.length === 0 ? (
              <EmptyState icon="wrench" title="Aucune intervention" sub="Les interventions techniques consignées apparaîtront ici avec coûts et pièces." />
            ) : (
              interventions.map((i) => (
                <div key={i.id} className="rounded-xl border border-line bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[12px] font-semibold text-tealdeep">{i.code}</span>
                    <span className="font-mono text-[11px] text-faint">{fmtDate(i.date)} · {i.technician}</span>
                  </div>
                  <div className="mt-1.5 text-[13.5px] text-body">{i.action}</div>
                  {i.parts && <div className="mt-0.5 text-[12px] text-mute">Pièces : {i.parts}</div>}
                  <div className="mt-1 flex items-center justify-between text-[12px]">
                    <span className="text-mute">Résultat : <b className="text-body">{i.result}</b></span>
                    <span className="font-mono font-semibold text-ink">{i.cost.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

/* ================= Ajout ================= */

function AddEquipmentModal({ open, onClose, dispatch, state }: {
  open: boolean; onClose: () => void;
  dispatch: ReturnType<typeof useStore>["dispatch"];
  state: ReturnType<typeof useStore>["state"];
}) {
  const [form, setForm] = useState({
    brand: "Hisense", model: "", serial: "", type: "Split mural", power: "1,5 CV",
    supplier: "", invoice: "", yearAcq: new Date().getFullYear(), warrantyEnd: "", locationId: state.locations[0]?.id ?? "L01", responsible: "",
  });
  const [err, setErr] = useState("");

  const serialTaken = form.serial.trim() !== "" && state.equipment.some((e) => e.serial.toUpperCase() === form.serial.trim().toUpperCase());

  const submit = () => {
    if (!form.model.trim() || !form.serial.trim() || !form.responsible.trim()) {
      setErr("Modèle, n° série et responsable sont obligatoires.");
      return;
    }
    if (serialTaken) { setErr(`Le n° série ${form.serial.trim().toUpperCase()} est déjà attribué (règle n°1).`); return; }
    const y = new Date(); y.setFullYear(y.getFullYear() + 1);
    dispatch({
      type: "ADD_EQUIPMENT",
      data: {
        serial: form.serial, brand: form.brand, model: form.model, type: form.type, power: form.power,
        tech: "Inverter", refrigerant: "R410A", capacity: "12 000 BTU", consumption: "1,1 kW/h",
        yearFab: form.yearAcq - 1, yearAcq: form.yearAcq, supplier: form.supplier || "—",
        invoice: form.invoice || "—", warrantyEnd: form.warrantyEnd ? new Date(form.warrantyEnd).toISOString() : y.toISOString(),
        status: "stock", locationId: form.locationId, responsible: form.responsible,
      },
    });
    onClose();
    setForm((f) => ({ ...f, model: "", serial: "", invoice: "" }));
    setErr("");
  };

  return (
    <Modal open={open} onClose={onClose} over="Règle n°1 — unicité du n° de série" title="Enregistrer un climatiseur" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Marque</label>
          <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputCls}>
            {["Hisense", "Samsung", "LG", "Daikin", "Midea", "TCL", "Nasco", "Haier", "Gree", "Panasonic"].map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Modèle *</label>
          <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputCls} placeholder="AS-12TW4" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>N° de série constructeur *</label>
          <input
            value={form.serial}
            onChange={(e) => { setForm({ ...form, serial: e.target.value.toUpperCase() }); setErr(""); }}
            className={`${inputCls} font-mono ${serialTaken ? "border-danger" : ""}`}
            placeholder="SN-HIS-4589XXX"
          />
          {serialTaken && <p className="mt-1 text-[11.5px] font-semibold text-danger">Ce n° de série existe déjà dans le registre — doublon bloqué.</p>}
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
            {["Split mural", "Cassette plafonnier", "Armoire de précision", "Console", "Gainable"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Puissance</label>
          <select value={form.power} onChange={(e) => setForm({ ...form, power: e.target.value })} className={inputCls}>
            {["1 CV", "1,5 CV", "2 CV", "3 CV"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Fournisseur</label>
          <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className={inputCls} placeholder="CFAO Équipement" />
        </div>
        <div>
          <label className={labelCls}>Réf. facture</label>
          <input value={form.invoice} onChange={(e) => setForm({ ...form, invoice: e.target.value })} className={inputCls} placeholder="FA-2026-…" />
        </div>
        <div>
          <label className={labelCls}>Année d'acquisition</label>
          <input type="number" value={form.yearAcq} onChange={(e) => setForm({ ...form, yearAcq: +e.target.value })} className={inputCls} min={2010} max={2030} />
        </div>
        <div>
          <label className={labelCls}>Fin de garantie</label>
          <input type="date" value={form.warrantyEnd} onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Affectation initiale (site / local)</label>
          <select value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} className={inputCls}>
            {state.sites.map((st) => (
              <optgroup key={st.id} label={`${st.city} — ${st.name}`}>
                {state.locations.filter((l) => l.siteId === st.id).map((l) => (
                  <option key={l.id} value={l.id}>{l.building} / {l.floor} / {l.room}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Responsable *</label>
          <input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} className={inputCls} placeholder="Nom du responsable de site" />
        </div>
      </div>
      {err && <p className="mt-3 rounded-lg bg-[#fadfda] px-3 py-2 text-[12.5px] font-medium text-[#9e3327]">{err}</p>}
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-[11.5px] text-faint">L'identifiant interne <span className="font-mono">CLM-xxxxxx</span> est généré automatiquement et ne changera jamais.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className={btnGhost}>Annuler</button>
          <button onClick={submit} className={btnPrimary}><Icon name="check" className="h-4 w-4" /> Enregistrer la fiche</button>
        </div>
      </div>
    </Modal>
  );
}
