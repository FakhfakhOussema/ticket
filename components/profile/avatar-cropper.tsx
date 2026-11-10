"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** Taille (en pixels) de l'avatar exporté : carré 512 × 512. */
const OUTPUT_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible."));
    img.src = src;
  });
}

/** Découpe la zone choisie et l'exporte en image carrée : JPEG (fond blanc) ou PNG (transparence conservée). */
async function cropToBlob(src: string, area: Area, format: "jpeg" | "png"): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Recadrage indisponible sur ce navigateur.");
  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Export impossible."))), format === "png" ? "image/png" : "image/jpeg", 0.9),
  );
}

type Props = {
  /** URL (blob:) de l'image choisie ; `null` = fermé. */
  src: string | null;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
  onError: (message: string) => void;
  /** Format exporté : JPEG par défaut (avatars), PNG pour conserver la transparence (logos). */
  format?: "jpeg" | "png";
  title?: string;
};

export function AvatarCropper({ src, busy, onCancel, onConfirm, onError, format = "jpeg", title = "Recadrer la photo" }: Props) {
  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Déplacez l&apos;image et zoomez pour choisir la zone carrée à conserver.</DialogDescription>
        </DialogHeader>
        {/* key : l'état de recadrage repart de zéro à chaque nouvelle image */}
        {src ? <CropperBody key={src} src={src} busy={busy} format={format} onCancel={onCancel} onConfirm={onConfirm} onError={onError} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CropperBody({ src, busy, format = "jpeg", onCancel, onConfirm, onError }: Omit<Props, "src" | "title"> & { src: string }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);

  const confirm = async () => {
    if (!area) return;
    setWorking(true);
    try {
      const blob = await cropToBlob(src, area, format);
      onConfirm(new File([blob], format === "png" ? "logo.png" : "avatar.jpg", { type: blob.type }));
    } catch (e) {
      onError(e instanceof Error ? e.message : "Impossible de recadrer l'image.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <div className="relative h-72 w-full overflow-hidden rounded-xl bg-slate-900 sm:h-80">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          minZoom={1}
          maxZoom={4}
          aspect={1}
          cropShape="rect"
          showGrid
          objectFit="contain"
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => setArea(pixels)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Dézoomer" onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}>
          <Minus />
        </Button>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="accent-primary h-1.5 flex-1 cursor-pointer"
        />
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Zoomer" onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))}>
          <Plus />
        </Button>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy || working}>
          Annuler
        </Button>
        <Button type="button" onClick={confirm} disabled={!area || busy || working}>
          {busy || working ? "Envoi…" : "Valider"}
        </Button>
      </div>
    </>
  );
}
