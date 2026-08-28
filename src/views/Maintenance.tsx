import { useEffect, useMemo, useState } from "react";
import { useStore, fmtDate, fmtFCFA, locLabel, daysUntil } from "../store";
import { INTERVENTION_META, perms, type InterventionType } from "../types";
import { Icon } from "../components/icons";
import { Overline, Reveal, CountUp, Modal, EmptyState, btnPrimary, btnGhost, inputCls, labelCls } from "../components/ui";

export default function Maintenance({ param }: { param?: string }) {
  const { state: s, me } = useStore();
  const p = perms(me?.role);
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [preselect, setPreselect] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (param) {
      setShowNew(true);
      setPreselect(param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.interventions.filter((i) => {
      const e = s.equipment.find((x) => x.id === i.equipmentId);
      if (!needle) return true;
      return `${i.code} ${e?.code} ${e?.brand} ${e?.model} ${i.technician} ${i.action}`.toLowerCase().includes(needle);
    });
  }, [s, q]);

  const totalCost = s.interventions.reduce((a, b) => a + b.cost, 0);
  const overdue = s.equipment.filter((e) => e.nextMaintenance && !["reforme", "perdu"].includes(e.status) && daysUntil(e.nextMaintenance) < 0).length;
  const soon = s.equipment.filter((e) => e.nextMaintenance && !["reforme", "perdu"].includes(e.status) && daysUntil(e.nextMaintenance) >= 0 && daysUntil(e.nextMaintenance) <= 15).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline className="text-teal">Module maintenance</Overline>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Interventions techniques</h1>
          <p className="mt-1.5 text-sm text-mute">Chaque intervention est consignée avec coût, pièces et prochaine échéance préventive.</p>
        </div>
        <button onClick={() => { setPreselect(undefined); setShowNew(true); }} disabled={!p.intervene} className={btnPrimary} title={!p.intervene ? "Réservé technicien / gestionnaire / admin" : ""}>
          <Icon name="wrench" className="h-4 w-4" /> Consigner une intervention
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Interventions consignées", value: s.interventions.length, icon: "wrench", tone: "bg-icefrost text-tealdeep" },
          { label: "Coût cumulé du parc", value: totalCost, money: true, icon: "report", tone: "bg-[#e4ecf0] text-[#46636e]" },
          { label: "Maintenances en retard", value: overdue, icon: "alert", tone: "bg-[#fadfda] text-[#9e3327]" },
          { label: "Échéances sous 15 jours", value: soon, icon: "clock", tone: "bg-[#fbeed3] text-[#8a5b06]" },
        ].map((k, i) => (
          <Reveal key={k.label} delay={i * 60}>
            <div className="card-hover rounded-xl border border-line bg-card p-5">
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${k.tone}`}><Icon name={k.icon} className="h-4.5 w-4.5" /></span>
              <div className="mt-3 font-display text-3xl font-bold tracking-tight text-ink">
                {k.money ? <CountUp value={k.value} /> : <CountUp value={k.value} />}
                {k.money && <span className="ml-1 text-sm font-semibold text-mute">FCFA</span>}
              </div>
              <div className="mt-0.5 text-[12.5px] font-medium text-mute">{k.label}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer par équipement, technicien, code…" className={`${inputCls} pl-9`} />
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-line bg-paper/70 font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Équipement</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Intervention</th>
                  <th className="px-4 py-3">Technicien</th>
                  <th className="px-4 py-3 text-right">Coût</th>
                  <th className="px-4 py-3">Résultat</th>
                  <th className="px-4 py-3">Prochaine</th>
                </tr>
              </thead>
              <tbody>
                {list.map((i) => {
                  const e = s.equipment.find((x) => x.id === i.equipmentId);
                  const d = i.nextDate ? daysUntil(i.nextDate) : null;
                  return (
                    <tr key={i.id} className="row-live border-b border-line/70 last:border-0">
                      <td className="px-4 py-3 font-mono text-[12px] font-semibold text-tealdeep">{i.code}</td>
                      <td className="px-4 py-3 text-[12.5px] text-body">{fmtDate(i.date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-[12px] font-semibold text-body">{e?.code}</div>
                        <div className="text-[11.5px] text-mute">{e?.brand} {e?.model} · {e ? locLabel(s, e.locationId) : ""}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${INTERVENTION_META[i.type].chip}`}>{INTERVENTION_META[i.type].label}</span>
                      </td>
                      <td className="max-w-[260px] px-4 py-3">
                        {i.issue && <div className="text-[11px] text-mute">⌁ {i.issue}</div>}
                        <div className="text-[12.5px] text-body">{i.action}</div>
                        {i.parts && <div className="text-[11px] text-faint">Pièces : {i.parts}</div>}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-body">{i.technician}</td>
                      <td className="px-4 py-3 text-right font-mono text-[12.5px] font-semibold text-ink">{i.cost ? fmtFCFA(i.cost) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[12px] font-semibold ${i.result.toLowerCase().includes("opérationnel") ? "text-leaf" : i.result.toLowerCase().includes("attente") ? "text-amber" : "text-orange"}`}>{i.result}</span>
                      </td>
                      <td className="px-4 py-3">
                        {i.nextDate ? (
                          <div>
                            <div className="text-[12px] text-body">{fmtDate(i.nextDate)}</div>
                            {d !== null && (
                              <div className={`font-mono text-[10.5px] font-semibold ${d < 0 ? "text-danger" : d <= 15 ? "text-amber" : "text-faint"}`}>
                                {d < 0 ? `retard ${Math.abs(d)} j` : `J-${d}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[12px] text-faint">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {list.length === 0 && (
            <div className="p-6"><EmptyState icon="wrench" title="Aucune intervention" sub="Consignez la première intervention technique pour alimenter l'historique préventif." /></div>
          )}
        </div>
      </Reveal>

      <NewInterventionModal open={showNew} onClose={() => setShowNew(false)} preselect={preselect} />
    </div>
  );
}

function NewInterventionModal({ open, onClose, preselect }: { open: boolean; onClose: () => void; preselect?: string }) {
  const { state: s, dispatch, me } = useStore();
  const [f, setF] = useState({ equipmentId: "", kind: "preventive" as InterventionType, issue: "", action: "", parts: "", cost: 0, result: "Opérationnel", nextDate: "" });
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) { setF((x) => ({ ...x, equipmentId: preselect ?? "", issue: "", action: "", parts: "", cost: 0, result: "Opérationnel", nextDate: "" })); setErr(""); }
  }, [open, preselect]);

  const submit = () => {
    if (!f.equipmentId || f.action.trim().length < 5) { setErr("Équipement et description d'intervention (5 caractères min.) requis."); return; }
    dispatch({
      type: "ADD_INTERVENTION", equipmentId: f.equipmentId, kind: f.kind, issue: f.issue.trim(), action: f.action.trim(),
      parts: f.parts.trim(), cost: f.cost, result: f.result,
      nextDate: f.nextDate ? new Date(f.nextDate).toISOString() : undefined,
    });
    onClose();
  };

  const nextDefault = () => {
    const d = new Date(); d.setDate(d.getDate() + 90);
    return d.toISOString().slice(0, 10);
  };

  return (
    <Modal open={open} onClose={onClose} over={`Technicien : ${me?.name ?? "—"}`} title="Nouvelle intervention" wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Équipement *</label>
          <select value={f.equipmentId} onChange={(e) => setF({ ...f, equipmentId: e.target.value })} className={inputCls}>
            <option value="">— Sélectionner —</option>
            {s.equipment.filter((e) => e.status !== "reforme").map((e) => (
              <option key={e.id} value={e.id}>{e.code} · {e.brand} {e.model} · {locLabel(s, e.locationId)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Type d'intervention</label>
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as InterventionType })} className={inputCls}>
            {Object.entries(INTERVENTION_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Problème constaté</label>
          <input value={f.issue} onChange={(e) => setF({ ...f, issue: e.target.value })} className={inputCls} placeholder="Ex. : faible refroidissement" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Travaux réalisés *</label>
          <textarea value={f.action} onChange={(e) => setF({ ...f, action: e.target.value })} rows={2} className={`${inputCls} resize-none`} placeholder="Ex. : nettoyage complet + contrôle pression" />
        </div>
        <div>
          <label className={labelCls}>Pièces remplacées</label>
          <input value={f.parts} onChange={(e) => setF({ ...f, parts: e.target.value })} className={inputCls} placeholder="Filtre, fluide…" />
        </div>
        <div>
          <label className={labelCls}>Coût (FCFA)</label>
          <input type="number" min={0} step={500} value={f.cost || ""} onChange={(e) => setF({ ...f, cost: +e.target.value })} className={inputCls} placeholder="15000" />
        </div>
        <div>
          <label className={labelCls}>Résultat</label>
          <select value={f.result} onChange={(e) => setF({ ...f, result: e.target.value })} className={inputCls}>
            {["Opérationnel", "En attente pièce", "En réparation", "Hors service"].map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Prochaine maintenance</label>
          <input type="date" value={f.nextDate} onChange={(e) => setF({ ...f, nextDate: e.target.value })} className={inputCls} />
          <button onClick={() => setF({ ...f, nextDate: nextDefault() })} className="mt-1 text-[11px] font-semibold text-tealdeep hover:underline">Préconiser +90 jours</button>
        </div>
      </div>
      {err && <p className="mt-3 rounded-lg bg-[#fadfda] px-3 py-2 text-[12.5px] font-medium text-[#9e3327]">{err}</p>}
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <button onClick={onClose} className={btnGhost}>Annuler</button>
        <button onClick={submit} className={btnPrimary}><Icon name="check" className="h-4 w-4" /> Consigner au journal</button>
      </div>
    </Modal>
  );
}
