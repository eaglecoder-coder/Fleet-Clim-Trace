import { useMemo, useState } from "react";
import { useStore, fmtDate, fmtDateTime, locLabel, locFull, siteLabel } from "../store";
import { ANOMALY_META, INV_META, perms, type InvResult, type Anomaly } from "../types";
import { Icon } from "../components/icons";
import { Overline, Reveal, InvBadge, Modal, EmptyState, btnPrimary, btnGhost, inputCls, labelCls } from "../components/ui";

/* ==================== INVENTAIRE ==================== */

export function InventoryView() {
  const { state: s, dispatch, me } = useStore();
  const p = perms(me?.role);
  const openSession = s.sessions.find((x) => !x.closedAt) ?? null;
  const [selId, setSelId] = useState<string | null>(openSession?.id ?? null);
  const [newSite, setNewSite] = useState(s.sites[1]?.id ?? s.sites[0]?.id ?? "");
  const [checkModal, setCheckModal] = useState<{ eqId: string; result: "deplace" | "absent" } | null>(null);
  const [obsLoc, setObsLoc] = useState("");
  const [comment, setComment] = useState("");

  const session = s.sessions.find((x) => x.id === (selId ?? openSession?.id)) ?? openSession;
  const expected = useMemo(
    () => (session ? s.equipment.filter((e) => s.locations.find((l) => l.id === e.locationId)?.siteId === session.siteId) : []),
    [session, s]
  );
  const checksOf = (sid: string) => s.checks.filter((c) => c.sessionId === sid);

  const submitCheck = (eqId: string, result: InvResult) => {
    if (!session) return;
    dispatch({
      type: "RECORD_CHECK", sessionId: session.id, equipmentId: eqId, result,
      observedLocationId: result === "deplace" ? obsLoc : undefined,
      comment: comment.trim() || undefined,
    });
    setCheckModal(null); setObsLoc(""); setComment("");
  };

  return (
    <div className="space-y-5">
      <div>
        <Overline className="text-teal">Module inventaire</Overline>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Contrôle physique du parc</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-mute">
          L'agent compare l'<b className="text-body">emplacement attendu</b> et l'<b className="text-body">emplacement observé</b>.
          Tout écart non tracé ouvre automatiquement une anomalie (règle n°10).
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* sessions */}
        <Reveal className="lg:col-span-1">
          <div className="card-hover rounded-xl border border-line bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <Overline className="text-teal">Sessions</Overline>
              <span className="rounded-full bg-paper px-2 py-0.5 font-mono text-[10.5px] font-semibold text-mute">{s.sessions.length}</span>
            </div>
            {p.inventory && (
              <div className="mb-4 space-y-2 rounded-lg border border-dashed border-linedark bg-paper/60 p-3">
                <label className={labelCls}>Ouvrir une session sur</label>
                <select value={newSite} onChange={(e) => setNewSite(e.target.value)} className={inputCls}>
                  {s.sites.map((x) => <option key={x.id} value={x.id}>{x.city} — {x.name}</option>)}
                </select>
                <button onClick={() => { dispatch({ type: "START_SESSION", siteId: newSite }); setSelId(null); }} className={`${btnDarkBtn} w-full justify-center`}>
                  <Icon name="clipboard" className="h-4 w-4" /> Démarrer le contrôle
                </button>
              </div>
            )}
            <div className="space-y-1.5">
              {[...s.sessions].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1)).map((ses) => {
                const n = checksOf(ses.id).length;
                const exp = s.equipment.filter((e) => s.locations.find((l) => l.id === e.locationId)?.siteId === ses.siteId).length;
                const active = session?.id === ses.id;
                return (
                  <button key={ses.id} onClick={() => setSelId(ses.id)} className={`btn-press block w-full rounded-lg border px-3 py-2.5 text-left ${active ? "border-teal bg-icefrost" : "border-line bg-card hover:border-linedark"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] font-bold text-tealdeep">{ses.code}</span>
                      {ses.closedAt ? (
                        <span className="rounded-full bg-[#e4ecf0] px-2 py-0.5 text-[10px] font-semibold text-[#46636e]">clôturée</span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-[#fbeed3] px-2 py-0.5 text-[10px] font-semibold text-[#8a5b06]">
                          <span className="dot-pulse-amber h-1.5 w-1.5 rounded-full bg-amber" /> en cours
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[12px] text-mute">{siteLabel(s, ses.siteId)} · {fmtDate(ses.startedAt)}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line/70">
                      <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${Math.min(100, (n / Math.max(1, exp)) * 100)}%` }} />
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-faint">{n}/{exp} contrôlés · {ses.checkedBy}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* espace de contrôle */}
        <Reveal delay={80} className="lg:col-span-2">
          {!session ? (
            <EmptyState icon="clipboard" title="Aucune session sélectionnée" sub="Ouvrez une session sur un site pour commencer le contrôle physique unité par unité." />
          ) : (
            <div className="rounded-xl border border-line bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div>
                  <div className="font-display text-lg font-bold text-ink">{session.code} — {siteLabel(s, session.siteId)}</div>
                  <div className="text-[12px] text-mute">
                    Ouverte le {fmtDateTime(session.startedAt)} par {session.checkedBy}
                    {session.closedAt && ` · clôturée le ${fmtDateTime(session.closedAt)}`}
                  </div>
                </div>
                {!session.closedAt && p.inventory && (
                  <button onClick={() => dispatch({ type: "CLOSE_SESSION", id: session.id })} className={btnGhost}>
                    <Icon name="lock" className="h-4 w-4" /> Clôturer la session
                  </button>
                )}
              </div>

              <div className="divide-y divide-line/70">
                {expected.map((e) => {
                  const ck = checksOf(session.id).find((c) => c.equipmentId === e.id);
                  return (
                    <div key={e.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${ck ? "bg-paper/50" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12.5px] font-bold text-tealdeep">{e.code}</span>
                          <span className="text-[12.5px] text-body">{e.brand} {e.model}</span>
                        </div>
                        <div className="text-[11.5px] text-mute">Attendu : {locFull(s, e.locationId)} <span className="text-faint">· SN {e.serial}</span></div>
                      </div>
                      {ck ? (
                        <div className="flex items-center gap-2">
                          <InvBadge r={ck.result} />
                          <span className="font-mono text-[10.5px] text-faint">{fmtDateTime(ck.checkedAt)} · {ck.checkedBy}</span>
                        </div>
                      ) : session.closedAt ? (
                        <span className="text-[11.5px] text-faint">non contrôlé</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(["present", "absent", "deplace", "endommage"] as InvResult[]).map((r) => (
                            <button
                              key={r}
                              onClick={() => (r === "deplace" || r === "absent" ? (setCheckModal({ eqId: e.id, result: r }), setObsLoc(""), setComment("")) : submitCheck(e.id, r))}
                              className={`btn-press rounded-md border px-2.5 py-1.5 text-[11.5px] font-semibold ${
                                r === "present" ? "border-[#bfe3cd] bg-[#e2f3ea] text-[#1d6b48] hover:bg-[#d2ecdd]"
                                : r === "absent" ? "border-[#f0c4c0] bg-[#fadfda] text-[#9e3327] hover:bg-[#f5cfc9]"
                                : r === "deplace" ? "border-[#f3d3b8] bg-[#fce3d1] text-[#a34a08] hover:bg-[#f9d6ba]"
                                : "border-[#f0d9b8] bg-[#fbe4ce] text-[#96520d] hover:bg-[#f6d8b8]"
                              }`}
                            >
                              {INV_META[r].label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {expected.length === 0 && <div className="p-6"><EmptyState icon="pin" title="Aucun équipement rattaché" sub="Ce site n'a pas d'unité affectée dans le registre." /></div>}
              </div>

              {!session.closedAt && (
                <div className="flex items-center gap-2 border-t border-line bg-paper/60 px-5 py-3 text-[11.5px] text-mute">
                  <Icon name="scan" className="h-4 w-4 text-tealdeep" />
                  Sur le terrain : scannez l'étiquette QR de l'unité puis choisissez le constat. « Déplacé » demande l'emplacement réellement observé.
                </div>
              )}
            </div>
          )}
        </Reveal>
      </div>

      {/* modale constat qualifié */}
      <Modal
        open={checkModal !== null}
        onClose={() => setCheckModal(null)}
        over={checkModal?.result === "deplace" ? "⚠ Écart de localisation" : "Équipement non trouvé"}
        title={checkModal?.result === "deplace" ? "Où l'unité a-t-elle été trouvée ?" : "Confirmer l'absence"}
      >
        {checkModal?.result === "deplace" && (
          <div className="space-y-4">
            <p className="rounded-lg bg-[#fce3d1]/70 px-3 py-2.5 text-[12.5px] leading-relaxed text-[#a34a08]">
              L'unité sera passée en statut <b>« Localisation à vérifier »</b> et une anomalie
              <b> ANM</b> sera ouverte automatiquement — l'emplacement officiel reste inchangé tant qu'aucune régularisation n'intervient.
            </p>
            <div>
              <label className={labelCls}>Emplacement réellement observé *</label>
              <select value={obsLoc} onChange={(e) => setObsLoc(e.target.value)} className={inputCls}>
                <option value="">— Sélectionner —</option>
                {s.sites.map((st) => (
                  <optgroup key={st.id} label={`${st.city} — ${st.name}`}>
                    {s.locations.filter((l) => l.siteId === st.id).map((l) => (
                      <option key={l.id} value={l.id}>{l.building} / {l.floor} / {l.room}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        )}
        <div className="mt-4">
          <label className={labelCls}>Commentaire de contrôle</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Ex. : étiquette QR relevée, unité branchée…" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setCheckModal(null)} className={btnGhost}>Annuler</button>
          <button
            onClick={() => checkModal && submitCheck(checkModal.eqId, checkModal.result)}
            disabled={checkModal?.result === "deplace" && !obsLoc}
            className={btnPrimary}
          >
            <Icon name="alert" className="h-4 w-4" /> Enregistrer le constat
          </button>
        </div>
      </Modal>
    </div>
  );
}

const btnDarkBtn = "btn-press inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-frost hover:bg-pine disabled:opacity-40";

/* ==================== ANOMALIES ==================== */

export function AnomaliesView({ onNav }: { onNav: (v: string, p?: string) => void }) {
  const { state: s, dispatch, me } = useStore();
  const p = perms(me?.role);
  const [filter, setFilter] = useState<"all" | "ouverte" | "resolue">("all");
  const [resolving, setResolving] = useState<Anomaly | null>(null);
  const [note, setNote] = useState("");

  const list = s.anomalies.filter((a) => filter === "all" || a.status === filter);
  const open = s.anomalies.filter((a) => a.status === "ouverte").length;

  const resolve = (mode: "legitimer" | "retour" | "retrouve") => {
    if (!resolving) return;
    dispatch({ type: "RESOLVE_ANOMALY", id: resolving.id, mode, note: note.trim() || "Régularisation enregistrée." });
    setResolving(null); setNote("");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline className="text-teal">Module anomalies</Overline>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Écarts & régularisations</h1>
          <p className="mt-1.5 text-sm text-mute">
            <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${open ? "bg-danger dot-pulse-red" : "bg-leaf"}`} />
            {open ? `${open} anomalie${open > 1 ? "s" : ""} ouverte${open > 1 ? "s" : ""} — régularisation requise` : "Parc conforme — aucune anomalie ouverte"}
          </p>
        </div>
        <div className="flex gap-1.5 rounded-xl border border-line bg-card p-1.5">
          {([["all", "Toutes"], ["ouverte", "Ouvertes"], ["resolue", "Résolues"]] as const).map(([id, lb]) => (
            <button key={id} onClick={() => setFilter(id)} className={`btn-press rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold ${filter === id ? "bg-ink text-frost" : "text-mute hover:text-ink"}`}>
              {lb}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon="check" title="Aucune anomalie dans cette vue" sub="Les écarts détectés lors des inventaires ou déclarés manuellement apparaissent ici." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((a, i) => {
            const e = s.equipment.find((x) => x.id === a.equipmentId);
            return (
              <Reveal key={a.id} delay={Math.min(i * 60, 180)}>
                <div className={`card-hover h-full rounded-xl border bg-card p-5 ${a.status === "ouverte" ? "border-[#e8b7b0]" : "border-line"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.status === "ouverte" ? "bg-[#fadfda] text-[#9e3327]" : "bg-[#e2f3ea] text-[#1d6b48]"}`}>
                        <Icon name="alert" className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <div className="font-mono text-[13px] font-bold text-tealdeep">{a.code}</div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${ANOMALY_META[a.type].chip}`}>{ANOMALY_META[a.type].label}</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider ${a.status === "ouverte" ? "bg-[#fadfda] text-[#9e3327]" : "bg-[#e2f3ea] text-[#1d6b48]"}`}>
                      {a.status === "ouverte" ? "Ouverte" : "Résolue"}
                    </span>
                  </div>

                  <p className="mt-3 text-[13px] leading-relaxed text-body">{a.detail}</p>

                  <div className="mt-3 space-y-1.5 text-[12.5px]">
                    <div className="flex items-center gap-2">
                      <Icon name="ac" className="h-4 w-4 text-faint" />
                      <button onClick={() => e && onNav("equipments", e.code)} className="font-mono font-semibold text-tealdeep hover:underline">{e?.code}</button>
                      <span className="text-mute">{e?.brand} {e?.model} · SN {e?.serial}</span>
                    </div>
                    <div className="flex items-center gap-2 text-mute">
                      <Icon name="pin" className="h-4 w-4 text-faint" />
                      Attendu : <b className="text-body">{locLabel(s, a.expectedLocationId)}</b>
                      {a.observedLocationId && <> · Observé : <b className="text-orange">{locLabel(s, a.observedLocationId)}</b></>}
                    </div>
                    <div className="flex items-center gap-2 text-faint">
                      <Icon name="user" className="h-4 w-4" />
                      Déclarée par {a.declaredBy} · {fmtDateTime(a.declaredAt)}
                    </div>
                  </div>

                  {a.status === "resolue" ? (
                    <div className="mt-3 rounded-lg bg-[#e2f3ea]/70 px-3 py-2.5 text-[12.5px] text-[#1d6b48]">
                      <b>Résolution :</b> {a.resolution} <span className="text-faint">— {a.resolvedBy}, {fmtDate(a.resolvedAt)}</span>
                    </div>
                  ) : (
                    p.resolveAnomaly && (
                      <button onClick={() => { setResolving(a); setNote(""); }} className={`${btnGhost} mt-4 w-full justify-center`}>
                        <Icon name="check" className="h-4 w-4" /> Traiter & régulariser
                      </button>
                    )
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      <Modal open={resolving !== null} onClose={() => setResolving(null)} over={`Traitement de ${resolving?.code ?? ""}`} title="Régulariser l'anomalie">
        <div className="space-y-3">
          <p className="text-[13px] leading-relaxed text-mute">
            Choisissez l'issue. Chaque décision est <b className="text-body">journalisée dans l'audit</b> et met à jour la fiche de l'équipement.
          </p>
          {resolving?.type === "localisation" && (
            <>
              <button onClick={() => resolve("legitimer")} disabled={!resolving?.observedLocationId} className="btn-press w-full rounded-lg border border-line bg-paper px-4 py-3 text-left hover:border-teal hover:bg-icefrost">
                <div className="text-[13px] font-bold text-ink">Légitimer l'emplacement observé</div>
                <div className="text-[11.5px] text-mute">L'emplacement officiel devient l'emplacement observé — équivaut à un transfert régularisé a posteriori.</div>
              </button>
              <button onClick={() => resolve("retour")} className="btn-press w-full rounded-lg border border-line bg-paper px-4 py-3 text-left hover:border-teal hover:bg-icefrost">
                <div className="text-[13px] font-bold text-ink">Retour physique à l'emplacement officiel</div>
                <div className="text-[11.5px] text-mute">L'unité a été rapportée sur son site d'origine — le statut repasse « Installé ».</div>
              </button>
            </>
          )}
          {resolving?.type === "introuvable" && (
            <button onClick={() => resolve("retrouve")} className="btn-press w-full rounded-lg border border-line bg-paper px-4 py-3 text-left hover:border-teal hover:bg-icefrost">
              <div className="text-[13px] font-bold text-ink">Équipement retrouvé</div>
              <div className="text-[11.5px] text-mute">Localisation physique confirmée à l'emplacement officiel — le statut « Perdu » est levé.</div>
            </button>
          )}
          {(resolving?.type === "dommage" || resolving?.type === "serie") && (
            <button onClick={() => resolve("retour")} className="btn-press w-full rounded-lg border border-line bg-paper px-4 py-3 text-left hover:border-teal hover:bg-icefrost">
              <div className="text-[13px] font-bold text-ink">Clore avec note</div>
            </button>
          )}
          <div>
            <label className={labelCls}>Note de régularisation</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Précisez les circonstances…" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
