import { useMemo, useState } from "react";
import { useStore, fmtDateTime, fmtDate, locLabel, siteLabel } from "../store";
import { STATUS_META } from "../types";
import { Icon } from "../components/icons";
import { Overline, Reveal, RoleBadge, EmptyState, btnGhost } from "../components/ui";

/* ==================== JOURNAL D'AUDIT ==================== */

export function AuditView({ onNav }: { onNav: (v: string, p?: string) => void }) {
  const { state: s } = useStore();
  const [fAction, setFAction] = useState("all");
  const [q, setQ] = useState("");

  const actions = useMemo(() => [...new Set(s.audit.map((a) => a.action))].sort(), [s.audit]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.audit.filter((a) => (fAction === "all" || a.action === fAction) && (!needle || `${a.user} ${a.entityId} ${a.detail}`.toLowerCase().includes(needle)));
  }, [s.audit, fAction, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline className="text-teal">Piste d'audit — règle n°8</Overline>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Journal inaltérable</h1>
          <p className="mt-1.5 text-sm text-mute">
            {s.audit.length} écritures · chaque opération importante est horodatée et attribuée. Aucune suppression possible.
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-mute">
          <Icon name="lock" className="h-4 w-4 text-tealdeep" /> écriture seule · lecture verrouillée
        </span>
      </div>

      <Reveal>
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-line bg-card p-3.5">
          <div className="relative min-w-[220px] flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Utilisateur, équipement, détail…" className="w-full rounded-lg border border-linedark bg-white py-2.5 pl-9 pr-3 text-sm focus:border-teal" />
          </div>
          <select value={fAction} onChange={(e) => setFAction(e.target.value)} className="rounded-lg border border-linedark bg-white px-3 py-2.5 text-sm">
            <option value="all">Toutes les actions</option>
            {actions.map((a) => <option key={a}>{a}</option>)}
          </select>
          <span className="ml-auto font-mono text-xs text-mute">{list.length} écriture{list.length > 1 ? "s" : ""}</span>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-line bg-paper/70 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                  <th className="px-4 py-3">Horodatage</th>
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entité</th>
                  <th className="px-4 py-3">Détail</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} className="row-live border-b border-line/70 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[11.5px] text-mute">{fmtDateTime(a.at)}</td>
                    <td className="px-4 py-3">
                      <div className="text-[12.5px] font-semibold text-body">{a.user}</div>
                      <RoleBadge r={a.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded bg-icefrost px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-tealdeep">{a.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11.5px] text-mute">{a.entity}</div>
                      {a.entityId.startsWith("CLM-") ? (
                        <button onClick={() => onNav("equipments", a.entityId)} className="font-mono text-[12px] font-semibold text-tealdeep hover:underline">{a.entityId}</button>
                      ) : (
                        <span className="font-mono text-[12px] font-semibold text-body">{a.entityId}</span>
                      )}
                    </td>
                    <td className="max-w-[420px] px-4 py-3 text-[12.5px] leading-relaxed text-body">{a.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <div className="p-6"><EmptyState icon="scroll" title="Aucune écriture" sub="Modifiez vos filtres pour retrouver des événements." /></div>}
        </div>
      </Reveal>
    </div>
  );
}

/* ==================== RAPPORTS & EXPORTS ==================== */

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `climatrice_${name}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ReportsView({ onToast }: { onToast: (m: string) => void }) {
  const { state: s } = useStore();
  const [siteId, setSiteId] = useState(s.sites[0]?.id ?? "");

  const eqRow = (e: (typeof s.equipment)[number]) => [
    e.code, e.serial, e.brand, e.model, e.type, e.power, STATUS_META[e.status].label,
    siteLabel(s, s.locations.find((l) => l.id === e.locationId)?.siteId ?? ""), locLabel(s, e.locationId),
    e.responsible, fmtDate(e.lastMaintenance), fmtDate(e.nextMaintenance), e.supplier, e.invoice,
  ];

  const reports = [
    {
      id: "inventaire", icon: "clipboard", title: "Rapport d'inventaire complet",
      desc: "Liste exhaustive du parc : identité, statut, localisation, responsable, maintenance.",
      count: s.equipment.length,
      run: () => { downloadCsv("inventaire_complet", [["Code", "N° série", "Marque", "Modèle", "Type", "Puissance", "Statut", "Site", "Emplacement", "Responsable", "Dernière maintenance", "Prochaine", "Fournisseur", "Facture"], ...s.equipment.map(eqRow)]); onToast("Rapport d'inventaire exporté (CSV)."); },
    },
    {
      id: "site", icon: "building", title: "Rapport par site",
      desc: "Tous les climatiseurs rattachés au site sélectionné ci-contre.",
      count: s.equipment.filter((e) => s.locations.find((l) => l.id === e.locationId)?.siteId === siteId).length,
      run: () => { downloadCsv(`par_site_${siteId}`, [["Code", "N° série", "Marque", "Modèle", "Type", "Puissance", "Statut", "Site", "Emplacement", "Responsable", "Dernière maintenance", "Prochaine", "Fournisseur", "Facture"], ...s.equipment.filter((e) => s.locations.find((l) => l.id === e.locationId)?.siteId === siteId).map(eqRow)]); onToast("Rapport par site exporté (CSV)."); },
    },
    {
      id: "mouvements", icon: "swap", title: "Rapport des mouvements",
      desc: "Tous les transferts : demandeur, validateur, transporteur, réceptionnaire, dates, motif.",
      count: s.transfers.length,
      run: () => {
        downloadCsv("mouvements", [["Référence", "Équipement", "Départ", "Destination", "Statut", "Demandeur", "Validateur", "Transporteur", "Réceptionnaire", "Demandé le", "Validé le", "Expédié le", "Reçu le", "Motif", "Motif de refus"],
        ...s.transfers.map((t) => [t.code, s.equipment.find((e) => e.id === t.equipmentId)?.code ?? "", locLabel(s, t.fromLocationId), locLabel(s, t.toLocationId), t.status, t.requester, t.approver ?? "", t.transporter ?? "", t.receiver ?? "", fmtDate(t.requestedAt), fmtDate(t.approvedAt), fmtDate(t.shippedAt), fmtDate(t.receivedAt), t.reason, t.rejectReason ?? ""])]);
        onToast("Rapport des mouvements exporté (CSV).");
      },
    },
    {
      id: "pannes", icon: "alert", title: "Équipements hors service & en panne",
      desc: "Unités hors service, en réparation ou perdues — base du plan de remplacement.",
      count: s.equipment.filter((e) => ["hors_service", "reparation", "perdu"].includes(e.status)).length,
      run: () => { downloadCsv("hors_service", [["Code", "N° série", "Marque", "Modèle", "Type", "Puissance", "Statut", "Site", "Emplacement", "Responsable", "Dernière maintenance", "Prochaine", "Fournisseur", "Facture"], ...s.equipment.filter((e) => ["hors_service", "reparation", "perdu"].includes(e.status)).map(eqRow)]); onToast("Rapport hors service exporté (CSV)."); },
    },
    {
      id: "anomalies", icon: "alert", title: "Rapport des anomalies",
      desc: "Anomalies de localisation, équipements introuvables et régularisations.",
      count: s.anomalies.length,
      run: () => {
        downloadCsv("anomalies", [["Référence", "Équipement", "Type", "Statut", "Emplacement attendu", "Emplacement observé", "Détail", "Déclarée par", "Le", "Résolution"],
        ...s.anomalies.map((a) => [a.code, s.equipment.find((e) => e.id === a.equipmentId)?.code ?? "", a.type, a.status, locLabel(s, a.expectedLocationId), a.observedLocationId ? locLabel(s, a.observedLocationId) : "", a.detail, a.declaredBy, fmtDate(a.declaredAt), a.resolution ?? ""])]);
        onToast("Rapport des anomalies exporté (CSV).");
      },
    },
    {
      id: "maintenance", icon: "wrench", title: "Rapport des interventions",
      desc: "Historique technique complet avec coûts cumulés en FCFA.",
      count: s.interventions.length,
      run: () => {
        downloadCsv("interventions", [["Code", "Date", "Équipement", "Type", "Problème", "Travaux", "Pièces", "Coût FCFA", "Technicien", "Résultat", "Prochaine"],
        ...s.interventions.map((i) => [i.code, fmtDate(i.date), s.equipment.find((e) => e.id === i.equipmentId)?.code ?? "", i.type, i.issue ?? "", i.action, i.parts ?? "", i.cost, i.technician, i.result, fmtDate(i.nextDate)])]);
        onToast("Rapport des interventions exporté (CSV).");
      },
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Overline className="text-teal">Module rapports</Overline>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Extraits & exports</h1>
        <p className="mt-1.5 text-sm text-mute">
          Exports CSV compatibles Excel (séparateur « ; », encodage UTF-8). Générés à l'instant T depuis le registre.
        </p>
      </div>

      <Reveal>
        <div className="grid gap-3">
          {reports.map((r) => (
            <div key={r.id} className="card-hover flex flex-wrap items-center gap-4 rounded-xl border border-line bg-card px-5 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ink text-frost">
                <Icon name={r.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display text-[15.5px] font-bold text-ink">{r.title}</h3>
                  <span className="rounded-full bg-icefrost px-2 py-0.5 font-mono text-[10.5px] font-semibold text-tealdeep">{r.count} lignes</span>
                </div>
                <p className="mt-0.5 text-[12.5px] text-mute">{r.desc}</p>
              </div>
              {r.id === "site" && (
                <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="rounded-lg border border-linedark bg-white px-3 py-2 text-sm">
                  {s.sites.map((x) => <option key={x.id} value={x.id}>{x.city} — {x.name}</option>)}
                </select>
              )}
              <button onClick={r.run} className={btnGhost}>
                <Icon name="download" className="h-4 w-4" /> Exporter CSV
              </button>
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 rounded-xl border border-line bg-ink px-5 py-4 text-[12px] text-paper/70">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-frost">Indicateurs de gestion</span>
          <span>Parc : <b className="text-frost">{s.equipment.length}</b></span>
          <span>En panne : <b className="text-frost">{s.equipment.filter((e) => ["hors_service", "reparation"].includes(e.status)).length}</b></span>
          <span>Coût réparations : <b className="text-frost">{s.interventions.reduce((a, b) => a + b.cost, 0).toLocaleString("fr-FR")} FCFA</b></span>
          <span>Transferts : <b className="text-frost">{s.transfers.length}</b></span>
          <span>Non localisés : <b className="text-frost">{s.equipment.filter((e) => ["perdu", "a_verifier"].includes(e.status)).length}</b></span>
        </div>
      </Reveal>
    </div>
  );
}
