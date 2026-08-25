/* ============================================================
   ClimaTrace — Modèle de données du parc de climatisation
   Chaîne : ÉQUIPEMENT → IDENTITÉ → EMPLACEMENT → RESPONSABLE
            → MOUVEMENT → HISTORIQUE
   ============================================================ */

export type Role = "admin" | "gestionnaire" | "responsable" | "technicien" | "auditeur";

export type EquipStatus =
  | "installe"
  | "stock"
  | "maintenance"
  | "hors_service"
  | "reparation"
  | "transfert"
  | "reforme"
  | "perdu"
  | "a_verifier";

export type TransferStatus = "demande" | "valide" | "transit" | "recu" | "cloture" | "rejete";

export type InvResult = "present" | "absent" | "deplace" | "endommage";

export type AnomalyType = "localisation" | "introuvable" | "dommage" | "serie";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  siteId?: string;
  initials: string;
  phone: string;
}

export interface Site {
  id: string;
  name: string;
  city: string;
  address: string;
  manager: string;
}

export interface Location {
  id: string;
  siteId: string;
  building: string;
  floor: string;
  room: string;
}

export interface Equipment {
  id: string;
  code: string;              // identifiant interne immuable — CLM-000xxx
  serial: string;            // n° série constructeur (unique)
  brand: string;
  model: string;
  type: string;
  power: string;
  tech: string;
  refrigerant: string;
  capacity: string;
  consumption: string;
  yearFab: number;
  yearAcq: number;
  supplier: string;
  invoice: string;
  warrantyEnd: string;
  status: EquipStatus;
  locationId: string;        // EMPLACEMENT OFFICIEL — modifiable uniquement via transfert validé
  responsible: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  lastInventory?: string;
  lastInventoryResult?: InvResult;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  code: string;              // TRF-2026-xxxxx
  equipmentId: string;
  fromLocationId: string;
  toLocationId: string;
  requester: string;
  approver?: string;
  transporter?: string;
  receiver?: string;
  status: TransferStatus;
  reason: string;
  rejectReason?: string;
  requestedAt: string;
  approvedAt?: string;
  shippedAt?: string;
  receivedAt?: string;
}

export type InterventionType = "preventive" | "corrective" | "installation" | "reparation";

export interface Intervention {
  id: string;
  code: string;              // INT-2026-xxx
  equipmentId: string;
  technician: string;
  type: InterventionType;
  issue?: string;
  action: string;
  parts?: string;
  cost: number;              // FCFA
  result: string;
  date: string;
  nextDate?: string;
}

export interface InventorySession {
  id: string;
  code: string;              // INV-2026-xxx
  siteId: string;
  startedAt: string;
  closedAt?: string;
  checkedBy: string;
}

export interface InventoryCheck {
  id: string;
  sessionId: string;
  equipmentId: string;
  expectedLocationId: string;
  observedLocationId?: string;
  result: InvResult;
  checkedBy: string;
  checkedAt: string;
  comment?: string;
}

export interface Anomaly {
  id: string;
  code: string;              // ANM-2026-xxx
  equipmentId: string;
  type: AnomalyType;
  detail: string;
  expectedLocationId: string;
  observedLocationId?: string;
  declaredBy: string;
  declaredAt: string;
  status: "ouverte" | "resolue";
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  user: string;
  role: Role;
  action: string;
  entity: string;
  entityId: string;
  detail: string;
}

export interface AppState {
  version: number;
  currentUserId: string | null;
  users: User[];
  sites: Site[];
  locations: Location[];
  equipment: Equipment[];
  transfers: Transfer[];
  interventions: Intervention[];
  sessions: InventorySession[];
  checks: InventoryCheck[];
  anomalies: Anomaly[];
  audit: AuditEntry[];
  seq: { eq: number; trf: number; int: number; anm: number; inv: number; aud: number; chk: number };
  toast: string | null;
}

/* ---------------- Référentiels d'affichage ---------------- */

export const STATUS_META: Record<EquipStatus, { label: string; chip: string; dot: string }> = {
  installe:     { label: "Installé",               chip: "bg-[#e2f3ea] text-[#1d6b48]",            dot: "#2e9e6b" },
  stock:        { label: "En stock",               chip: "bg-[#e4ecf0] text-[#46636e]",            dot: "#7a93a0" },
  maintenance:  { label: "En maintenance",         chip: "bg-[#fbeed3] text-[#8a5b06]",            dot: "#e39112" },
  hors_service: { label: "Hors service",           chip: "bg-[#fadfda] text-[#9e3327]",            dot: "#d64545" },
  reparation:   { label: "En réparation",          chip: "bg-[#fbe4ce] text-[#96520d]",            dot: "#e07514" },
  transfert:    { label: "En transfert",           chip: "bg-[#d9f0f4] text-[#0a5c68]",            dot: "#1493a6" },
  reforme:      { label: "Réformé",                chip: "bg-[#e8e8e6] text-[#6b6b63]",            dot: "#9b9b90" },
  perdu:        { label: "Perdu / introuvable",    chip: "bg-[#f0d9d9] text-[#7c2a28]",            dot: "#8e3230" },
  a_verifier:   { label: "Localisation à vérifier", chip: "bg-[#fce3d1] text-[#a34a08]",           dot: "#e06a10" },
};

export const STATUS_ORDER: EquipStatus[] = [
  "installe", "stock", "maintenance", "reparation", "hors_service", "transfert", "a_verifier", "perdu", "reforme",
];

export const TRANSFER_META: Record<TransferStatus, { label: string; chip: string; dot: string }> = {
  demande: { label: "Demande à valider", chip: "bg-[#fbeed3] text-[#8a5b06]", dot: "#e39112" },
  valide:  { label: "Validé — à expédier", chip: "bg-[#d9f0f4] text-[#0a5c68]", dot: "#0e7c8a" },
  transit: { label: "En transit", chip: "bg-[#d9f0f4] text-[#0a5c68]", dot: "#1493a6" },
  recu:    { label: "Réceptionné", chip: "bg-[#e2f3ea] text-[#1d6b48]", dot: "#2e9e6b" },
  cloture: { label: "Clôturé", chip: "bg-[#e4ecf0] text-[#3c565f]", dot: "#5b7479" },
  rejete:  { label: "Refusé", chip: "bg-[#fadfda] text-[#9e3327]", dot: "#d64545" },
};

export const ROLE_META: Record<Role, { label: string; chip: string; desc: string }> = {
  admin:        { label: "Administrateur",      chip: "bg-[#d9f0f4] text-[#0a5c68]", desc: "Valide les transferts, gère le référentiel, supervise tout." },
  gestionnaire: { label: "Gestionnaire de parc", chip: "bg-[#e2f3ea] text-[#1d6b48]", desc: "Enregistre les équipements, pilote transferts et inventaires." },
  responsable:  { label: "Responsable de site",  chip: "bg-[#fbeed3] text-[#8a5b06]", desc: "Confirme les réceptions, signale les anomalies." },
  technicien:   { label: "Technicien",           chip: "bg-[#e4ecf0] text-[#46636e]", desc: "Consigne les interventions et l'état technique." },
  auditeur:     { label: "Auditeur",             chip: "bg-[#f0d9d9] text-[#7c2a28]", desc: "Lecture seule — contrôle du patrimoine." },
};

export const INV_META: Record<InvResult, { label: string; chip: string }> = {
  present:    { label: "Présent",     chip: "bg-[#e2f3ea] text-[#1d6b48]" },
  absent:     { label: "Absent",      chip: "bg-[#f0d9d9] text-[#7c2a28]" },
  deplace:    { label: "Déplacé",     chip: "bg-[#fce3d1] text-[#a34a08]" },
  endommage:  { label: "Endommagé",   chip: "bg-[#fbe4ce] text-[#96520d]" },
};

export const ANOMALY_META: Record<AnomalyType, { label: string; chip: string }> = {
  localisation: { label: "Anomalie de localisation", chip: "bg-[#fce3d1] text-[#a34a08]" },
  introuvable:  { label: "Équipement introuvable",   chip: "bg-[#f0d9d9] text-[#7c2a28]" },
  dommage:      { label: "Dommage constaté",         chip: "bg-[#fbe4ce] text-[#96520d]" },
  serie:        { label: "N° de série litigieux",    chip: "bg-[#fbeed3] text-[#8a5b06]" },
};

export const INTERVENTION_META: Record<InterventionType, { label: string; chip: string }> = {
  preventive:   { label: "Maintenance préventive", chip: "bg-[#d9f0f4] text-[#0a5c68]" },
  corrective:   { label: "Maintenance corrective", chip: "bg-[#fbeed3] text-[#8a5b06]" },
  installation: { label: "Installation",           chip: "bg-[#e2f3ea] text-[#1d6b48]" },
  reparation:   { label: "Réparation",             chip: "bg-[#fbe4ce] text-[#96520d]" },
};

export interface PermSet {
  manageEquip: boolean;
  approve: boolean;
  request: boolean;
  ship: boolean;
  receive: boolean;
  intervene: boolean;
  inventory: boolean;
  resolveAnomaly: boolean;
  addLocation: boolean;
  readOnly: boolean;
}

export function perms(role: Role | undefined): PermSet {
  const r = role ?? "auditeur";
  return {
    manageEquip: r === "admin" || r === "gestionnaire",
    approve: r === "admin" || r === "gestionnaire",
    request: r !== "auditeur",
    ship: r === "admin" || r === "gestionnaire",
    receive: r === "admin" || r === "gestionnaire" || r === "responsable",
    intervene: r === "admin" || r === "technicien" || r === "gestionnaire",
    inventory: r === "admin" || r === "gestionnaire" || r === "responsable",
    resolveAnomaly: r === "admin" || r === "gestionnaire",
    addLocation: r === "admin" || r === "gestionnaire",
    readOnly: r === "auditeur",
  };
}
