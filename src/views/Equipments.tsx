import { useEffect, useMemo, useState } from "react";
import { useStore, fmtDate, fmtDateTime, locLabel, locFull, siteLabel, daysUntil } from "../store";
import { STATUS_META, STATUS_ORDER, perms, type Equipment, type EquipStatus } from "../types";
import { Icon } from "../components/icons";
import { Overline, Reveal, StatusBadge, InvBadge, Drawer, Modal, PseudoQR, EmptyState, btnPrimary, btnGhost, inputCls, labelCls } from "../components/ui";
import { compressImage } from "../lib/photos";
import { labelSheetPdf, type LabelItem } from "../lib/pdf";

const ACTION_ICON: Record<string, string> = {
  CREATION: "tag", CHANGEMENT_STATUT: "ac", DEMANDE_TRANSFERT: "swap", VALIDATION_TRANSFERT: "check",
  REFUS_TRANSFERT: "x", EXPEDITION_TRANSFERT: "truck", RECEPTION_TRANSFERT: "box", INTERVENTION: "wrench",
  CONTROLE_INVENTAIRE: "clipboard", ANOMALIE: "alert", REGULARISATION_ANOMALIE: "check",
  IMPORT_LOT: "box", IMPORT_CSV: "download", PHOTO: "ac",
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

  const toLabels = (list: Equipment[]): LabelItem[] =>
    list.map((e) => ({
      code: e.code, serial: e.serial, brand: e.brand, model: e.model, power: e.power,
      loc: `${locLabel(s, e.locationId)} — ${locFull(s, e.locationId)}`,
      photo: e.photos?.[0],
    }));

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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => labelSheetPdf(toLabels(filtered), "registre")}
            disabled={filtered.length === 0}
            className={btnGhost}
            title="Planche PDF A4 des QR codes de la liste filtrée — avec mini-photo si disponible"
          >
            <Icon name="qr" className="h-4 w-4" />
            Étiquettes PDF ({filtered.length})
          </button>
          <button onClick={() => setShowAdd(true)} disabled={!p.manageEquip} className={`${btnPrimary} disabled:opacity-40`} title={!p.manageEquip ? "Réservé administrateur / gestionnaire" : ""}>
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} />
            Enregistrer
          </button>
        </div>
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
                      <div className="flex items-center gap-2.5">
                        {e.photos?.[0] ? (
                          <img src={e.photos[0]} alt="" className="h-9 w-12 shrink-0 rounded-md border border-line object-cover" />
                        ) : (
                          <span className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md bg-paper text-faint"><Icon name="ac" className="h-4.5 w-4.5" /></span>
                        )}
                        <div>
                          <div className="font-mono text-[12.5px] font-semibold text-tealdeep">{e.code}</div>
                          <div className="text-[13px] font-medium text-body">{e.brand} <span className="text-mute">{e.model} · {e.power}</span></div>
                        </div>
                      </div>
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

      {/* historique des imports */}
      <Reveal delay={80}>
        <div className="rounded-xl border border-line bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <Overline className="text-teal">Traçabilité des arrivages</Overline>
              <h2 className="mt-0.5 font-display text-lg font-bold text-ink">Historique des imports</h2>
            </div>
            <span className="rounded-full bg-paper px-2.5 py-1 font-mono text-[11px] font-semibold text-mute">{s.imports.length} opération{s.imports.length > 1 ? "s" : ""}</span>
          </div>
          {s.imports.length === 0 ? (
            <p className="text-[12.5px] text-faint">Aucun import enregistré — les entrées en lot et imports CSV apparaîtront ici.</p>
          ) : (
            <div className="space-y-2">
              {s.imports.map((im) => (
                <div key={im.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-paper/60 px-4 py-3">
                  <span className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${im.source === "csv" ? "bg-icefrost text-tealdeep" : "bg-[#fbeed3] text-[#8a5b06]"}`}>
                    {im.source === "csv" ? "CSV" : "Lot"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12px] font-bold text-tealdeep">{im.code}</span>
                      {im.fileName && <span className="truncate font-mono text-[11.5px] text-body">{im.fileName}</span>}
                    </div>
                    <div className="text-[11.5px] text-mute">
                      {fmtDateTime(im.date)} · opérateur : <b className="text-body">{im.operator}</b> · {im.count} unité{im.count > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {im.codes.slice(0, 3).map((c) => (
                      <button key={c} onClick={() => { const e = s.equipment.find((x) => x.code === c); if (e) { setSel(e.id); setTab("fiche"); } }} className="btn-press rounded-md border border-line bg-card px-2 py-1 font-mono text-[10.5px] font-semibold text-tealdeep hover:border-teal">
                        {c}
                      </button>
                    ))}
                    {im.codes.length > 3 && <span className="font-mono text-[10.5px] text-faint">+{im.codes.length - 3}</span>}
                    <button
                      onClick={() => labelSheetPdf(toLabels(s.equipment.filter((e) => im.codes.includes(e.code))), im.code)}
                      className={`${btnGhost} !px-3 !py-1.5 text-[11.5px]`}
                      title="Régénérer la planche d'étiquettes de cet import"
                    >
                      <Icon name="qr" className="h-3.5 w-3.5" /> Planche PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      <EquipDrawer eq={selEq} tab={tab} setTab={setTab} onClose={() => setSel(null)} onNav={onNav} p={p} />
      <RegisterModal open={showAdd} onClose={() => setShowAdd(false)} dispatch={dispatch} state={s} />
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
  const [lightbox, setLightbox] = useState<string | null>(null);
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
            <button
              onClick={() => labelSheetPdf([{ code: eq.code, serial: eq.serial, brand: eq.brand, model: eq.model, power: eq.power, loc: `${locLabel(s, eq.locationId)} — ${locFull(s, eq.locationId)}`, photo: eq.photos?.[0] }], eq.code)}
              className={`${btnGhost} mt-2.5 !px-3 !py-1.5 text-[11.5px]`}
            >
              <Icon name="qr" className="h-3.5 w-3.5" /> Étiquette PDF
            </button>
          </div>
        </div>

        {/* galerie photo */}
        <div className="rounded-xl border border-line bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Overline className="text-teal">Galerie d'identification terrain</Overline>
              <div className="text-[12px] text-mute">Photos compressées stockées avec la fiche — {(eq.photos ?? []).length}/6</div>
            </div>
            {p.manageEquip && (eq.photos ?? []).length < 6 && (
              <label className={`${btnGhost} cursor-pointer !px-3 !py-1.5 text-[12px]`}>
                <Icon name="plus" className="h-3.5 w-3.5" /> Ajouter une photo
                <input
                  type="file" accept="image/*" className="hidden"
                  onChange={async (ev) => {
                    const f = ev.target.files?.[0];
                    if (!f) return;
                    try {
                      const url = await compressImage(f);
                      dispatch({ type: "ADD_PHOTO", equipmentId: eq.id, dataUrl: url });
                    } catch {
                      dispatch({ type: "TOAST", msg: "Fichier image illisible — photo non ajoutée." });
                    }
                    ev.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          {(eq.photos ?? []).length === 0 ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-dashed border-linedark bg-paper/60 px-4 py-3.5">
              <Icon name="ac" className="h-5 w-5 shrink-0 text-faint" />
              <p className="text-[12.5px] text-mute">
                Aucune photo — ajoutez un cliché de l'unité intérieure (et du groupe extérieur) pour faciliter
                l'identification visuelle lors des inventaires et la reconnaissance sur les planches d'étiquettes.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
              {(eq.photos ?? []).map((ph, i) => (
                <div key={i} className="group relative aspect-[3/2] overflow-hidden rounded-lg border border-line bg-paper">
                  <button onClick={() => setLightbox(ph)} className="btn-press block h-full w-full" title="Agrandir">
                    <img src={ph} alt={`${eq.code} — photo ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </button>
                  {p.manageEquip && (
                    <button
                      onClick={() => dispatch({ type: "REMOVE_PHOTO", equipmentId: eq.id, index: i })}
                      className="btn-press absolute right-1 top-1 rounded-md bg-ink/75 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      title="Retirer cette photo"
                    >
                      <Icon name="x" className="h-3 w-3" strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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

      <Modal open={lightbox !== null} onClose={() => setLightbox(null)} over={`${eq.code} — identification visuelle`} title="Photo de l'équipement" wide>
        {lightbox && <img src={lightbox} alt={`${eq.code} — vue agrandie`} className="w-full rounded-lg border border-line" />}
      </Modal>
    </Drawer>
  );
}

/* ================= Enregistrement : unité / lot / import CSV ================= */

type CsvRow = { serial: string; brand: string; model: string; type: string; power: string; supplier: string; invoice: string };

const normH = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

const HEADER_MAP: Record<string, keyof CsvRow> = {
  serial: "serial", numeroserie: "serial", nserie: "serial", sn: "serial", serialnumber: "serial",
  marque: "brand", brand: "brand",
  modele: "model", model: "model",
  type: "type", categorie: "type",
  puissance: "power", power: "power",
  fournisseur: "supplier", supplier: "supplier",
  facture: "invoice", invoice: "invoice", reference: "invoice",
};

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const first = lines[0];
  const sep = [";", ",", "\t"].sort((a, b) => first.split(b).length - first.split(a).length)[0];
  const heads = first.split(sep).map(normH);
  const idx: Partial<Record<keyof CsvRow, number>> = {};
  heads.forEach((h, i) => {
    const k = HEADER_MAP[h];
    if (k && idx[k] === undefined) idx[k] = i;
  });
  if (idx.serial === undefined) return [];
  return lines.slice(1).map((l) => {
    const cols = l.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const get = (k: keyof CsvRow) => (idx[k] !== undefined ? cols[idx[k] as number] ?? "" : "");
    return {
      serial: get("serial").toUpperCase(), brand: get("brand"), model: get("model"),
      type: get("type") || "Split mural", power: get("power") || "1,5 CV",
      supplier: get("supplier"), invoice: get("invoice"),
    };
  });
}

const nextCodes = (seqEq: number, n: number) =>
  Array.from({ length: n }, (_, i) => `CLM-${String(seqEq + 1 + i).padStart(6, "0")}`);

const stockLocation = (state: ReturnType<typeof useStore>["state"]) =>
  state.locations.find((l) => /magasin|dépôt|depot|stock/i.test(l.room))?.id ?? state.locations[0]?.id ?? "";

type SubProps = {
  state: ReturnType<typeof useStore>["state"];
  dispatch: ReturnType<typeof useStore>["dispatch"];
  onSuccess: (codes: string[]) => void;
};

function RegisterModal({ open, onClose, dispatch, state }: {
  open: boolean; onClose: () => void;
  dispatch: ReturnType<typeof useStore>["dispatch"];
  state: ReturnType<typeof useStore>["state"];
}) {
  const [tab, setTab] = useState<"single" | "lot" | "csv">("single");
  const [done, setDone] = useState<string[] | null>(null);

  useEffect(() => {
    if (!open) { setTab("single"); setDone(null); }
  }, [open]);

  const labelsFor = (codes: string[]): LabelItem[] =>
    state.equipment.filter((e) => codes.includes(e.code)).map((e) => ({
      code: e.code, serial: e.serial, brand: e.brand, model: e.model, power: e.power,
      loc: `${locLabel(state, e.locationId)} — ${locFull(state, e.locationId)}`,
      photo: e.photos?.[0],
    }));

  return (
    <Modal open={open} onClose={onClose} over="Entrée en stock — identité unique (règle n°1)" title="Enregistrer des équipements" wide>
      {done ? (
        <div className="anim-pop flex flex-col items-center gap-4 py-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e2f3ea] text-[#1d6b48]">
            <Icon name="check" className="h-7 w-7" strokeWidth={2.4} />
          </span>
          <div>
            <div className="font-display text-xl font-bold text-ink">
              {done.length} unité{done.length > 1 ? "s" : ""} enregistrée{done.length > 1 ? "s" : ""} en stock
            </div>
            <div className="mt-1 font-mono text-[12.5px] font-semibold text-tealdeep">
              {done[0]}{done.length > 1 ? ` → ${done[done.length - 1]}` : ""}
            </div>
            <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-mute">
              Identifiants définitifs, import tracé dans l'historique. Générez maintenant la planche
              d'étiquettes QR à coller sur les unités — ou sur les cartons à la réception.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => labelSheetPdf(labelsFor(done), "import")} className={btnPrimary}>
              <Icon name="qr" className="h-4 w-4" /> Générer la planche PDF des étiquettes
            </button>
            <button onClick={onClose} className={btnGhost}>Fermer</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap gap-1.5 rounded-xl border border-line bg-paper/70 p-1.5">
            {([
              ["single", "box", "Unité unique"],
              ["lot", "plus", "Entrée en lot"],
              ["csv", "download", "Import CSV fournisseur"],
            ] as const).map(([id, ic, lb]) => (
              <button key={id} onClick={() => setTab(id)} className={`btn-press flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-semibold ${tab === id ? "bg-ink text-frost" : "text-mute hover:text-ink"}`}>
                <Icon name={ic} className="h-4 w-4" /> {lb}
              </button>
            ))}
          </div>
          {tab === "single" && <SingleForm state={state} dispatch={dispatch} onSuccess={setDone} />}
          {tab === "lot" && <BatchForm state={state} dispatch={dispatch} onSuccess={setDone} />}
          {tab === "csv" && <CsvForm state={state} dispatch={dispatch} onSuccess={setDone} />}
        </>
      )}
    </Modal>
  );
}

/* ---------- onglet unité unique ---------- */

function SingleForm({ state, dispatch, onSuccess }: SubProps) {
  const [form, setForm] = useState({
    brand: "Hisense", model: "", serial: "", type: "Split mural", power: "1,5 CV",
    supplier: "", invoice: "", yearAcq: new Date().getFullYear(), warrantyEnd: "", locationId: stockLocation(state), responsible: "",
  });
  const [err, setErr] = useState("");
  const serialTaken = form.serial.trim() !== "" && state.equipment.some((e) => e.serial.toUpperCase() === form.serial.trim().toUpperCase());

  const submit = () => {
    if (!form.model.trim() || !form.serial.trim() || !form.responsible.trim()) { setErr("Modèle, n° série et responsable sont obligatoires."); return; }
    if (serialTaken) { setErr(`Le n° série ${form.serial.trim().toUpperCase()} est déjà attribué (règle n°1).`); return; }
    const y = new Date(); y.setFullYear(y.getFullYear() + 1);
    onSuccess(nextCodes(state.seq.eq, 1));
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
    setErr("");
  };

  return (
    <div>
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
          {serialTaken && <p className="mt-1 text-[11.5px] font-semibold text-danger">Ce n° série existe déjà dans le registre — doublon bloqué.</p>}
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
        <button onClick={submit} className={btnPrimary}><Icon name="check" className="h-4 w-4" /> Enregistrer la fiche</button>
      </div>
    </div>
  );
}

/* ---------- onglet entrée en lot ---------- */

function BatchForm({ state, dispatch, onSuccess }: SubProps) {
  const [b, setB] = useState({
    brand: "Hisense", model: "", kind: "Split mural", power: "1,5 CV", count: 5, serialPrefix: "",
    supplier: "", invoice: "", yearAcq: new Date().getFullYear(), locationId: stockLocation(state), responsible: "",
  });
  const [err, setErr] = useState("");
  const prefix = (b.serialPrefix.trim() || `${b.brand.slice(0, 3).toUpperCase()}${b.power.replace(/[^0-9]/g, "")}`).toUpperCase();
  const serialPreview = Array.from({ length: Math.min(3, Math.max(1, b.count || 1)) }, (_, i) => `${prefix}-${String(state.seq.eq + 1 + i).padStart(6, "0")}`);

  const submit = () => {
    if (!b.model.trim()) { setErr("Le modèle est obligatoire."); return; }
    if (!b.count || b.count < 1 || b.count > 50) { setErr("Quantité comprise entre 1 et 50 unités."); return; }
    onSuccess(nextCodes(state.seq.eq, b.count));
    dispatch({
      type: "BATCH_STOCK", brand: b.brand, model: b.model, kind: b.kind, power: b.power,
      supplier: b.supplier, invoice: b.invoice, yearAcq: b.yearAcq, locationId: b.locationId,
      responsible: b.responsible, count: b.count, serialPrefix: b.serialPrefix,
    });
    setErr("");
  };

  return (
    <div>
      <p className="mb-4 rounded-lg bg-icefrost/70 px-3 py-2.5 text-[12.5px] leading-relaxed text-tealdeep">
        <b>Arrivage groupé :</b> enregistrez plusieurs unités identiques d'un coup. Les n° de série sont
        générés automatiquement — à compléter ensuite fiche par fiche si le carton porte le vrai numéro constructeur.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Marque</label>
          <select value={b.brand} onChange={(e) => setB({ ...b, brand: e.target.value })} className={inputCls}>
            {["Hisense", "Samsung", "LG", "Daikin", "Midea", "TCL", "Nasco", "Haier", "Gree", "Panasonic"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Modèle *</label>
          <input value={b.model} onChange={(e) => setB({ ...b, model: e.target.value })} className={inputCls} placeholder="AS-12TW4" />
        </div>
        <div>
          <label className={labelCls}>Quantité *</label>
          <input type="number" min={1} max={50} value={b.count} onChange={(e) => setB({ ...b, count: +e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Type</label>
          <select value={b.kind} onChange={(e) => setB({ ...b, kind: e.target.value })} className={inputCls}>
            {["Split mural", "Cassette plafonnier", "Armoire de précision", "Console", "Gainable"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Puissance</label>
          <select value={b.power} onChange={(e) => setB({ ...b, power: e.target.value })} className={inputCls}>
            {["1 CV", "1,5 CV", "2 CV", "3 CV"].map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Préfixe série (optionnel)</label>
          <input value={b.serialPrefix} onChange={(e) => setB({ ...b, serialPrefix: e.target.value.toUpperCase() })} className={`${inputCls} font-mono`} placeholder="HIS15" />
        </div>
        <div>
          <label className={labelCls}>Fournisseur</label>
          <input value={b.supplier} onChange={(e) => setB({ ...b, supplier: e.target.value })} className={inputCls} placeholder="CFAO Équipement" />
        </div>
        <div>
          <label className={labelCls}>Réf. facture / BL</label>
          <input value={b.invoice} onChange={(e) => setB({ ...b, invoice: e.target.value })} className={inputCls} placeholder="FA-2026-…" />
        </div>
        <div>
          <label className={labelCls}>Année d'acquisition</label>
          <input type="number" value={b.yearAcq} onChange={(e) => setB({ ...b, yearAcq: +e.target.value })} className={inputCls} min={2010} max={2030} />
        </div>
        <div>
          <label className={labelCls}>Local de stockage</label>
          <select value={b.locationId} onChange={(e) => setB({ ...b, locationId: e.target.value })} className={inputCls}>
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
          <label className={labelCls}>Responsable du stock</label>
          <input value={b.responsible} onChange={(e) => setB({ ...b, responsible: e.target.value })} className={inputCls} placeholder="Nom" />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-linedark bg-paper/70 px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">Aperçu des n° série générés</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {serialPreview.map((sn) => <span key={sn} className="rounded bg-card px-2 py-1 font-mono text-[11px] font-semibold text-tealdeep ring-1 ring-line">{sn}</span>)}
          {b.count > 3 && <span className="px-1 py-1 font-mono text-[11px] text-faint">… +{b.count - 3} autres</span>}
        </div>
      </div>

      {err && <p className="mt-3 rounded-lg bg-[#fadfda] px-3 py-2 text-[12.5px] font-medium text-[#9e3327]">{err}</p>}
      <div className="mt-5 flex justify-end">
        <button onClick={submit} className={btnPrimary}>
          <Icon name="box" className="h-4 w-4" /> Créer {b.count || 0} unité{b.count > 1 ? "s" : ""} en stock
        </button>
      </div>
    </div>
  );
}

/* ---------- onglet import CSV ---------- */

function CsvForm({ state, dispatch, onSuccess }: SubProps) {
  const [rows, setRows] = useState<CsvRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [parseErr, setParseErr] = useState("");
  const [locId, setLocId] = useState(stockLocation(state));

  const errorsFor = (r: CsvRow, i: number): string[] => {
    if (!rows) return [];
    const errs: string[] = [];
    if (!r.serial) errs.push("n° série manquant");
    else {
      if (rows.slice(0, i).some((x) => x.serial && x.serial === r.serial)) errs.push("doublon dans le fichier");
      if (state.equipment.some((e) => e.serial.toUpperCase() === r.serial)) errs.push("déjà dans le registre");
    }
    if (!r.brand) errs.push("marque manquante");
    if (!r.model) errs.push("modèle manquant");
    return errs;
  };
  const validCount = rows ? rows.filter((r, i) => errorsFor(r, i).length === 0).length : 0;

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setParseErr("");
    try {
      const parsed = parseCsv(await f.text());
      if (parsed.length === 0) setParseErr("Fichier non reconnu — attendu : un en-tête contenant une colonne « serial » (ou numero_serie, sn…) puis une ligne par unité, séparateur « ; » ou « , ».");
      else { setRows(parsed); setFileName(f.name); }
    } catch {
      setParseErr("Impossible de lire ce fichier.");
    }
  };

  const submit = () => {
    if (!rows || validCount === 0) return;
    const valid = rows.filter((r, i) => errorsFor(r, i).length === 0);
    onSuccess(nextCodes(state.seq.eq, valid.length));
    dispatch({ type: "IMPORT_CSV", items: valid, fileName, locationId: locId, responsible: "" });
  };

  return (
    <div>
      {!rows ? (
        <div>
          <label className="btn-press flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-linedark bg-paper/60 px-6 py-10 text-center hover:border-teal hover:bg-icefrost/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-icefrost text-tealdeep"><Icon name="download" className="h-6 w-6" /></span>
            <span>
              <span className="block font-display text-[15px] font-bold text-ink">Chargez le fichier fournisseur</span>
              <span className="mt-1 block text-[12.5px] text-mute">CSV ou TXT · colonnes : serial ; marque ; modele ; puissance ; fournisseur ; facture</span>
            </span>
            <input type="file" accept=".csv,.txt,text/csv" className="hidden" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {parseErr && <p className="mt-3 rounded-lg bg-[#fadfda] px-3 py-2.5 text-[12.5px] font-medium text-[#9e3327]">{parseErr}</p>}
          <div className="mt-4 rounded-lg bg-ink px-4 py-3">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-frost/60">Modèle de fichier</div>
            <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] leading-relaxed text-frost">{`serial;marque;modele;puissance;fournisseur;facture
SN-HIS-7741201;Hisense;AS-12TW4;1,5 CV;CFAO Équipement;FA-2026-118
SN-HIS-7741202;Hisense;AS-12TW4;1,5 CV;CFAO Équipement;FA-2026-118`}</pre>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-icefrost px-2 py-1 font-mono text-[11px] font-bold text-tealdeep">{fileName}</span>
              <span className="text-[12.5px] text-mute">{rows.length} ligne{rows.length > 1 ? "s" : ""} détectée{rows.length > 1 ? "s" : ""}</span>
            </div>
            <button onClick={() => { setRows(null); setFileName(""); }} className={`${btnGhost} !px-3 !py-1.5 text-[12px]`}>
              <Icon name="x" className="h-3.5 w-3.5" /> Changer de fichier
            </button>
          </div>

          {/* aperçu avant import */}
          <div className="max-h-64 overflow-auto rounded-lg border border-line">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-paper/95 backdrop-blur">
                <tr className="border-b border-line font-mono text-[9.5px] uppercase tracking-[0.16em] text-mute">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">N° série</th>
                  <th className="px-3 py-2">Marque</th>
                  <th className="px-3 py-2">Modèle</th>
                  <th className="px-3 py-2">Validation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const errs = errorsFor(r, i);
                  const ok = errs.length === 0;
                  return (
                    <tr key={i} className={`border-b border-line/60 last:border-0 ${ok ? "" : "bg-[#fadfda]/40"}`}>
                      <td className="px-3 py-2 font-mono text-[11px] text-faint">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-[11.5px] font-semibold text-tealdeep">{r.serial || "—"}</td>
                      <td className="px-3 py-2 text-[12px] text-body">{r.brand || "—"}</td>
                      <td className="px-3 py-2 text-[12px] text-body">{r.model || "—"}</td>
                      <td className="px-3 py-2">
                        {ok ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#e2f3ea] px-2 py-0.5 text-[10.5px] font-semibold text-[#1d6b48]">
                            <Icon name="check" className="h-3 w-3" strokeWidth={2.6} /> valide
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#fadfda] px-2 py-0.5 text-[10.5px] font-semibold text-[#9e3327]">
                            <Icon name="alert" className="h-3 w-3" /> {errs.join(" · ")}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Local de stockage à la réception</label>
              <select value={locId} onChange={(e) => setLocId(e.target.value)} className={inputCls}>
                {state.sites.map((st) => (
                  <optgroup key={st.id} label={`${st.city} — ${st.name}`}>
                    {state.locations.filter((l) => l.siteId === st.id).map((l) => (
                      <option key={l.id} value={l.id}>{l.building} / {l.floor} / {l.room}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <p className="rounded-lg bg-paper px-3 py-2.5 text-[12px] leading-relaxed text-mute">
                <b className="text-body">{validCount}</b> ligne{validCount > 1 ? "s" : ""} valide{validCount > 1 ? "s" : ""} — les lignes en erreur
                seront écartées <b className="text-body">sans créer d'équipement douteux</b>.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={submit} disabled={validCount === 0} className={btnPrimary}>
              <Icon name="check" className="h-4 w-4" /> Importer {validCount} unité{validCount > 1 ? "s" : ""}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
