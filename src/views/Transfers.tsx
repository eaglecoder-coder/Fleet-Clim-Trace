import { useEffect, useMemo, useState } from "react";
import { useStore, fmtDate, fmtDateTime, locLabel, locFull, siteLabel, isTransferActive } from "../store";
import { perms, type Transfer } from "../types";
import { Icon } from "../components/icons";
import { Overline, Reveal, TransferBadge, Modal, Stepper, EmptyState, btnPrimary, btnGhost, btnDanger, inputCls, labelCls, type Step } from "../components/ui";

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "demande", label: "À valider" },
  { id: "valide", label: "Validés" },
  { id: "transit", label: "En transit" },
  { id: "cloture", label: "Clôturés" },
  { id: "rejete", label: "Refusés" },
];

function stepsOf(t: Transfer): Step[] {
  /* phase = nombre d'étapes franchies (la demande déposée compte comme acquise) */
  const phase =
    t.status === "rejete" ? 1 : t.status === "demande" ? 1 : t.status === "valide" ? 2 : t.status === "transit" ? 3 : 4;
  const mk = (i: number, label: string, meta?: string): Step =>
    t.status === "rejete"
      ? { label, meta, state: i === 0 ? "done" : i === 1 ? "rejected" : "pending" }
      : { label, meta, state: i < phase ? "done" : i === phase ? "current" : "pending" };
  return [
    mk(0, "Demande", fmtDate(t.requestedAt)),
    mk(1, "Validation", t.approvedAt ? fmtDate(t.approvedAt) : undefined),
    mk(2, "Expédition", t.shippedAt ? fmtDate(t.shippedAt) : undefined),
    mk(3, "Réception", t.receivedAt ? fmtDate(t.receivedAt) : undefined),
  ];
}

export default function Transfers({ param, clearParam }: { param?: string; clearParam: () => void }) {
  const { state: s, dispatch, me } = useStore();
  const p = perms(me?.role);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [preselect, setPreselect] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!param) return;
    if (param.startsWith("new")) {
      setShowNew(true);
      setPreselect(param.split(":")[1] || undefined);
    } else {
      const t = s.transfers.find((x) => x.code === param);
      if (t) setExpanded(t.id);
    }
    clearParam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param]);

  const list = useMemo(
    () => [...s.transfers].sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1)).filter((t) => filter === "all" || t.status === filter),
    [s.transfers, filter]
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    s.transfers.forEach((t) => (m[t.status] = (m[t.status] ?? 0) + 1));
    return m;
  }, [s.transfers]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline className="text-teal">Module transferts</Overline>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Mouvements d'équipements</h1>
          <p className="mt-1.5 text-sm text-mute">
            Règle n°4 — tout déplacement génère un transfert. L'emplacement officiel ne bascule qu'à la réception confirmée (règle n°7).
          </p>
        </div>
        <button onClick={() => { setPreselect(undefined); setShowNew(true); }} disabled={!p.request} className={btnPrimary} title={!p.request ? "Lecture seule" : ""}>
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} /> Nouveau transfert
        </button>
      </div>

      <Reveal>
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-card p-2">
          {FILTERS.map((f) => {
            const n = f.id === "all" ? s.transfers.length : counts[f.id] ?? 0;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`btn-press flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold ${filter === f.id ? "bg-ink text-frost" : "text-mute hover:bg-paper hover:text-ink"}`}
              >
                {f.label}
                <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${filter === f.id ? "bg-frost/20 text-frost" : "bg-paper text-mute"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {list.length === 0 ? (
        <Reveal><EmptyState icon="swap" title="Aucun transfert dans cette vue" sub="Créez une demande : elle suivra le circuit Demande → Validation → Expédition → Réception → Clôture." /></Reveal>
      ) : (
        <div className="space-y-3">
          {list.map((t, i) => {
            const e = s.equipment.find((x) => x.id === t.equipmentId);
            const open = expanded === t.id;
            return (
              <Reveal key={t.id} delay={Math.min(i * 50, 200)}>
                <div className={`overflow-hidden rounded-xl border bg-card transition-colors ${open ? "border-teal/60 shadow-md" : "border-line"}`}>
                  <button onClick={() => setExpanded(open ? null : t.id)} className="btn-press block w-full px-5 py-4 text-left">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className="font-mono text-[13px] font-bold text-tealdeep">{t.code}</span>
                      <TransferBadge s={t.status} />
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-[13.5px]">
                        <span className="font-mono font-semibold text-body">{e?.code}</span>
                        <span className="hidden text-mute sm:inline">{e?.brand} {e?.model}</span>
                        <span className="mx-1 hidden truncate text-body sm:block">{locLabel(s, t.fromLocationId)}</span>
                        <Icon name="arrow" className="h-4 w-4 shrink-0 text-teal" />
                        <span className="hidden truncate text-body sm:block">{locLabel(s, t.toLocationId)}</span>
                      </span>
                      <span className="font-mono text-[11px] text-faint">{fmtDate(t.requestedAt)}</span>
                      <Icon name="chevD" className={`h-4 w-4 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {open && e && (
                    <div className="anim-fade-up border-t border-line bg-paper/50 px-5 py-5">
                      <div className="mb-5 rounded-xl border border-line bg-card px-5 py-4">
                        <Stepper steps={stepsOf(t)} />
                      </div>
                      <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-xl border border-line bg-card p-4 lg:col-span-2">
                          <Overline className="text-teal">Traçabilité du mouvement</Overline>
                          <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2.5 text-[13px] sm:grid-cols-3">
                            <div><dt className="font-mono text-[9.5px] uppercase tracking-wider text-faint">Équipement</dt><dd className="font-medium text-body">{e.code} · {e.brand} {e.model}</dd></div>
                            <div><dt className="font-mono text-[9.5px] uppercase tracking-wider text-faint">N° série</dt><dd className="font-mono text-body">{e.serial}</dd></div>
                            <div><dt className="font-mono text-[9.5px] uppercase tracking-wider text-faint">Demandeur</dt><dd className="font-medium text-body">{t.requester}</dd></div>
                            <div><dt className="font-mono text-[9.5px] uppercase tracking-wider text-faint">Validateur</dt><dd className="font-medium text-body">{t.approver ?? "—"}</dd></div>
                            <div><dt className="font-mono text-[9.5px] uppercase tracking-wider text-faint">Transporteur</dt><dd className="font-medium text-body">{t.transporter ?? "—"}</dd></div>
                            <div><dt className="font-mono text-[9.5px] uppercase tracking-wider text-faint">Réceptionnaire</dt><dd className="font-medium text-body">{t.receiver ?? "—"}</dd></div>
                          </dl>
                          <div className="mt-3 border-t border-dashed border-linedark pt-3 text-[13px]">
                            <span className="font-mono text-[9.5px] uppercase tracking-wider text-faint">Motif — </span>
                            <span className="text-body">{t.reason}</span>
                          </div>
                          {t.rejectReason && (
                            <div className="mt-2 rounded-lg bg-[#fadfda]/70 px-3 py-2 text-[12.5px] text-[#9e3327]">
                              <b>Motif du refus :</b> {t.rejectReason}
                            </div>
                          )}
                          <div className="mt-3 grid gap-2 text-[12.5px] text-mute sm:grid-cols-2">
                            <div className="rounded-lg bg-paper px-3 py-2"><b className="text-body">Départ</b> — {siteLabel(s, s.locations.find((l) => l.id === t.fromLocationId)?.siteId ?? "")} · {locFull(s, t.fromLocationId)}</div>
                            <div className="rounded-lg bg-paper px-3 py-2"><b className="text-body">Destination</b> — {siteLabel(s, s.locations.find((l) => l.id === t.toLocationId)?.siteId ?? "")} · {locFull(s, t.toLocationId)}</div>
                          </div>
                        </div>
                        <WorkflowPanel t={t} p={p} meName={me?.name ?? ""} dispatch={dispatch} />
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      <NewTransferModal open={showNew} onClose={() => setShowNew(false)} preselect={preselect} />
    </div>
  );
}

function WorkflowPanel({ t, p, meName, dispatch }: { t: Transfer; p: ReturnType<typeof perms>; meName: string; dispatch: ReturnType<typeof useStore>["dispatch"] }) {
  const [rejectReason, setRejectReason] = useState("");
  const [transporter, setTransporter] = useState("Transport Ets Koffi");
  const [receiver, setReceiver] = useState(meName);
  const [rejecting, setRejecting] = useState(false);

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <Overline className="text-teal">Action requise</Overline>
      {t.status === "demande" && (
        <div className="mt-3 space-y-2.5">
          <p className="text-[12.5px] text-mute">Autoriser ce mouvement ? L'emplacement officiel ne changera qu'après réception.</p>
          <button disabled={!p.approve} onClick={() => dispatch({ type: "APPROVE_TRANSFER", id: t.id })} className={`${btnPrimary} w-full justify-center`}>
            <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> Valider la demande
          </button>
          {!rejecting ? (
            <button disabled={!p.approve} onClick={() => setRejecting(true)} className={`${btnGhost} w-full justify-center`}>
              <Icon name="x" className="h-4 w-4" /> Refuser…
            </button>
          ) : (
            <div className="space-y-2">
              <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className={inputCls} placeholder="Motif du refus (obligatoire)" />
              <button
                disabled={rejectReason.trim().length === 0}
                onClick={() => { dispatch({ type: "REJECT_TRANSFER", id: t.id, reason: rejectReason.trim() }); setRejecting(false); }}
                className={`${btnDanger} w-full justify-center`}
              >
                Confirmer le refus motivé
              </button>
            </div>
          )}
          {!p.approve && <p className="text-[11px] text-faint">Validation réservée aux rôles administrateur / gestionnaire.</p>}
        </div>
      )}
      {t.status === "valide" && (
        <div className="mt-3 space-y-2.5">
          <label className={labelCls}>Transporteur / convoyeur</label>
          <input value={transporter} onChange={(e) => setTransporter(e.target.value)} className={inputCls} />
          <button disabled={!p.ship || transporter.trim().length === 0} onClick={() => dispatch({ type: "SHIP_TRANSFER", id: t.id, transporter: transporter.trim() })} className={`${btnPrimary} w-full justify-center`}>
            <Icon name="truck" className="h-4 w-4" /> Expédier — passer « En transfert »
          </button>
          {!p.ship && <p className="text-[11px] text-faint">Expédition réservée administrateur / gestionnaire.</p>}
        </div>
      )}
      {t.status === "transit" && (
        <div className="mt-3 space-y-2.5">
          <label className={labelCls}>Reçu par</label>
          <input value={receiver} onChange={(e) => setReceiver(e.target.value)} className={inputCls} />
          <button disabled={!p.receive || receiver.trim().length === 0} onClick={() => dispatch({ type: "RECEIVE_TRANSFER", id: t.id, receiver: receiver.trim() })} className={`${btnPrimary} w-full justify-center`}>
            <Icon name="box" className="h-4 w-4" /> Confirmer la réception
          </button>
          <p className="rounded-lg bg-icefrost/70 px-3 py-2 text-[11.5px] leading-relaxed text-tealdeep">
            La réception met automatiquement à jour <b>l'emplacement officiel</b>, le statut et le responsable de l'équipement.
          </p>
        </div>
      )}
      {t.status === "cloture" && (
        <div className="mt-3 space-y-2">
          <p className="flex items-center gap-2 rounded-lg bg-[#e2f3ea] px-3 py-2.5 text-[13px] font-medium text-[#1d6b48]">
            <Icon name="check" className="h-4 w-4" strokeWidth={2.4} /> Transfert clôturé — chaîne complète.
          </p>
          <div className="text-[12px] leading-relaxed text-mute">
            Demandé le {fmtDateTime(t.requestedAt)}<br />
            Validé le {fmtDateTime(t.approvedAt)}<br />
            Expédié le {fmtDateTime(t.shippedAt)}<br />
            Réceptionné le {fmtDateTime(t.receivedAt)}
          </div>
        </div>
      )}
      {t.status === "rejete" && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-[#fadfda]/70 px-3 py-2.5 text-[13px] font-medium text-[#9e3327]">
          <Icon name="x" className="h-4 w-4" strokeWidth={2.4} /> Demande refusée — aucun mouvement effectué.
        </p>
      )}
    </div>
  );
}

function NewTransferModal({ open, onClose, preselect }: { open: boolean; onClose: () => void; preselect?: string }) {
  const { state: s, dispatch, me } = useStore();
  const eligible = s.equipment.filter((e) => !isTransferActive(s, e.id) && !["transfert", "reforme", "perdu"].includes(e.status));
  const [equipmentId, setEquipmentId] = useState("");
  const [toLoc, setToLoc] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setEquipmentId(preselect ?? "");
      setToLoc(""); setReason(""); setErr("");
    }
  }, [open, preselect]);

  const selEq = s.equipment.find((e) => e.id === equipmentId);

  const submit = () => {
    if (!selEq || !toLoc || reason.trim().length < 5) {
      setErr("Équipement, destination et motif (5 caractères min.) sont requis.");
      return;
    }
    if (toLoc === selEq.locationId) { setErr("La destination est identique à l'emplacement officiel actuel."); return; }
    dispatch({ type: "CREATE_TRANSFER", equipmentId: selEq.id, toLocationId: toLoc, reason: reason.trim() });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} over={`Demandeur : ${me?.name ?? "—"}`} title="Nouvelle demande de transfert" wide>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Équipement concerné</label>
          <select value={equipmentId} onChange={(e) => { setEquipmentId(e.target.value); setErr(""); }} className={inputCls}>
            <option value="">— Sélectionner un équipement éligible —</option>
            {eligible.map((e) => (
              <option key={e.id} value={e.id}>{e.code} · {e.brand} {e.model} · {locLabel(s, e.locationId)}</option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-faint">Liste filtrée : les équipements déjà en transfert, réformés ou perdus sont exclus (règles n°6 et n°9).</p>
        </div>

        {selEq && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3">
            <Icon name="pin" className="h-5 w-5 shrink-0 text-tealdeep" />
            <div className="text-[13px]">
              <span className="font-mono text-[10px] uppercase tracking-wider text-faint">Emplacement officiel actuel — </span>
              <b className="text-body">{locLabel(s, selEq.locationId)}</b>
              <span className="text-mute"> · {siteLabel(s, s.locations.find((l) => l.id === selEq.locationId)?.siteId ?? "")} · {locFull(s, selEq.locationId)}</span>
            </div>
          </div>
        )}

        <div>
          <label className={labelCls}>Destination</label>
          <select value={toLoc} onChange={(e) => { setToLoc(e.target.value); setErr(""); }} className={inputCls}>
            <option value="">— Choisir le local de destination —</option>
            {s.sites.map((st) => (
              <optgroup key={st.id} label={`${st.city} — ${st.name}`}>
                {s.locations.filter((l) => l.siteId === st.id).map((l) => (
                  <option key={l.id} value={l.id}>{l.building} / {l.floor} / {l.room}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Motif du déplacement *</label>
          <textarea value={reason} onChange={(e) => { setReason(e.target.value); setErr(""); }} rows={2} className={`${inputCls} resize-none`} placeholder="Ex. : réaffectation du personnel, renfort saison chaude…" />
        </div>

        {err && <p className="rounded-lg bg-[#fadfda] px-3 py-2 text-[12.5px] font-medium text-[#9e3327]">{err}</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onClose} className={btnGhost}>Annuler</button>
          <button onClick={submit} className={btnPrimary}>
            <Icon name="swap" className="h-4 w-4" /> Créer la demande (TRF-2026-{String(s.seq.trf + 1).padStart(5, "0")})
          </button>
        </div>
      </div>
    </Modal>
  );
}
