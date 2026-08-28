import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import type { AppState, AuditEntry, Role, Transfer, Equipment } from "./types";
import { STATUS_META } from "./types";
import { buildSeed } from "./data/seed";

const LS_KEY = "climatrice:v4";

/* ---------------- Formatage ---------------- */

export const fmtDate = (isoStr?: string) =>
  isoStr ? new Date(isoStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtDateTime = (isoStr?: string) =>
  isoStr
    ? new Date(isoStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) +
      " · " +
      new Date(isoStr).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "—";

export const fmtFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

export const daysUntil = (isoStr?: string) =>
  isoStr ? Math.ceil((new Date(isoStr).getTime() - Date.now()) / 86_400_000) : 0;

/* ---------------- Actions ---------------- */

export type Action =
  | { type: "LOGIN"; userId: string }
  | { type: "LOGOUT" }
  | { type: "TOAST"; msg: string | null }
  | { type: "RESET" }
  | { type: "ADD_EQUIPMENT"; data: Omit<Equipment, "id" | "code" | "createdAt" | "updatedAt"> }
  | { type: "SET_STATUS"; id: string; status: Equipment["status"] }
  | { type: "ADD_LOCATION"; siteId: string; building: string; floor: string; room: string }
  | { type: "ADD_PHOTO"; equipmentId: string; dataUrl: string }
  | { type: "REMOVE_PHOTO"; equipmentId: string; index: number }
  | { type: "BATCH_STOCK"; brand: string; model: string; kind: string; power: string; supplier: string; invoice: string; yearAcq: number; locationId: string; responsible: string; count: number; serialPrefix: string }
  | { type: "IMPORT_CSV"; items: { serial: string; brand: string; model: string; type: string; power: string; supplier: string; invoice: string }[]; fileName: string; locationId: string; responsible: string }
  | { type: "CREATE_TRANSFER"; equipmentId: string; toLocationId: string; reason: string; photoDemande?: string }
  | { type: "APPROVE_TRANSFER"; id: string }
  | { type: "REJECT_TRANSFER"; id: string; reason: string }
  | { type: "SHIP_TRANSFER"; id: string; transporter: string }
  | { type: "RECEIVE_TRANSFER"; id: string; receiver: string; photoReception?: string }
  | { type: "ADD_INTERVENTION"; equipmentId: string; kind: "preventive" | "corrective" | "installation" | "reparation"; issue: string; action: string; parts: string; cost: number; result: string; nextDate?: string }
  | { type: "START_SESSION"; siteId: string }
  | { type: "CLOSE_SESSION"; id: string }
  | { type: "RECORD_CHECK"; sessionId: string; equipmentId: string; result: "present" | "absent" | "deplace" | "endommage"; observedLocationId?: string; comment?: string }
  | { type: "RESOLVE_ANOMALY"; id: string; mode: "legitimer" | "retour" | "retrouve"; note: string };

/* ---------------- Audit ---------------- */

function pushAudit(s: AppState, action: string, entity: string, entityId: string, detail: string): AppState {
  const u = s.users.find((x) => x.id === s.currentUserId);
  const entry: AuditEntry = {
    id: `au${s.seq.aud + 1}`,
    at: new Date().toISOString(),
    user: u?.name ?? "Système",
    role: (u?.role ?? "admin") as Role,
    action, entity, entityId, detail,
  };
  return { ...s, seq: { ...s.seq, aud: s.seq.aud + 1 }, audit: [entry, ...s.audit] };
}

const withToast = (s: AppState, msg: string): AppState => ({ ...s, toast: msg });

/* ---------------- Réducteur ---------------- */

function reducer(state: AppState, a: Action): AppState {
  switch (a.type) {
    case "LOGIN": {
      const u = state.users.find((x) => x.id === a.userId);
      if (!u) return state;
      let s: AppState = { ...state, currentUserId: u.id, toast: `Session ouverte — ${u.name} (${u.role}).` };
      s = pushAudit(s, "CONNEXION", "Session", u.email, `Ouverture de session · rôle ${u.role}.`);
      return s;
    }
    case "LOGOUT":
      return { ...state, currentUserId: null, toast: null };
    case "TOAST":
      return { ...state, toast: a.msg };
    case "RESET": {
      const fresh = buildSeed();
      return { ...fresh, toast: "Données de démonstration réinitialisées." };
    }

    case "ADD_EQUIPMENT": {
      const serial = a.data.serial.trim().toUpperCase();
      if (!serial) return withToast(state, "Le numéro de série est obligatoire.");
      if (state.equipment.some((e) => e.serial.toUpperCase() === serial))
        return withToast(state, `Règle n°1 violée : le n° de série ${serial} existe déjà.`);
      const n = state.seq.eq + 1;
      const code = `CLM-${String(n).padStart(6, "0")}`;
      const now = new Date().toISOString();
      const eqNew: Equipment = { ...a.data, serial, id: `e${n}`, code, createdAt: now, updatedAt: now };
      let s: AppState = { ...state, seq: { ...state.seq, eq: n }, equipment: [eqNew, ...state.equipment] };
      s = pushAudit(s, "CREATION", "Équipement", code,
        `${eqNew.brand} ${eqNew.model} · SN ${serial} · affecté à ${locLabel(state, eqNew.locationId)} · statut « ${STATUS_META[eqNew.status].label} ».`);
      return withToast(s, `${code} enregistré — identité unique attribuée.`);
    }

    case "ADD_PHOTO": {
      const e = state.equipment.find((x) => x.id === a.equipmentId);
      if (!e) return state;
      const photos = e.photos ?? [];
      if (photos.length >= 6) return withToast(state, "Galerie limitée à 6 photos par équipement.");
      let s: AppState = {
        ...state,
        equipment: state.equipment.map((x) => (x.id === a.equipmentId ? { ...x, photos: [...photos, a.dataUrl], updatedAt: new Date().toISOString() } : x)),
      };
      s = pushAudit(s, "PHOTO", "Équipement", e.code, `Photo n°${photos.length + 1} ajoutée à la galerie d'identification.`);
      return withToast(s, `Photo ajoutée à ${e.code}.`);
    }

    case "REMOVE_PHOTO": {
      const e = state.equipment.find((x) => x.id === a.equipmentId);
      if (!e) return state;
      let s: AppState = {
        ...state,
        equipment: state.equipment.map((x) => (x.id === a.equipmentId ? { ...x, photos: (x.photos ?? []).filter((_, i) => i !== a.index), updatedAt: new Date().toISOString() } : x)),
      };
      s = pushAudit(s, "PHOTO", "Équipement", e.code, `Photo n°${a.index + 1} retirée de la galerie.`);
      return withToast(s, "Photo retirée.");
    }

    case "BATCH_STOCK": {
      const n0 = state.seq.eq;
      const u = state.users.find((x) => x.id === state.currentUserId);
      const now = new Date().toISOString();
      const prefix = (a.serialPrefix.trim() || `${a.brand.slice(0, 3).toUpperCase()}${a.power.replace(/[^0-9]/g, "")}`).toUpperCase();
      const y = new Date(); y.setFullYear(y.getFullYear() + 1);
      const created: Equipment[] = [];
      for (let i = 0; i < a.count; i++) {
        const n = n0 + 1 + i;
        created.push({
          id: `e${n}`, code: `CLM-${String(n).padStart(6, "0")}`,
          serial: `${prefix}-${String(n).padStart(6, "0")}`,
          brand: a.brand, model: a.model, type: a.kind, power: a.power,
          tech: "Inverter", refrigerant: "R410A", capacity: "12 000 BTU", consumption: "1,1 kW/h",
          yearFab: a.yearAcq - 1, yearAcq: a.yearAcq, supplier: a.supplier || "—", invoice: a.invoice || "—",
          warrantyEnd: y.toISOString(), status: "stock", locationId: a.locationId, responsible: a.responsible || "—",
          createdAt: now, updatedAt: now,
        });
      }
      const impN = state.seq.imp + 1;
      const impCode = `IMP-2026-${String(impN).padStart(3, "0")}`;
      let s: AppState = {
        ...state,
        seq: { ...state.seq, eq: n0 + a.count, imp: impN },
        equipment: [...created, ...state.equipment],
        imports: [{ id: `im${Date.now().toString(36)}`, code: impCode, source: "lot", operator: u?.name ?? "—", date: now, count: a.count, codes: created.map((c) => c.code) }, ...state.imports],
      };
      s = pushAudit(s, "IMPORT_LOT", "Stock", impCode,
        `${a.count} × ${a.brand} ${a.model} ${a.power} entrés en stock (${created[0].code} → ${created[created.length - 1].code}) · série auto ${prefix}-…`);
      return withToast(s, `${a.count} unités créées en stock — ${created[0].code} → ${created[created.length - 1].code}.`);
    }

    case "IMPORT_CSV": {
      const n0 = state.seq.eq;
      const u = state.users.find((x) => x.id === state.currentUserId);
      const now = new Date().toISOString();
      const y = new Date(); y.setFullYear(y.getFullYear() + 1);
      const existing = new Set(state.equipment.map((e) => e.serial.toUpperCase()));
      const accepted = a.items.filter((it) => it.serial.trim() && !existing.has(it.serial.trim().toUpperCase()));
      if (accepted.length === 0) return withToast(state, "Aucune ligne valide — import annulé.");
      const created: Equipment[] = accepted.map((it, i) => {
        const n = n0 + 1 + i;
        existing.add(it.serial.trim().toUpperCase());
        return {
          id: `e${n}`, code: `CLM-${String(n).padStart(6, "0")}`,
          serial: it.serial.trim().toUpperCase(), brand: it.brand, model: it.model,
          type: it.type || "Split mural", power: it.power || "1,5 CV",
          tech: "Inverter", refrigerant: "R410A", capacity: "12 000 BTU", consumption: "1,1 kW/h",
          yearFab: (Number(new Date().getFullYear()) - 1), yearAcq: Number(new Date().getFullYear()),
          supplier: it.supplier || "—", invoice: it.invoice || "—",
          warrantyEnd: y.toISOString(), status: "stock", locationId: a.locationId, responsible: "Gestionnaire de parc",
          createdAt: now, updatedAt: now,
        };
      });
      const impN = state.seq.imp + 1;
      const impCode = `IMP-2026-${String(impN).padStart(3, "0")}`;
      let s: AppState = {
        ...state,
        seq: { ...state.seq, eq: n0 + created.length, imp: impN },
        equipment: [...created, ...state.equipment],
        imports: [{ id: `im${Date.now().toString(36)}`, code: impCode, source: "csv", fileName: a.fileName, operator: u?.name ?? "—", date: now, count: created.length, codes: created.map((c) => c.code) }, ...state.imports],
      };
      s = pushAudit(s, "IMPORT_CSV", "Stock", impCode,
        `Fichier « ${a.fileName} » — ${created.length} unité(s) créée(s) en stock (${created[0].code} → ${created[created.length - 1].code}), ${a.items.length - created.length} ligne(s) écartée(s).`);
      return withToast(s, `Import validé — ${created.length} équipement(s) ajouté(s) au registre.`);
    }

    case "SET_STATUS": {
      const e = state.equipment.find((x) => x.id === a.id);
      if (!e || e.status === a.status) return state;
      let s: AppState = {
        ...state,
        equipment: state.equipment.map((x) => (x.id === a.id ? { ...x, status: a.status, updatedAt: new Date().toISOString() } : x)),
      };
      s = pushAudit(s, "CHANGEMENT_STATUT", "Équipement", e.code,
        `« ${STATUS_META[e.status].label} » → « ${STATUS_META[a.status].label} ».`);
      return withToast(s, `${e.code} : statut mis à jour.`);
    }

    case "ADD_LOCATION": {
      const id = `L${String(state.locations.length + 1).padStart(2, "0")}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
      let s: AppState = { ...state, locations: [...state.locations, { id, siteId: a.siteId, building: a.building, floor: a.floor, room: a.room }] };
      s = pushAudit(s, "CREATION", "Emplacement", id, `${siteLabel(state, a.siteId)} / ${a.building} / ${a.floor} / ${a.room}.`);
      return withToast(s, "Emplacement ajouté au référentiel.");
    }

    case "CREATE_TRANSFER": {
      const e = state.equipment.find((x) => x.id === a.equipmentId);
      if (!e) return state;
      /* Règle n°6 : un transfert actif bloque toute nouvelle demande */
      const active = state.transfers.some(
        (t) => t.equipmentId === e.id && ["demande", "valide", "transit"].includes(t.status)
      );
      if (active) return withToast(state, `Règle n°6 : ${e.code} a déjà un transfert en cours.`);
      if (a.toLocationId === e.locationId) return withToast(state, "Destination identique à l'emplacement officiel.");
      const n = state.seq.trf + 1;
      const code = `TRF-2026-${String(n).padStart(5, "0")}`;
      const u = state.users.find((x) => x.id === state.currentUserId);
      const tr: Transfer = {
        id: `t${Date.now().toString(36)}`, code, equipmentId: e.id,
        fromLocationId: e.locationId, toLocationId: a.toLocationId,
        requester: u?.name ?? "—", status: "demande", reason: a.reason,
        requestedAt: new Date().toISOString(),
        photoDemande: a.photoDemande,
      };
      let s: AppState = { ...state, seq: { ...state.seq, trf: n }, transfers: [tr, ...state.transfers] };
      s = pushAudit(s, "DEMANDE_TRANSFERT", "Transfert", code,
        `${e.code} · ${locLabel(state, e.locationId)} → ${locLabel(state, a.toLocationId)} · motif : ${a.reason}`);
      return withToast(s, `${code} créé — en attente de validation.`);
    }

    case "APPROVE_TRANSFER": {
      const t = state.transfers.find((x) => x.id === a.id);
      if (!t) return state;
      const u = state.users.find((x) => x.id === state.currentUserId);
      let s: AppState = {
        ...state,
        transfers: state.transfers.map((x) =>
          x.id === a.id ? { ...x, status: "valide", approver: u?.name ?? "—", approvedAt: new Date().toISOString() } : x
        ),
      };
      s = pushAudit(s, "VALIDATION_TRANSFERT", "Transfert", t.code, `Transfert autorisé par ${u?.name ?? "—"}.`);
      return withToast(s, `${t.code} validé — prêt pour expédition.`);
    }

    case "REJECT_TRANSFER": {
      const t = state.transfers.find((x) => x.id === a.id);
      if (!t) return state;
      const u = state.users.find((x) => x.id === state.currentUserId);
      let s: AppState = {
        ...state,
        transfers: state.transfers.map((x) =>
          x.id === a.id ? { ...x, status: "rejete", approver: u?.name ?? "—", rejectReason: a.reason, approvedAt: new Date().toISOString() } : x
        ),
      };
      s = pushAudit(s, "REFUS_TRANSFERT", "Transfert", t.code, `Refus motivé : ${a.reason}`);
      return withToast(s, `${t.code} refusé — l'emplacement officiel est inchangé.`);
    }

    case "SHIP_TRANSFER": {
      const t = state.transfers.find((x) => x.id === a.id);
      if (!t) return state;
      const e = state.equipment.find((x) => x.id === t.equipmentId);
      let s: AppState = {
        ...state,
        transfers: state.transfers.map((x) =>
          x.id === a.id ? { ...x, status: "transit", transporter: a.transporter, shippedAt: new Date().toISOString() } : x
        ),
        equipment: state.equipment.map((x) =>
          x.id === t.equipmentId ? { ...x, status: "transfert", updatedAt: new Date().toISOString() } : x
        ),
      };
      s = pushAudit(s, "EXPEDITION_TRANSFERT", "Transfert", t.code,
        `${e?.code ?? ""} remis à ${a.transporter} — l'emplacement officiel reste ${locLabel(state, t.fromLocationId)} jusqu'à réception.`);
      return withToast(s, `${t.code} expédié — équipement « En transfert ».`);
    }

    case "RECEIVE_TRANSFER": {
      const t = state.transfers.find((x) => x.id === a.id);
      if (!t) return state;
      const e = state.equipment.find((x) => x.id === t.equipmentId);
      const dest = state.locations.find((l) => l.id === t.toLocationId);
      const destSite = dest ? state.sites.find((s2) => s2.id === dest.siteId) : undefined;
      let s: AppState = {
        ...state,
        transfers: state.transfers.map((x) =>
          x.id === a.id ? { ...x, status: "cloture", receiver: a.receiver, receivedAt: new Date().toISOString(), photoReception: a.photoReception ?? x.photoReception } : x
        ),
        /* Règle n°5 : c'est la réception qui met à jour l'emplacement officiel */
        equipment: state.equipment.map((x) =>
          x.id === t.equipmentId
            ? { ...x, locationId: t.toLocationId, status: "installe", responsible: destSite?.manager ?? x.responsible, updatedAt: new Date().toISOString() }
            : x
        ),
      };
      s = pushAudit(s, "RECEPTION_TRANSFERT", "Transfert", t.code,
        `${e?.code ?? ""} réceptionné par ${a.receiver} · emplacement officiel : ${locLabel(state, t.fromLocationId)} → ${locLabel(state, t.toLocationId)}.`);
      return withToast(s, `Réception confirmée — emplacement officiel de ${e?.code ?? ""} mis à jour.`);
    }

    case "ADD_INTERVENTION": {
      const e = state.equipment.find((x) => x.id === a.equipmentId);
      if (!e) return state;
      const n = state.seq.int + 1;
      const code = `INT-2026-${String(n).padStart(3, "0")}`;
      const u = state.users.find((x) => x.id === state.currentUserId);
      const now = new Date().toISOString();
      let s: AppState = {
        ...state,
        seq: { ...state.seq, int: n },
        interventions: [
          { id: `i${Date.now().toString(36)}`, code, equipmentId: e.id, technician: u?.name ?? "—", type: a.kind, issue: a.issue || undefined, action: a.action, parts: a.parts || undefined, cost: a.cost, result: a.result, date: now, nextDate: a.nextDate || undefined },
          ...state.interventions,
        ],
        equipment: state.equipment.map((x) =>
          x.id === e.id
            ? { ...x, lastMaintenance: now, nextMaintenance: a.nextDate || x.nextMaintenance, status: a.result.toLowerCase().includes("réparation") ? "reparation" : x.status === "maintenance" ? "installe" : x.status, updatedAt: now }
            : x
        ),
      };
      s = pushAudit(s, "INTERVENTION", "Équipement", e.code, `${code} · ${a.action} · ${new Intl.NumberFormat("fr-FR").format(a.cost)} FCFA.`);
      return withToast(s, `${code} consignée sur ${e.code}.`);
    }

    case "START_SESSION": {
      const open = state.sessions.find((x) => !x.closedAt && x.siteId === a.siteId);
      if (open) return withToast(state, `${open.code} est déjà ouverte sur ce site.`);
      const n = state.seq.inv + 1;
      const code = `INV-2026-${String(n).padStart(3, "0")}`;
      const u = state.users.find((x) => x.id === state.currentUserId);
      const session = { id: `s${Date.now().toString(36)}`, code, siteId: a.siteId, startedAt: new Date().toISOString(), checkedBy: u?.name ?? "—" };
      let s: AppState = { ...state, seq: { ...state.seq, inv: n }, sessions: [session, ...state.sessions] };
      s = pushAudit(s, "OUVERTURE_INVENTAIRE", "Inventaire", code, `Session de contrôle physique ouverte — ${siteLabel(state, a.siteId)}.`);
      return withToast(s, `${code} ouverte — contrôle physique démarré.`);
    }

    case "CLOSE_SESSION": {
      const ses = state.sessions.find((x) => x.id === a.id);
      if (!ses) return state;
      const nChecks = state.checks.filter((c) => c.sessionId === a.id).length;
      let s: AppState = {
        ...state,
        sessions: state.sessions.map((x) => (x.id === a.id ? { ...x, closedAt: new Date().toISOString() } : x)),
      };
      s = pushAudit(s, "CLOTURE_INVENTAIRE", "Inventaire", ses.code, `Session clôturée — ${nChecks} contrôle(s) enregistré(s).`);
      return withToast(s, `${ses.code} clôturée.`);
    }

    case "RECORD_CHECK": {
      const ses = state.sessions.find((x) => x.id === a.sessionId);
      const e = state.equipment.find((x) => x.id === a.equipmentId);
      if (!ses || !e) return state;
      const u = state.users.find((x) => x.id === state.currentUserId);
      const now = new Date().toISOString();
      const n = state.seq.chk + 1;
      const check = {
        id: `c${n}`, sessionId: ses.id, equipmentId: e.id, expectedLocationId: e.locationId,
        observedLocationId: a.observedLocationId, result: a.result, checkedBy: u?.name ?? "—",
        checkedAt: now, comment: a.comment,
      };
      let s: AppState = {
        ...state,
        seq: { ...state.seq, chk: n },
        checks: [...state.checks, check],
        equipment: state.equipment.map((x) =>
          x.id === e.id
            ? {
                ...x,
                lastInventory: now,
                lastInventoryResult: a.result,
                status: a.result === "deplace" ? "a_verifier" : a.result === "absent" ? "perdu" : a.result === "endommage" ? "hors_service" : x.status === "a_verifier" || x.status === "perdu" ? x.status : x.status,
                updatedAt: now,
              }
            : x
        ),
      };
      /* Règle n°10 : déplacement non tracé → anomalie automatique */
      if (a.result === "deplace" || a.result === "absent") {
        const na = state.seq.anm + 1;
        const code = `ANM-2026-${String(na).padStart(3, "0")}`;
        const anom = {
          id: `a${na}`, code, equipmentId: e.id,
          type: a.result === "deplace" ? ("localisation" as const) : ("introuvable" as const),
          detail:
            a.result === "deplace"
              ? `⚠ Anomalie de localisation — attendu à ${locLabel(state, e.locationId)}, relevé à ${locLabel(state, a.observedLocationId ?? e.locationId)}.`
              : `Équipement introuvable lors du contrôle physique de ${siteLabel(state, ses.siteId)}.`,
          expectedLocationId: e.locationId,
          observedLocationId: a.observedLocationId,
          declaredBy: u?.name ?? "—", declaredAt: now, status: "ouverte" as const,
        };
        s = { ...s, seq: { ...s.seq, anm: na }, anomalies: [anom, ...s.anomalies] };
        s = pushAudit(s, "ANOMALIE", "Équipement", e.code, `${code} · ${anom.detail}`);
      } else {
        s = pushAudit(s, "CONTROLE_INVENTAIRE", "Équipement", e.code, `${ses.code} · contrôle « ${a.result} » à ${locLabel(state, e.locationId)}.`);
      }
      return withToast(s, `Contrôle « ${a.result} » enregistré pour ${e.code}.`);
    }

    case "RESOLVE_ANOMALY": {
      const an0 = state.anomalies.find((x) => x.id === a.id);
      if (!an0) return state;
      const e = state.equipment.find((x) => x.id === an0.equipmentId);
      const u = state.users.find((x) => x.id === state.currentUserId);
      const now = new Date().toISOString();
      let s: AppState = {
        ...state,
        anomalies: state.anomalies.map((x) =>
          x.id === a.id
            ? { ...x, status: "resolue", resolution: `${a.mode === "legitimer" ? "Emplacement légitimé" : a.mode === "retour" ? "Retour physique confirmé" : "Équipement retrouvé"} — ${a.note}`, resolvedAt: now, resolvedBy: u?.name ?? "—" }
            : x
        ),
        equipment: state.equipment.map((x) => {
          if (x.id !== an0.equipmentId) return x;
          if (a.mode === "legitimer" && an0.observedLocationId)
            return { ...x, locationId: an0.observedLocationId, status: "installe", updatedAt: now };
          return { ...x, status: "installe", updatedAt: now };
        }),
      };
      s = pushAudit(s, "REGULARISATION_ANOMALIE", "Équipement", e?.code ?? an0.code,
        `${an0.code} résolue (${a.mode}) — ${a.note}` + (a.mode === "legitimer" && an0.observedLocationId ? ` · nouvel emplacement officiel : ${locLabel(state, an0.observedLocationId)}.` : "."));
      return withToast(s, `${an0.code} résolue et journalisée.`);
    }

    default:
      return state;
  }
}

/* ---------------- Libellés ---------------- */

export function locLabel(s: Pick<AppState, "locations" | "sites">, locId: string): string {
  const l = s.locations.find((x) => x.id === locId);
  if (!l) return "—";
  const site = s.sites.find((x) => x.id === l.siteId);
  return `${site?.city ?? "?"} · ${l.room}`;
}

export function locFull(s: Pick<AppState, "locations">, locId: string): string {
  const l = s.locations.find((x) => x.id === locId);
  return l ? `${l.building} / ${l.floor} / ${l.room}` : "—";
}

export function siteLabel(s: Pick<AppState, "sites">, siteId: string): string {
  return s.sites.find((x) => x.id === siteId)?.name ?? "—";
}

export const isTransferActive = (s: AppState, equipmentId: string) =>
  s.transfers.some((t) => t.equipmentId === equipmentId && ["demande", "valide", "transit"].includes(t.status));

export interface AlertItem {
  id: string;
  severity: "red" | "amber" | "cyan";
  label: string;
  view: string;
}

export function computeAlerts(s: AppState): AlertItem[] {
  const out: AlertItem[] = [];
  s.anomalies.filter((a) => a.status === "ouverte").forEach((a) => {
    const e = s.equipment.find((x) => x.id === a.equipmentId);
    out.push({ id: `an-${a.id}`, severity: "red", label: `${a.code} · ${e?.code ?? "?"} — ${a.type === "introuvable" ? "équipement introuvable" : "anomalie de localisation"}`, view: "anomalies" });
  });
  s.transfers.filter((t) => t.status === "demande").forEach((t) => {
    const e = s.equipment.find((x) => x.id === t.equipmentId);
    out.push({ id: `tr-${t.id}`, severity: "amber", label: `${t.code} · ${e?.code ?? "?"} — transfert à valider`, view: "transferts" });
  });
  s.equipment.forEach((e) => {
    if (!e.nextMaintenance || e.status === "reforme" || e.status === "perdu") return;
    const d = daysUntil(e.nextMaintenance);
    if (d < 0) out.push({ id: `mr-${e.id}`, severity: "amber", label: `${e.code} · ${e.brand} — maintenance en retard de ${Math.abs(d)} j`, view: "maintenance" });
    else if (d <= 15) out.push({ id: `mv-${e.id}`, severity: "cyan", label: `${e.code} · ${e.brand} — maintenance prévue dans ${d} j`, view: "maintenance" });
  });
  const rank = { red: 0, amber: 1, cyan: 2 } as const;
  return out.sort((x, y) => rank[x.severity] - rank[y.severity]);
}

/* ---------------- Provider ---------------- */

function loadInitial(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === 4 && Array.isArray(parsed.imports)) return { ...parsed, toast: null };
    }
  } catch {
    /* seed */
  }
  return buildSeed();
}

interface Ctx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  me: ReturnType<typeof currentUser>;
}

function currentUser(s: AppState) {
  const u = s.users.find((x) => x.id === s.currentUserId) ?? null;
  return u;
}

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children, onPersistError }: { children: ReactNode; onPersistError?: () => void }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ ...state, toast: null }));
    } catch {
      /* stockage local saturé — remonter à l'UI */
      onPersistError?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: "TOAST", msg: null }), 4200);
    return () => clearTimeout(t);
  }, [state.toast]);

  return <StoreCtx.Provider value={{ state, dispatch, me: currentUser(state) }}>{children}</StoreCtx.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore doit être utilisé sous StoreProvider");
  return c;
}
