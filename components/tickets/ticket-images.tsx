"use client";

import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteTicketImage, listTicketImages } from "@/lib/actions/ticket-images";
import { TICKET_IMAGE_MAX_COUNT, TICKET_IMAGE_TYPES, type TicketImage } from "@/lib/ticket-image-config";
import { uploadTicketImage, validateTicketImage } from "@/lib/ticket-images-client";
import { cn } from "@/lib/utils";

type Props = {
  ticketId: string;
  initialImages: TicketImage[];
};

export function TicketImages({ ticketId, initialImages }: Props) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const valid: File[] = [];
      for (const f of files) {
        const problem = validateTicketImage(f);
        if (problem) toast.error(problem);
        else valid.push(f);
      }
      if (valid.length === 0) return;

      setUploading((n) => n + valid.length);
      let done = 0;
      for (const file of valid) {
        const result = await uploadTicketImage(ticketId, file);
        if (result.ok) done++;
        else toast.error(result.error);
        setUploading((n) => n - 1);
      }
      if (done > 0) {
        const refreshed = await listTicketImages(ticketId);
        if (refreshed.ok && refreshed.data) setImages(refreshed.data);
        toast.success(done > 1 ? `${done} images ajoutées` : "Image ajoutée");
      }
    },
    [ticketId],
  );

  // Coller une capture d'écran (Ctrl/⌘ + V) n'importe où sur la page du ticket
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;
      e.preventDefault();
      void addFiles(
        files.map((f, i) =>
          f.name && f.name !== "image.png" ? f : new File([f], `capture-${Date.now()}-${i}.${f.type.split("/")[1] ?? "png"}`, { type: f.type }),
        ),
      );
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addFiles]);

  const current = openIndex !== null ? images[openIndex] : null;

  const remove = async () => {
    if (!current) return;
    setDeleting(true);
    const result = await deleteTicketImage(ticketId, current.name);
    setDeleting(false);
    if (!result.ok) return void toast.error(result.error);
    toast.success(result.message ?? "Image supprimée");
    setImages((prev) => prev.filter((i) => i.name !== current.name));
    setOpenIndex(null);
    setConfirmDelete(false);
  };

  return (
    <section
      aria-labelledby="images-title"
      className={cn("bg-card rounded-2xl border p-5 transition-colors", dragging && "border-primary bg-primary/5")}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void addFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="images-title" className="flex items-center gap-2 text-sm font-semibold">
          Images
          <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium tabular-nums">{images.length}</span>
        </h2>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={TICKET_IMAGE_TYPES.join(",")}
          className="sr-only"
          id="ticket-images-input"
          onChange={(e) => {
            void addFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={images.length >= TICKET_IMAGE_MAX_COUNT}>
          <ImagePlus aria-hidden /> Ajouter des images
        </Button>
      </div>

      {images.length === 0 && uploading === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-muted-foreground hover:border-primary/50 hover:text-foreground focus-visible:ring-ring flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-sm transition-colors outline-none focus-visible:ring-2"
        >
          <UploadCloud className="size-6 opacity-60" aria-hidden />
          <span>Glissez des images ici, collez une capture (Ctrl + V) ou cliquez pour choisir.</span>
          <span className="text-xs">PNG, JPG, WebP ou GIF — 8 Mo maximum par image.</span>
        </button>
      ) : (
        <ul className="columns-2 gap-3 sm:columns-3">
          {images.map((img, i) => (
            <li key={img.name} className="mb-3 break-inside-avoid">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setOpenIndex(i);
                }}
                aria-label={`Agrandir l'image ${i + 1}`}
                className="bg-muted focus-visible:ring-ring group relative flex w-full justify-center overflow-hidden rounded-xl border outline-none focus-visible:ring-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`Image ${i + 1} du ticket`} loading="lazy" className="block h-auto max-h-80 w-auto max-w-full object-contain transition-opacity group-hover:opacity-90" />
              </button>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <li key={`up-${i}`} className="bg-muted text-muted-foreground mb-3 flex aspect-video break-inside-avoid items-center justify-center rounded-xl border border-dashed" role="status" aria-label="Envoi en cours">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </li>
          ))}
        </ul>
      )}

      <Dialog open={openIndex !== null} onOpenChange={(o) => !o && setOpenIndex(null)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image {openIndex !== null ? `${openIndex + 1} / ${images.length}` : ""}</DialogTitle>
            <DialogDescription className="sr-only">Aperçu de l&apos;image jointe au ticket.</DialogDescription>
          </DialogHeader>
          {current ? (
            <>
              <div className="bg-muted/50 flex max-h-[65svh] items-center justify-center overflow-hidden rounded-xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.url} alt="Image jointe au ticket" className="max-h-[65svh] w-auto max-w-full object-contain" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={openIndex === 0} onClick={() => setOpenIndex((i) => (i === null ? i : Math.max(0, i - 1)))}>
                    Précédente
                  </Button>
                  <Button variant="outline" size="sm" disabled={openIndex === images.length - 1} onClick={() => setOpenIndex((i) => (i === null ? i : Math.min(images.length - 1, i + 1)))}>
                    Suivante
                  </Button>
                </div>
                <div className="flex gap-2">
                  <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center rounded-lg border px-2.5 text-[0.8rem] font-medium hover:bg-muted">
                    Ouvrir dans un onglet
                  </a>
                  {confirmDelete ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                        Annuler
                      </Button>
                      <Button variant="destructive" size="sm" onClick={remove} disabled={deleting}>
                        {deleting ? "Suppression…" : "Confirmer la suppression"}
                      </Button>
                    </>
                  ) : (
                    <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                      <Trash2 aria-hidden /> Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
