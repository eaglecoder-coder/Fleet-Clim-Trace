import type { AppState, Equipment, EquipStatus, InvResult, User, Site, Location, Transfer, Intervention, InventorySession, InventoryCheck, Anomaly, AuditEntry } from "../types";

/* Dates relatives au jour réel : les alertes (maintenance en retard,
   échéances sous 15 jours) restent toujours pertinentes. */
const DAY = 86_400_000;
const iso = (offsetDays: number, h = 9, m = 12) => {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const eq = (
  n: number, serial: string, brand: string, model: string, power: string,
  status: EquipStatus, locationId: string, responsible: string,
  o: Partial<Equipment> = {}
): Equipment => ({
  id: `e${n}`,
  code: `CLM-000${n}`,
  serial, brand, model,
  type: "Split mural",
  power,
  tech: "Inverter",
  refrigerant: "R410A",
  capacity: "12 000 BTU",
  consumption: "1,15 kW/h",
  yearFab: 2023,
  yearAcq: 2024,
  supplier: "CFAO Équipement",
  invoice: `FA-2024-0${n}7`,
  warrantyEnd: iso(320),
  status,
  locationId,
  responsible,
  createdAt: iso(-300 - n),
  updatedAt: iso(-2),
  ...o,
});

export function buildSeed(): AppState {
  const users: User[] = [
    { id: "u1", name: "Awa Koné",      email: "a.kone@kelvia.ci",    role: "admin",        initials: "AK", phone: "+225 07 01 02 03" },
    { id: "u2", name: "Marc Traoré",   email: "m.traore@kelvia.ci",  role: "gestionnaire", initials: "MT", phone: "+225 05 44 21 90" },
    { id: "u3", name: "Fatou Diabaté", email: "f.diabate@kelvia.ci", role: "responsable", siteId: "st-bke", initials: "FD", phone: "+225 01 02 88 41" },
    { id: "u4", name: "Jean Kouassi",  email: "j.kouassi@kelvia.ci", role: "responsable", siteId: "st-bmi", initials: "JK", phone: "+225 07 55 30 12" },
    { id: "u5", name: "Yves N'Guessan", email: "y.nguessan@kelvia.ci", role: "technicien", initials: "YN", phone: "+225 05 06 71 38" },
    { id: "u6", name: "Aline Bamba",   email: "a.bamba@kelvia.ci",   role: "auditeur",     initials: "AB", phone: "+225 01 40 52 77" },
  ];

  const sites: Site[] = [
    { id: "st-abj", name: "Siège Kelvia",        city: "Abidjan",        address: "Plateau, Av. de la République", manager: "Awa Koné" },
    { id: "st-bke", name: "Agence Bouaké",       city: "Bouaké",         address: "Quartier Commerce",             manager: "Fatou Diabaté" },
    { id: "st-bmi", name: "Agence Béoumi",       city: "Béoumi",         address: "Centre-ville, lot 12",          manager: "Jean Kouassi" },
    { id: "st-dal", name: "Agence Daloa",        city: "Daloa",          address: "Bd de la Paix",                 manager: "Souleymane Cissé" },
    { id: "st-yam", name: "Antenne Yamoussoukro", city: "Yamoussoukro",  address: "Quartier Habitat",              manager: "Hervé Aka" },
  ];

  const locations: Location[] = [
    { id: "L01", siteId: "st-abj", building: "Siège",              floor: "RDC",  room: "Hall d'accueil" },
    { id: "L02", siteId: "st-abj", building: "Siège",              floor: "RDC",  room: "Salle serveurs" },
    { id: "L03", siteId: "st-abj", building: "Siège",              floor: "1er",  room: "Bureau Directeur" },
    { id: "L04", siteId: "st-abj", building: "Siège",              floor: "1er",  room: "Salle de réunion" },
    { id: "L05", siteId: "st-abj", building: "Siège",              floor: "2e",   room: "Open space Comptabilité" },
    { id: "L06", siteId: "st-abj", building: "Siège",              floor: "2e",   room: "Bureau RH" },
    { id: "L07", siteId: "st-bke", building: "Bâtiment principal", floor: "RDC",  room: "Guichets" },
    { id: "L08", siteId: "st-bke", building: "Bâtiment principal", floor: "RDC",  room: "Bureau 02" },
    { id: "L09", siteId: "st-bke", building: "Bâtiment principal", floor: "1er",  room: "Bureau Chef d'agence" },
    { id: "L10", siteId: "st-bke", building: "Bâtiment principal", floor: "1er",  room: "Salle de formation" },
    { id: "L11", siteId: "st-bke", building: "Annexe",             floor: "RDC",  room: "Magasin / dépôt" },
    { id: "L12", siteId: "st-bmi", building: "Bâtiment principal", floor: "RDC",  room: "Bureau Directeur" },
    { id: "L13", siteId: "st-bmi", building: "Bâtiment principal", floor: "RDC",  room: "Guichet 01" },
    { id: "L14", siteId: "st-bmi", building: "Bâtiment principal", floor: "1er",  room: "Bureau 03" },
    { id: "L15", siteId: "st-bmi", building: "Bâtiment principal", floor: "1er",  room: "Salle d'attente" },
    { id: "L16", siteId: "st-dal", building: "Bâtiment principal", floor: "RDC",  room: "Accueil" },
    { id: "L17", siteId: "st-dal", building: "Bâtiment principal", floor: "1er",  room: "Bureau 01" },
    { id: "L18", siteId: "st-dal", building: "Bâtiment principal", floor: "1er",  room: "Bureau 02" },
    { id: "L19", siteId: "st-yam", building: "Antenne",            floor: "RDC",  room: "Accueil" },
    { id: "L20", siteId: "st-yam", building: "Antenne",            floor: "RDC",  room: "Bureau exploitation" },
  ];

  const equipment: Equipment[] = [
    eq(101, "SN-HIS-2201114", "Hisense",  "AS-12TW4",   "1,5 CV", "installe", "L01", "Awa Koné",       { tech: "Inverter", yearFab: 2022, lastMaintenance: iso(-200), nextMaintenance: iso(40),  lastInventory: iso(-21), lastInventoryResult: "present" }),
    eq(102, "SN-DKN-8834002", "Daikin",   "FTF35XV",    "1,5 CV", "installe", "L02", "Awa Koné",       { refrigerant: "R32", lastMaintenance: iso(-40), nextMaintenance: iso(50), lastInventory: iso(-21), lastInventoryResult: "present", comment: "Local critique — priorité froideur serveurs." }),
    eq(103, "SN-SAM-5510923", "Samsung",  "AR35T",      "1,5 CV", "installe", "L03", "Awa Koné",       { lastMaintenance: iso(-95), nextMaintenance: iso(25), lastInventory: iso(-21), lastInventoryResult: "present" }),
    eq(104, "SN-LGD-7741205", "LG",       "DualCool V", "1 CV",   "installe", "L04", "Awa Koné",       { capacity: "9 000 BTU", power: "1 CV", consumption: "0,85 kW/h", lastInventory: iso(-21), lastInventoryResult: "present" }),
    eq(105, "SN-MDE-3098817", "Midea",    "Blanc MBV",  "2 CV",   "installe", "L05", "Awa Koné",       { capacity: "18 000 BTU", consumption: "1,6 kW/h", lastMaintenance: iso(-130), nextMaintenance: iso(-40), lastInventory: iso(-21), lastInventoryResult: "present" }),
    eq(106, "SN-HIS-2201568", "Hisense",  "AS-12TW4",   "1,5 CV", "installe", "L06", "Awa Koné",       { lastInventory: iso(-21), lastInventoryResult: "present" }),
    eq(107, "SN-NSC-1187230", "Nasco",    "NS-12SP",    "1,5 CV", "installe", "L07", "Fatou Diabaté",  { supplier: "Sodeci Froid", invoice: "FA-2023-1187", yearAcq: 2023, lastMaintenance: iso(-70), nextMaintenance: iso(20) }),
    eq(108, "SN-TCL-6620418", "TCL",      "TAC-12CH",   "1,5 CV", "maintenance", "L08", "Fatou Diabaté", { lastMaintenance: iso(-12), nextMaintenance: iso(5), comment: "Compresseur bruyant — pièce commandée." }),
    eq(109, "SN-GRN-9042331", "Gree",     "Pular GWH",  "2 CV",   "installe", "L09", "Fatou Diabaté",  { capacity: "18 000 BTU", lastMaintenance: iso(-60), nextMaintenance: iso(30) }),
    eq(110, "SN-HSR-4470056", "Haier",    "HSU-12LEK",  "1,5 CV", "installe", "L10", "Fatou Diabaté",  { lastMaintenance: iso(-150), nextMaintenance: iso(-60), lastInventory: iso(-20), lastInventoryResult: "present" }),
    eq(111, "SN-NSC-1187542", "Nasco",    "NS-12SP",    "1,5 CV", "perdu", "L10", "Fatou Diabaté",     { supplier: "Sodeci Froid", yearAcq: 2022, yearFab: 2021, lastInventory: iso(-20), lastInventoryResult: "absent", comment: "Introuvable lors de l'inventaire INV-2026-004." }),
    eq(112, "SN-SAM-5510771", "Samsung",  "AR35T",      "1,5 CV", "installe", "L13", "Jean Kouassi",   { lastMaintenance: iso(-85), nextMaintenance: iso(35) }),
    eq(113, "SN-HIS-2201902", "Hisense",  "AS-12TW4",   "1,5 CV", "installe", "L14", "Jean Kouassi",   { lastMaintenance: iso(-110), nextMaintenance: iso(12) }),
    eq(114, "SN-LGD-7741560", "LG",       "DualCool V", "1,5 CV", "transfert", "L04", "Awa Koné",      { comment: "En transit vers Daloa — TRF-2026-00017." }),
    eq(115, "SN-PAN-3329114", "Panasonic", "CS-PU12",   "1,5 CV", "installe", "L15", "Jean Kouassi",   { lastMaintenance: iso(-30), nextMaintenance: iso(60) }),
    eq(116, "SN-MDE-3098455", "Midea",    "Blanc MBV",  "1,5 CV", "installe", "L16", "Souleymane Cissé", { lastMaintenance: iso(-55), nextMaintenance: iso(28) }),
    eq(117, "SN-TCL-6620871", "TCL",      "TAC-12CH",   "1,5 CV", "installe", "L17", "Souleymane Cissé", { lastMaintenance: iso(-5), nextMaintenance: iso(175), comment: "Pose neuve — installation initiale." }),
    eq(118, "SN-LGD-7741902", "LG",       "DualCool V", "1 CV",   "installe", "L19", "Hervé Aka",      { capacity: "9 000 BTU", power: "1 CV", lastMaintenance: iso(-48), nextMaintenance: iso(42) }),
    eq(119, "SN-HSR-4470291", "Haier",    "HSU-12LEK",  "1,5 CV", "a_verifier", "L05", "Awa Koné",     { comment: "Étiquette relevée au magasin annexe de Bouaké — localisation officielle non modifiée.", lastInventory: iso(-21), lastInventoryResult: "deplace" }),
    eq(120, "SN-HIS-2201344", "Hisense",  "AS-12TW4",   "1,5 CV", "installe", "L20", "Hervé Aka",      { lastMaintenance: iso(-75), nextMaintenance: iso(18) }),
    eq(121, "SN-HSR-4470512", "Haier",    "HSU-12LEK",  "1,5 CV", "stock", "L11", "Fatou Diabaté",     { comment: "Unité de réserve — emballage d'origine." }),
    eq(122, "SN-GRN-9042670", "Gree",     "Pular GWH",  "2 CV",   "stock", "L11", "Fatou Diabaté",     { capacity: "18 000 BTU", comment: "Réserve régionale centre." }),
    eq(123, "SN-MDE-3098711", "Midea",    "Blanc MBV",  "1,5 CV", "stock", "L02", "Awa Koné",          { comment: "Secours froid salle serveurs." }),
    eq(124, "SN-NSC-1187980", "Nasco",    "NS-12SP",    "1,5 CV", "maintenance", "L18", "Souleymane Cissé", { supplier: "Sodeci Froid", lastMaintenance: iso(-9), nextMaintenance: iso(3), comment: "Carte électronique HS — en réparation atelier." }),
    eq(125, "SN-HIS-4589237", "Hisense",  "AS-12TW4",   "1,5 CV", "installe", "L12", "Jean Kouassi",   { lastMaintenance: iso(-75), nextMaintenance: iso(15), lastInventory: iso(-80), lastInventoryResult: "present", comment: "Équipement de référence du cahier des charges." }),
    eq(126, "SN-SAM-5510220", "Samsung",  "AR35T",      "1,5 CV", "reforme", "L11", "Fatou Diabaté",   { yearFab: 2018, yearAcq: 2019, warrantyEnd: iso(-400), comment: "Réformé — compresseur grippé, en attente d'évacuation." }),
  ];

  const transfers: Transfer[] = [
    {
      id: "t1", code: "TRF-2026-00009", equipmentId: "e106", fromLocationId: "L06", toLocationId: "L14",
      requester: "Marc Traoré", approver: "Awa Koné", status: "rejete",
      reason: "Besoin temporaire du bureau 03 de Béoumi.",
      rejectReason: "Parc de Béoumi suffisant — privilégier l'achat d'une unité neuve au prochain budget.",
      requestedAt: iso(-34), approvedAt: iso(-33),
    },
    {
      id: "t2", code: "TRF-2026-00012", equipmentId: "e116", fromLocationId: "L05", toLocationId: "L16",
      requester: "Marc Traoré", approver: "Awa Koné", transporter: "Transport Ets Koffi", receiver: "Souleymane Cissé",
      status: "cloture", reason: "Renforcement de l'accueil de Daloa avant la saison chaude.",
      requestedAt: iso(-60), approvedAt: iso(-58), shippedAt: iso(-55), receivedAt: iso(-52),
    },
    {
      id: "t3", code: "TRF-2026-00017", equipmentId: "e114", fromLocationId: "L04", toLocationId: "L18",
      requester: "Marc Traoré", approver: "Awa Koné", transporter: "Transport Ets Koffi",
      status: "transit", reason: "Équipement du bureau 02 de Daloa hors service — remplacement temporaire.",
      requestedAt: iso(-6), approvedAt: iso(-5), shippedAt: iso(-3),
    },
    {
      id: "t4", code: "TRF-2026-00018", equipmentId: "e125", fromLocationId: "L12", toLocationId: "L08",
      requester: "Jean Kouassi", status: "demande",
      reason: "Réaffectation du personnel.",
      requestedAt: iso(-2),
    },
  ];

  const interventions: Intervention[] = [
    { id: "i1", code: "INT-2026-033", equipmentId: "e117", technician: "Yves N'Guessan", type: "installation", action: "Pose split mural + tirage au vide + mise en service.", parts: "Kit cuivre 5 m", cost: 25000, result: "Opérationnel", date: iso(-5), nextDate: iso(175) },
    { id: "i2", code: "INT-2026-031", equipmentId: "e125", technician: "Yves N'Guessan", type: "preventive", issue: "Faible refroidissement signalé.", action: "Nettoyage complet + contrôle pression.", parts: "Filtre", cost: 15000, result: "Opérationnel", date: iso(-75), nextDate: iso(15) },
    { id: "i3", code: "INT-2026-028", equipmentId: "e102", technician: "Yves N'Guessan", type: "corrective", issue: "Fuite de fluide détectée au raccord.", action: "Recherche de fuite + recharge R410A.", parts: "Fluide R410A 0,8 kg", cost: 35000, result: "Opérationnel", date: iso(-40), nextDate: iso(50) },
    { id: "i4", code: "INT-2026-026", equipmentId: "e108", technician: "Yves N'Guessan", type: "reparation", issue: "Compresseur bruyant, vibrations anormales.", action: "Diagnostic — silentblocs à remplacer.", parts: "En attente", cost: 0, result: "En attente pièce", date: iso(-12), nextDate: iso(5) },
    { id: "i5", code: "INT-2026-024", equipmentId: "e124", technician: "Yves N'Guessan", type: "reparation", issue: "Panne carte électronique.", action: "Dépose et envoi atelier — remplacement carte.", parts: "Carte réf. NS-PCB-12", cost: 42000, result: "En réparation", date: iso(-9), nextDate: iso(3) },
    { id: "i6", code: "INT-2026-022", equipmentId: "e105", technician: "Yves N'Guessan", type: "preventive", action: "Entretien semestriel — nettoyage échangeurs.", cost: 12000, result: "Opérationnel", date: iso(-130), nextDate: iso(-40) },
    { id: "i7", code: "INT-2026-020", equipmentId: "e110", technician: "Yves N'Guessan", type: "preventive", action: "Entretien semestriel — contrôle sonde.", cost: 10000, result: "Opérationnel", date: iso(-150), nextDate: iso(-60) },
    { id: "i8", code: "INT-2026-019", equipmentId: "e116", technician: "Yves N'Guessan", type: "installation", action: "Réinstallation après transfert TRF-2026-00012.", cost: 18000, result: "Opérationnel", date: iso(-52), nextDate: iso(38) },
  ];

  const sessions: InventorySession[] = [
    { id: "s1", code: "INV-2026-003", siteId: "st-abj", startedAt: iso(-21), closedAt: iso(-21, 15), checkedBy: "Marc Traoré" },
    { id: "s2", code: "INV-2026-004", siteId: "st-bke", startedAt: iso(-20), closedAt: iso(-20, 16), checkedBy: "Fatou Diabaté" },
  ];

  const chk = (n: number, sid: string, eid: string, loc: string, result: InvResult, by: string, d: string, o: Partial<InventoryCheck> = {}): InventoryCheck =>
    ({ id: `c${n}`, sessionId: sid, equipmentId: eid, expectedLocationId: loc, result, checkedBy: by, checkedAt: d, ...o });

  const checks: InventoryCheck[] = [
    chk(1, "s1", "e101", "L01", "present", "Marc Traoré", iso(-21, 10)),
    chk(2, "s1", "e102", "L02", "present", "Marc Traoré", iso(-21, 10, 20)),
    chk(3, "s1", "e103", "L03", "present", "Marc Traoré", iso(-21, 10, 32)),
    chk(4, "s1", "e104", "L04", "present", "Marc Traoré", iso(-21, 10, 41)),
    chk(5, "s1", "e105", "L05", "present", "Marc Traoré", iso(-21, 11, 2)),
    chk(6, "s1", "e106", "L06", "present", "Marc Traoré", iso(-21, 11, 15)),
    chk(7, "s1", "e114", "L04", "present", "Marc Traoré", iso(-21, 11, 26)),
    chk(8, "s1", "e119", "L05", "deplace", "Marc Traoré", iso(-21, 11, 40), { observedLocationId: "L11", comment: "Étiquette relevée au magasin annexe de Bouaké lors du contrôle croisé." }),
    chk(9, "s1", "e123", "L02", "present", "Marc Traoré", iso(-21, 12, 5)),
    chk(10, "s2", "e107", "L07", "present", "Fatou Diabaté", iso(-20, 9, 30)),
    chk(11, "s2", "e108", "L08", "present", "Fatou Diabaté", iso(-20, 9, 45)),
    chk(12, "s2", "e109", "L09", "present", "Fatou Diabaté", iso(-20, 10, 5)),
    chk(13, "s2", "e110", "L10", "present", "Fatou Diabaté", iso(-20, 10, 18)),
    chk(14, "s2", "e111", "L10", "absent", "Fatou Diabaté", iso(-20, 10, 32), { comment: "Aucune trace physique — dernier contrôle conforme en 2025." }),
    chk(15, "s2", "e121", "L11", "present", "Fatou Diabaté", iso(-20, 11)),
    chk(16, "s2", "e122", "L11", "present", "Fatou Diabaté", iso(-20, 11, 12)),
    chk(17, "s2", "e126", "L11", "present", "Fatou Diabaté", iso(-20, 11, 25)),
  ];

  const anomalies: Anomaly[] = [
    {
      id: "a1", code: "ANM-2026-001", equipmentId: "e113", type: "localisation",
      detail: "Unité relevée en salle d'attente au lieu du bureau 03.",
      expectedLocationId: "L14", observedLocationId: "L15",
      declaredBy: "Jean Kouassi", declaredAt: iso(-90), status: "resolue",
      resolution: "Retour physique au bureau 03 confirmé — pose d'une étiquette QR renforcée.",
      resolvedAt: iso(-88), resolvedBy: "Jean Kouassi",
    },
    {
      id: "a2", code: "ANM-2026-004", equipmentId: "e119", type: "localisation",
      detail: "Emplacement officiel : Abidjan / Open space Comptabilité — équipement physiquement relevé au magasin annexe de Bouaké.",
      expectedLocationId: "L05", observedLocationId: "L11",
      declaredBy: "Marc Traoré", declaredAt: iso(-21), status: "ouverte",
    },
    {
      id: "a3", code: "ANM-2026-005", equipmentId: "e111", type: "introuvable",
      detail: "Absent lors de l'inventaire physique de l'agence Bouaké — aucun transfert enregistré.",
      expectedLocationId: "L10",
      declaredBy: "Fatou Diabaté", declaredAt: iso(-20), status: "ouverte",
    },
  ];

  let an = 0;
  const aud = (d: string, user: string, role: AuditEntry["role"], action: string, entity: string, entityId: string, detail: string): AuditEntry =>
    ({ id: `au${++an}`, at: d, user, role, action, entity, entityId, detail });

  const audit: AuditEntry[] = [
    aud(iso(-1, 16), "Jean Kouassi", "responsable", "DEMANDE_TRANSFERT", "Transfert", "TRF-2026-00018", "CLM-000125 · Béoumi / Bureau Directeur → Bouaké / Bureau 02 · motif : réaffectation du personnel."),
    aud(iso(-2, 9), "Système", "admin", "ALERTE", "Équipement", "CLM-000125", "Maintenance préventive planifiée dans 15 jours."),
    aud(iso(-3, 14), "Marc Traoré", "gestionnaire", "EXPEDITION_TRANSFERT", "Transfert", "TRF-2026-00017", "CLM-000114 remis au transporteur Ets Koffi — statut « En transfert »."),
    aud(iso(-5, 10), "Awa Koné", "admin", "VALIDATION_TRANSFERT", "Transfert", "TRF-2026-00017", "Transfert Siège / Salle de réunion → Daloa / Bureau 01 autorisé."),
    aud(iso(-5, 17), "Yves N'Guessan", "technicien", "INTERVENTION", "Équipement", "CLM-000117", "Installation initiale consignée — INT-2026-033 · 25 000 FCFA."),
    aud(iso(-6, 9), "Marc Traoré", "gestionnaire", "DEMANDE_TRANSFERT", "Transfert", "TRF-2026-00017", "Remplacement temporaire du bureau 02 de Daloa."),
    aud(iso(-9, 11), "Yves N'Guessan", "technicien", "INTERVENTION", "Équipement", "CLM-000124", "Dépose carte électronique — envoi atelier (INT-2026-024)."),
    aud(iso(-12, 15), "Yves N'Guessan", "technicien", "INTERVENTION", "Équipement", "CLM-000108", "Diagnostic compresseur — pièce commandée (INT-2026-026)."),
    aud(iso(-20, 16), "Fatou Diabaté", "responsable", "CLOTURE_INVENTAIRE", "Inventaire", "INV-2026-004", "Agence Bouaké — 8 contrôles · 1 absent."),
    aud(iso(-20, 10), "Fatou Diabaté", "responsable", "ANOMALIE", "Équipement", "CLM-000111", "ANM-2026-005 · équipement introuvable — statut « Perdu »."),
    aud(iso(-21, 15), "Marc Traoré", "gestionnaire", "CLOTURE_INVENTAIRE", "Inventaire", "INV-2026-003", "Siège Abidjan — 9 contrôles · 1 déplacé."),
    aud(iso(-21, 11), "Marc Traoré", "gestionnaire", "ANOMALIE", "Équipement", "CLM-000119", "ANM-2026-004 · anomalie de localisation — Abidjan→Bouaké non tracée."),
    aud(iso(-33, 9), "Awa Koné", "admin", "REFUS_TRANSFERT", "Transfert", "TRF-2026-00009", "Refus motivé — parc de Béoumi suffisant."),
    aud(iso(-52, 12), "Souleymane Cissé", "responsable", "RECEPTION_TRANSFERT", "Transfert", "TRF-2026-00012", "CLM-000116 reçu à Daloa — emplacement officiel mis à jour."),
    aud(iso(-75, 10), "Yves N'Guessan", "technicien", "INTERVENTION", "Équipement", "CLM-000125", "Nettoyage + contrôle pression (INT-2026-031) · prochaine échéance : +90 j."),
    aud(iso(-300, 8), "Awa Koné", "admin", "CREATION", "Équipement", "CLM-000101", "Import initial du parc — 26 fiches créées."),
  ];

  return {
    version: 3,
    currentUserId: null,
    users, sites, locations, equipment, transfers, interventions, sessions, checks, anomalies, audit,
    seq: { eq: 126, trf: 18, int: 33, anm: 5, inv: 4, aud: an, chk: 17 },
    toast: null,
  };
}
