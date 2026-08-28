import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Modal, btnPrimary, btnGhost, inputCls } from "./ui";
import { Icon } from "./icons";

/* Scan QR caméra (mobile & desktop) avec repli en saisie manuelle. */

export default function ScanModal({
  open, onClose, onDetected, title = "Scanner une étiquette QR", over = "Contrôle terrain",
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
  title?: string;
  over?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState("");
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    let alive = true;
    let raf = 0;
    let stream: MediaStream | null = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const loop = () => {
      const v = videoRef.current;
      if (v && ctx && v.readyState >= 2 && v.videoWidth > 0) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        ctx.drawImage(v, 0, 0);
        try {
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (found && found.data) {
            const m = found.data.match(/CLM-\d{6}/i);
            onDetected(m ? m[0].toUpperCase() : found.data.trim().toUpperCase());
            return; // détection réussie — on arrête la boucle
          }
        } catch {
          /* frame illisible — on continue */
        }
      }
      raf = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no-camera");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => undefined);
          raf = requestAnimationFrame(loop);
        }
      } catch {
        if (alive) setErr("Caméra indisponible ou autorisation refusée. Utilisez la saisie manuelle du code ci-dessous.");
      }
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submitManual = () => {
    const m = manual.match(/CLM-\d{6}/i);
    if (m) onDetected(m[0].toUpperCase());
    else setErr("Format attendu : CLM-000125 (visible sous le QR de l'étiquette).");
  };

  return (
    <Modal open={open} onClose={onClose} over={over} title={title}>
      <div className="overflow-hidden rounded-xl border-2 border-ink bg-ink">
        <div className="relative aspect-[4/3]">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          {/* viseur */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-40">
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-[3px] border-t-[3px] border-frost" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-[3px] border-t-[3px] border-frost" />
              <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-[3px] border-l-[3px] border-frost" />
              <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-[3px] border-r-[3px] border-frost" />
              <span className="anim-breathe absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-frost/80" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent px-4 pb-3 pt-8 text-center">
            <span className="flex items-center justify-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-frost">
              <Icon name="scan" className="h-4 w-4" /> Placez l'étiquette dans le cadre
            </span>
          </div>
        </div>
      </div>

      {err && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-[#fbeed3] px-3 py-2.5 text-[12.5px] font-medium text-[#8a5b06]">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" /> {err}
        </p>
      )}

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.18em] text-mute">Ou saisie manuelle</span>
          <span className="font-mono text-[10px] text-faint">ex. CLM-000125</span>
        </div>
        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => { setManual(e.target.value.toUpperCase()); setErr(""); }}
            onKeyDown={(e) => e.key === "Enter" && submitManual()}
            className={`${inputCls} font-mono uppercase`}
            placeholder="CLM-000125"
          />
          <button onClick={submitManual} className={btnPrimary}>
            <Icon name="check" className="h-4 w-4" /> Ouvrir
          </button>
          <button onClick={onClose} className={btnGhost}>Fermer</button>
        </div>
      </div>
    </Modal>
  );
}
