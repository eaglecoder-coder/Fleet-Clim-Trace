import { useMemo, useState } from "react";
import { useStore } from "../store";
import { STATUS_META, perms, type Site } from "../types";
import { Icon } from "../components/icons";
import { Overline, Reveal, Modal, SegBar, btnPrimary, btnGhost, inputCls, labelCls } from "../components/ui";

export default function Sites({ onNav }: { onNav: (v: string, p?: string) => void }) {
  const { state: s, dispatch, me } = useStore();
  const p = perms(me?.role);
  const [openSites, setOpenSites] = useState<Record<string, boolean>>(() => Object.fromEntries(s.sites.map((x) => [x.id, true])));
  const [showAdd, setShowAdd] = useState(false);

  const eqAt = (locId: string) => s.equipment.filter((e) => e.locationId === locId);
  const siteEq = (siteId: string) => s.equipment.filter((e) => s.locations.find((l) => l.id === e.locationId)?.siteId === siteId);

  const cities = useMemo(() => [...new Set(s.sites.map((x) => x.city))], [s.sites]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline className="text-teal">Référentiel des emplacements</Overline>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">Sites & locaux</h1>
          <p className="mt-1.5 text-sm text-mute">
            Hiérarchie officielle : Entreprise → Ville → Site → Bâtiment → Étage → Local. Chaque unité y est rattachée.
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} disabled={!p.addLocation} className={btnPrimary} title={!p.addLocation ? "Réservé administrateur / gestionnaire" : ""}>
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.4} /> Nouveau local
        </button>
      </div>

      <div className="space-y-4">
        {cities.map((city, ci) => (
          <Reveal key={city} delay={ci * 60}>
            <div className="mb-2 flex items-center gap-2.5">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-tealdeep">{city}</span>
              <span className="h-px flex-1 bg-linedark" />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {s.sites.filter((x) => x.city === city).map((site) => {
                const eqs = siteEq(site.id);
                const locs = s.locations.filter((l) => l.siteId === site.id);
                const open = openSites[site.id];
                const statusCounts = eqs.reduce<Record<string, number>>((acc, e) => ((acc[e.status] = (acc[e.status] ?? 0) + 1), acc), {});
                return (
                  <div key={site.id} className="card-hover overflow-hidden rounded-xl border border-line bg-card">
                    <button onClick={() => setOpenSites({ ...openSites, [site.id]: !open })} className="btn-press block w-full px-5 py-4 text-left">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-frost"><Icon name="building" className="h-5 w-5" /></span>
                          <div>
                            <div className="font-display text-lg font-bold text-ink">{site.name}</div>
                            <div className="text-[12px] text-mute">{site.address} · Responsable : <b className="text-body">{site.manager}</b></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-display text-2xl font-bold text-tealdeep">{eqs.length}</div>
                            <div className="font-mono text-[9.5px] uppercase tracking-wider text-faint">unités</div>
                          </div>
                          <Icon name="chevD" className={`h-4 w-4 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
                        </div>
                      </div>
                      <div className="mt-3">
                        <SegBar items={Object.entries(statusCounts).map(([k, v]) => ({ key: k, value: v, color: STATUS_META[k as keyof typeof STATUS_META]?.dot ?? "#7a93a0" }))} className="h-2" />
                      </div>
                    </button>

                    {open && (
                      <div className="anim-fade-up space-y-1 border-t border-line bg-paper/50 px-4 py-3">
                        {locs.map((l) => {
                          const units = eqAt(l.id);
                          return (
                            <div key={l.id} className="rounded-lg border border-transparent px-2 py-2 hover:border-line hover:bg-card">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 text-[13px]">
                                  <Icon name="pin" className="h-3.5 w-3.5 text-teal" />
                                  <span className="text-body"><b>{l.building}</b> · {l.floor} · {l.room}</span>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold ${units.length ? "bg-icefrost text-tealdeep" : "bg-line/60 text-faint"}`}>
                                  {units.length} unité{units.length > 1 ? "s" : ""}
                                </span>
                              </div>
                              {units.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1.5 pl-6">
                                  {units.map((u) => (
                                    <button
                                      key={u.id}
                                      onClick={() => onNav("equipments", u.code)}
                                      className="btn-press flex items-center gap-1.5 rounded-md border border-line bg-card px-2 py-1 font-mono text-[10.5px] font-semibold text-tealdeep hover:border-teal hover:bg-icefrost"
                                      title={`${u.brand} ${u.model} — ${u.serial}`}
                                    >
                                      {u.code}
                                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_META[u.status].dot }} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Reveal>
        ))}
      </div>

      {/* légende statuts */}
      <Reveal>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-line bg-card px-5 py-3.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-faint">Légende</span>
          {Object.entries(STATUS_META).map(([k, m]) => (
            <span key={k} className="flex items-center gap-1.5 text-[12px] text-mute">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.dot }} /> {m.label}
            </span>
          ))}
        </div>
      </Reveal>

      <AddLocationModal open={showAdd} onClose={() => setShowAdd(false)} dispatch={dispatch} sites={s.sites} />
    </div>
  );
}

function AddLocationModal({ open, onClose, dispatch, sites }: { open: boolean; onClose: () => void; dispatch: ReturnType<typeof useStore>["dispatch"]; sites: Site[] }) {
  const [f, setF] = useState({ siteId: sites[0]?.id ?? "", building: "", floor: "RDC", room: "" });
  const [err, setErr] = useState("");
  const submit = () => {
    if (!f.building.trim() || !f.room.trim()) { setErr("Bâtiment et local sont obligatoires."); return; }
    dispatch({ type: "ADD_LOCATION", siteId: f.siteId, building: f.building.trim(), floor: f.floor.trim() || "RDC", room: f.room.trim() });
    onClose();
    setF({ siteId: sites[0]?.id ?? "", building: "", floor: "RDC", room: "" });
    setErr("");
  };
  return (
    <Modal open={open} onClose={onClose} over="Référentiel hiérarchique" title="Ajouter un local">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Site</label>
          <select value={f.siteId} onChange={(e) => setF({ ...f, siteId: e.target.value })} className={inputCls}>
            {sites.map((x) => <option key={x.id} value={x.id}>{x.city} — {x.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Bâtiment *</label>
            <input value={f.building} onChange={(e) => setF({ ...f, building: e.target.value })} className={inputCls} placeholder="Bâtiment principal" />
          </div>
          <div>
            <label className={labelCls}>Étage</label>
            <select value={f.floor} onChange={(e) => setF({ ...f, floor: e.target.value })} className={inputCls}>
              {["RDC", "1er", "2e", "3e", "Sous-sol"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Local / bureau *</label>
          <input value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} className={inputCls} placeholder="Bureau 04" />
        </div>
        {err && <p className="rounded-lg bg-[#fadfda] px-3 py-2 text-[12.5px] font-medium text-[#9e3327]">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={btnGhost}>Annuler</button>
          <button onClick={submit} className={btnPrimary}><Icon name="check" className="h-4 w-4" /> Ajouter au référentiel</button>
        </div>
      </div>
    </Modal>
  );
}
