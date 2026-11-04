"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Upload, X, Loader2, Save, ChevronDown, Star, Users, CakeSlice, Lightbulb,
  Globe, GripVertical, Check, Eye, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { AdminCake } from "@/lib/admin-data";
import type { Category } from "@/lib/db-types";
import { compressImage } from "@/lib/image-compress";
import { BTN_INK, BTN_PRIMARY, CARD, FIELD, FIELD_LABEL, PageHeader, Switch } from "./ui";

function SortableImage({
  id,
  url,
  index,
  onRemove,
  onPreview,
}: {
  id: string;
  url: string;
  index: number;
  onRemove: () => void;
  onPreview: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
    cursor: isDragging ? "grabbing" : "zoom-in",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (!isDragging) onPreview();
      }}
      className={cn(
        "relative group aspect-square rounded-xl overflow-hidden bg-gp-champagne/50 touch-none",
        index === 0 ? "ring-2 ring-gp-raspberry ring-offset-2 ring-offset-white" : "ring-1 ring-gp-gold/30"
      )}
      {...attributes}
      {...listeners}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} />

      {/* Hover hint — tells the user the tile is clickable. */}
      <div className="absolute inset-0 bg-gp-ink/0 group-hover:bg-gp-ink/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
        <div className="bg-white/95 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-medium text-gp-ink shadow">
          <Eye size={12} />
          Aperçu
        </div>
      </div>

      {/* Position badge (always visible) — 01, 02, 03… */}
      <div
        className={cn(
          "absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold tracking-wider shadow-gp-chip pointer-events-none tabular-nums",
          index === 0 ? "bg-gp-raspberry text-gp-cream" : "bg-white/95 text-gp-ink/85"
        )}
      >
        {index === 0 ? "PRINCIPALE" : String(index + 1).padStart(2, "0")}
      </div>

      {/* Drag handle — always visible (no hover required) */}
      <div className="absolute top-1 right-1 bg-white/90 text-gp-ink/70 p-1 rounded-full shadow-gp-chip pointer-events-none">
        <GripVertical size={12} />
      </div>

      {/* Remove button — always visible bottom-right.
          stopPropagation on pointerdown + click stops the drag AND the preview
          modal from opening when the user taps the X. The ::after widens the
          tap area to 44px without covering the small photo. */}
      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center bg-white/95 rounded-full text-red-700 hover:bg-red-50 shadow-gp-chip after:absolute after:-inset-1.5 after:content-['']"
        title="Supprimer"
        aria-label="Supprimer la photo"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function ImagePreviewModal({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && images.length > 1) {
        onNavigate((index - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        onNavigate((index + 1) % images.length);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, images.length, onClose, onNavigate]);

  const navBtn =
    "absolute top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-gp-cream/15 hover:bg-gp-cream/25 text-gp-cream flex items-center justify-center";

  return (
    <div
      className="fixed inset-0 !m-0 z-[200] bg-gp-ink/90 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu de la photo"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-gp-cream/15 hover:bg-gp-cream/25 text-gp-cream flex items-center justify-center"
        aria-label="Fermer"
      >
        <X size={20} />
      </button>

      <div className="absolute top-5 left-4 z-10 px-3 py-1.5 rounded-full bg-gp-cream/15 text-gp-cream text-sm tabular-nums pointer-events-none">
        {index + 1} / {images.length}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + images.length) % images.length);
            }}
            className={cn(navBtn, "left-3 md:left-6")}
            aria-label="Précédent"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % images.length);
            }}
            className={cn(navBtn, "right-3 md:right-6")}
            aria-label="Suivant"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div
        className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[index]}
          alt=""
          className="max-w-full max-h-[88vh] object-contain rounded-xl border-[6px] border-gp-cream shadow-gp-lifted"
        />
      </div>
    </div>
  );
}

type Lang = "fr" | "ar" | "en";
const LANGS: { code: Lang; label: string; dir: string }[] = [
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "en", label: "English", dir: "ltr" },
];

interface Props {
  cake?: AdminCake;
  mode: "new" | "edit";
  categories: Category[];
}

interface PresignedUpload {
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  expiresAt?: number;
  error?: string;
}

interface AiResponse {
  titles: { ar?: string; en?: string };
  descriptions: { fr?: string; ar?: string; en?: string };
}

export default function CakeForm({ cake, mode, categories }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const cakeIdRef = useRef<string>(
    cake?.id || `new-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  );
  const originalImagesRef = useRef<Set<string>>(new Set(cake?.images || []));

  // If the cake references a category that has since been deleted, synthesize
  // an option from its denormalized categoryLabel so the dropdown still
  // displays the current value.
  const categoryOptions = useMemo<Category[]>(() => {
    if (
      cake &&
      cake.category &&
      !categories.find((c) => c.slug === cake.category)
    ) {
      const ghost: Category = {
        id: `__ghost__${cake.category}`,
        slug: cake.category,
        labels: cake.categoryLabel,
        order: 9999,
        createdAt: "",
        updatedAt: "",
      };
      return [...categories, ghost];
    }
    return categories;
  }, [categories, cake]);

  const initialCategory =
    cake?.category ||
    (categoryOptions[0]?.slug ?? "");

  const [activeLang, setActiveLang] = useState<Lang>("fr");
  const [images, setImages] = useState<string[]>(cake?.images || []);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
    phase: "preparing" | "uploading";
  } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [category, setCategory] = useState(initialCategory);
  const [translations, setTranslations] = useState({
    fr: { title: cake?.translations.fr.title || "", description: cake?.translations.fr.description || "" },
    ar: { title: cake?.translations.ar.title || "", description: cake?.translations.ar.description || "" },
    en: { title: cake?.translations.en.title || "", description: cake?.translations.en.description || "" },
  });
  const [dims, setDims] = useState({
    length: cake?.length?.toString() || "",
    width: cake?.width?.toString() || "",
    height: cake?.height?.toString() || "",
    pieces: cake?.pieces?.toString() || "",
    persons: cake?.persons?.toString() || "",
  });
  const [featured, setFeatured] = useState(cake?.featured || false);
  const [hero, setHero] = useState(cake?.hero || false);
  const [published, setPublished] = useState(cake?.published ?? true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setUploadError("");
    setUploadProgress({ done: 0, total: arr.length, phase: "preparing" });

    try {
      // Compress on-device first — drops phone photos from 5–15 MB to ~300–500 KB.
      const prepared = await Promise.all(
        arr.map(async (f) => {
          try {
            return await compressImage(f);
          } catch {
            return f;
          }
        })
      );
      setUploadProgress({ done: 0, total: prepared.length, phase: "uploading" });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cakeIdRef.current,
          scope: "cakes",
          files: prepared.map((f) => ({
            contentType: f.type || "application/octet-stream",
            contentLength: f.size,
          })),
        }),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Upload request failed (${res.status})`);
      }

      const data = (await res.json()) as { uploads: PresignedUpload[] };
      const uploaded: string[] = [];
      let done = 0;

      await Promise.all(
        prepared.map(async (file, i) => {
          const slot = data.uploads[i];
          if (!slot || slot.error || !slot.uploadUrl || !slot.publicUrl) {
            console.warn(`[upload] ${file.name}: ${slot?.error || "no slot"}`);
            done++;
            setUploadProgress({ done, total: prepared.length, phase: "uploading" });
            return;
          }
          const putRes = await fetch(slot.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          done++;
          setUploadProgress({ done, total: prepared.length, phase: "uploading" });
          if (!putRes.ok) {
            console.error(`[upload] PUT failed for ${file.name}: ${putRes.status}`);
            return;
          }
          uploaded.push(slot.publicUrl);
        })
      );

      if (uploaded.length > 0) {
        setImages((prev) => [...prev, ...uploaded]);
      }
      if (uploaded.length < prepared.length) {
        setUploadError(`${prepared.length - uploaded.length} fichier(s) n'ont pas pu être téléchargés.`);
      }
    } catch (e) {
      console.error("[upload]", e);
      setUploadError(e instanceof Error ? e.message : "Erreur de téléchargement");
    } finally {
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeImage(idx: number) {
    const url = images[idx];
    setImages((prev) => prev.filter((_, i) => i !== idx));

    if (url && !originalImagesRef.current.has(url)) {
      try {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } catch {
        // best-effort; orphan is acceptable
      }
    }
  }

  const dndSensors = useSensors(
    // Mouse / pen: small drag distance avoids accidental drags when tapping buttons.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Touch: short long-press so taps on the X / drag handle don't start a drag.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setImages((prev) => {
      const oldIndex = prev.indexOf(String(active.id));
      const newIndex = prev.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function handleGenerate() {
    if (!translations.fr.title.trim()) {
      setAiError("Ajoutez d'abord un titre en français.");
      return;
    }
    setGenerating(true);
    setAiError("");

    const imgBase64: string[] = [];
    for (const imgPath of images.slice(0, 2)) {
      try {
        const res = await fetch(imgPath);
        const blob = await res.blob();
        const reader = new FileReader();
        const b64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        imgBase64.push(b64);
      } catch {
        /* skip */
      }
    }

    try {
      const cat = categoryOptions.find((c) => c.slug === category);
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: translations.fr.title,
          category: cat?.labels.fr || category,
          images: imgBase64,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error || "Erreur API");
      }

      const data = (await res.json()) as AiResponse;
      setTranslations((prev) => ({
        fr: {
          title: prev.fr.title, // FR is the user's source of truth — untouched.
          description: data.descriptions.fr ?? prev.fr.description,
        },
        ar: {
          title: data.titles.ar ?? prev.ar.title,
          description: data.descriptions.ar ?? prev.ar.description,
        },
        en: {
          title: data.titles.en ?? prev.en.title,
          description: data.descriptions.en ?? prev.en.description,
        },
      }));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Erreur lors de la génération");
    }
    setGenerating(false);
  }

  async function handleSave() {
    setSaving(true);
    const cat = categoryOptions.find((c) => c.slug === category);
    if (!cat) {
      setUploadError("Sélectionnez une catégorie valide.");
      setSaving(false);
      return;
    }
    const payload = {
      images,
      category: cat.slug,
      categoryLabel: cat.labels,
      translations: {
        fr: { title: translations.fr.title, description: translations.fr.description },
        ar: {
          title: translations.ar.title || translations.fr.title,
          description: translations.ar.description || translations.fr.description,
        },
        en: {
          title: translations.en.title || translations.fr.title,
          description: translations.en.description || translations.fr.description,
        },
      },
      length: dims.length ? Number(dims.length) : undefined,
      width: dims.width ? Number(dims.width) : undefined,
      height: dims.height ? Number(dims.height) : undefined,
      pieces: dims.pieces ? Number(dims.pieces) : undefined,
      persons: dims.persons ? Number(dims.persons) : undefined,
      featured,
      hero,
      published,
    };

    try {
      const res = await fetch(
        mode === "new" ? "/api/admin/cakes" : `/api/admin/cakes/${cake!.id}`,
        {
          method: mode === "new" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      setSaved(true);
      setTimeout(() => {
        router.push("/admin/cakes");
        router.refresh();
      }, 800);
    } catch (e) {
      console.error("[save]", e);
      setUploadError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  const cur = translations[activeLang];
  const uploading = uploadProgress !== null;
  const noCategories = categoryOptions.length === 0;

  const saveDisabled = saving || !translations.fr.title || uploading || noCategories;
  const saveLabel = saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer";
  const saveIcon = saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />;
  const sectionTitle = "text-[15px] font-semibold text-gp-ink mb-3";

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <PageHeader
        title={mode === "new" ? "Nouveau gâteau" : "Modifier le gâteau"}
        subtitle={
          mode === "new" ? (
            "Remplissez les informations ci-dessous pour ajouter un gâteau"
          ) : (
            <span className="block truncate max-w-md">{cake?.translations.fr.title || "Sans titre"}</span>
          )
        }
        actions={
          <>
            <div className="flex items-center gap-1 rounded-full bg-white border border-gp-gold/30 pl-4 pr-1">
              <span className="text-sm font-medium text-gp-ink/85">{published ? "Publié" : "Brouillon"}</span>
              <Switch checked={published} onChange={setPublished} label="Publié sur le site" />
            </div>
            {/* Computer: save next to the title. Phones get the sticky bar at the bottom. */}
            <button onClick={handleSave} disabled={saveDisabled} className={cn(BTN_PRIMARY, "hidden md:inline-flex")}>
              {saveIcon}
              {saveLabel}
            </button>
          </>
        }
      />

      {noCategories && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          Aucune catégorie disponible. Créez-en au moins une dans{" "}
          <a href="/admin/categories" className="font-semibold underline">Catégories</a>{" "}avant d&apos;ajouter un gâteau.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Left col — images + category */}
        <div className="lg:col-span-1 space-y-4">
          {/* Images */}
          <div className={cn(CARD, "p-4")}>
            <h3 className={sectionTitle}>Photos</h3>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="w-full border-2 border-dashed border-gp-gold/50 bg-gp-cream/60 rounded-xl px-4 py-5 text-center cursor-pointer hover:border-gp-raspberry/40 hover:bg-gp-raspberry/5 transition-colors mb-3"
            >
              {uploading ? (
                <Loader2 size={22} className="animate-spin text-gp-raspberry mx-auto mb-1.5" />
              ) : (
                <Upload size={22} className="text-gp-raspberry mx-auto mb-1.5" />
              )}
              <span className="block text-sm font-medium text-gp-ink/80">
                {uploading
                  ? uploadProgress!.phase === "preparing"
                    ? `Préparation des images...`
                    : `Téléchargement ${uploadProgress!.done}/${uploadProgress!.total}...`
                  : "Ajoutez ou glissez vos photos"}
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {uploadError && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                {uploadError}
              </p>
            )}

            {images.length > 0 && (
              <DndContext
                sensors={dndSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={images} strategy={rectSortingStrategy}>
                  {/* 2 per row in the narrow computer column, so « PRINCIPALE » fits. */}
                  <div className="grid grid-cols-3 lg:grid-cols-2 gap-2.5">
                    {images.map((img, i) => (
                      <SortableImage
                        key={img}
                        id={img}
                        url={img}
                        index={i}
                        onRemove={() => removeImage(i)}
                        onPreview={() => setPreviewIndex(i)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            {images.length > 0 && (
              <p className="text-xs text-gp-ink/65 mt-2.5">
                Glissez les photos pour les réorganiser. La 1ère sera la photo principale.
              </p>
            )}
          </div>

          {/* Category */}
          <div className={cn(CARD, "p-4")}>
            <label htmlFor="cake-category" className={cn(sectionTitle, "block")}>Catégorie</label>
            <div className="relative">
              <select
                id="cake-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={noCategories}
                className={cn(FIELD, "pr-9 appearance-none")}
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.labels.fr}{c.id.startsWith("__ghost__") ? " (supprimée)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gp-ink/60 pointer-events-none" />
            </div>
            <p className="text-xs text-gp-ink/65 mt-2">
              Gérer la liste dans <a href="/admin/categories" className="font-medium text-gp-raspberry underline">Catégories</a>.
            </p>
          </div>

          {/* Dimensions */}
          <div className={cn(CARD, "p-4")}>
            <h3 className={sectionTitle}>Dimensions & Portions</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { key: "length", label: "Long. (cm)" },
                { key: "width", label: "Larg. (cm)" },
                { key: "height", label: "Haut. (cm)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`cake-${key}`} className="block text-xs font-medium text-gp-ink/70 mb-1">{label}</label>
                  <input
                    id={`cake-${key}`}
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={dims[key as keyof typeof dims]}
                    onChange={(e) => setDims((d) => ({ ...d, [key]: e.target.value }))}
                    className={cn(FIELD, "px-2 text-center tabular-nums")}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "pieces", label: "Portions" },
                { key: "persons", label: "Personnes" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`cake-${key}`} className="block text-xs font-medium text-gp-ink/70 mb-1">{label}</label>
                  <input
                    id={`cake-${key}`}
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={dims[key as keyof typeof dims]}
                    onChange={(e) => setDims((d) => ({ ...d, [key]: e.target.value }))}
                    className={cn(FIELD, "px-2 text-center tabular-nums")}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Featured + hero showcase */}
          <div className={cn(CARD, "divide-y divide-gp-gold/20")}>
            <div className="flex items-center justify-between gap-3 pl-4 pr-2 py-2.5">
              <div>
                <p className="font-semibold text-gp-ink text-sm flex items-center gap-1.5">
                  <Star size={13} className="text-gp-raspberry" />
                  Gâteau à la une
                </p>
                <p className="text-xs text-gp-ink/65 mt-0.5">Affiché en premier sur la page d&apos;accueil</p>
              </div>
              <Switch checked={featured} onChange={setFeatured} label="Gâteau à la une" onClass="bg-gp-raspberry" />
            </div>
            <div className="flex items-center justify-between gap-3 pl-4 pr-2 py-2.5">
              <div>
                <p className="font-semibold text-gp-ink text-sm flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-700" />
                  Vitrine d&apos;accueil
                </p>
                <p className="text-xs text-gp-ink/65 mt-0.5">Apparait dans le carrousel cinéma en haut du site</p>
              </div>
              <Switch checked={hero} onChange={setHero} label="Vitrine d'accueil" onClass="bg-amber-600" />
            </div>
          </div>
        </div>

        {/* Right col — titles + descriptions */}
        <div className="lg:col-span-2 space-y-4">
          <div className={cn(CARD, "p-4 md:p-5")}>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-gp-raspberry" />
              <h3 className="text-[15px] font-semibold text-gp-ink">Titres & Descriptions</h3>
            </div>

            <div role="group" aria-label="Langue" className="flex gap-1 mb-4 bg-gp-ink/5 p-1 rounded-full">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  aria-pressed={activeLang === l.code}
                  onClick={() => setActiveLang(l.code)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 min-h-11 rounded-full text-sm font-medium transition",
                    activeLang === l.code
                      ? "bg-white text-gp-ink font-semibold shadow-gp-card"
                      : "text-gp-ink/70 hover:text-gp-ink"
                  )}
                >
                  <span lang={l.code}>{l.label}</span>
                  {translations[l.code].title && (
                    <span aria-label="rempli" className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-4" dir={LANGS.find((l) => l.code === activeLang)?.dir}>
              <div>
                <label htmlFor="cake-title" className={FIELD_LABEL}>
                  Titre {activeLang === "fr" ? "(requis)" : "(rempli par l'IA ou copié du FR)"}
                </label>
                <input
                  id="cake-title"
                  type="text"
                  value={cur.title}
                  onChange={(e) =>
                    setTranslations((t) => ({
                      ...t,
                      [activeLang]: { ...t[activeLang], title: e.target.value },
                    }))
                  }
                  placeholder={activeLang === "fr" ? "Ex: Gâteau Princesse" : activeLang === "ar" ? "عنوان الكعكة" : "Cake title"}
                  className={FIELD}
                />
              </div>

              <div>
                <div className="flex items-end justify-between gap-2 mb-1.5">
                  <label htmlFor="cake-description" className={cn(FIELD_LABEL, "mb-0")}>Description</label>
                  {activeLang === "fr" && (
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || !translations.fr.title}
                      className={cn(BTN_INK, "px-4 text-[13px]")}
                    >
                      {generating ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      {generating ? "Génération IA..." : "Traduire & générer (IA)"}
                    </button>
                  )}
                </div>
                <textarea
                  id="cake-description"
                  rows={5}
                  value={cur.description}
                  onChange={(e) =>
                    setTranslations((t) => ({
                      ...t,
                      [activeLang]: { ...t[activeLang], description: e.target.value },
                    }))
                  }
                  placeholder={
                    activeLang === "fr"
                      ? "Description du gâteau... ou cliquez sur 'Traduire & générer'"
                      : activeLang === "ar"
                      ? "وصف الكعكة..."
                      : "Cake description..."
                  }
                  className={cn(FIELD, "resize-none leading-relaxed")}
                />
                {aiError && (
                  <p role="alert" className="text-sm text-red-700 mt-1.5">{aiError}</p>
                )}
                {activeLang === "fr" && !aiError && (
                  <p className="text-xs text-gp-ink/65 mt-1.5 flex gap-1.5">
                    <Lightbulb size={13} className="shrink-0 mt-px text-gp-raspberry" />
                    <span>
                      L&apos;IA traduit le titre FR vers AR/EN et génère les 3 descriptions en une fois.
                      Ajoutez des photos avant de générer pour un meilleur résultat.
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview card */}
          {(images[0] || translations.fr.title) && (
            <div className={cn(CARD, "p-4 md:p-5")}>
              <h3 className={sectionTitle}>Aperçu</h3>
              <div className="flex gap-4 items-start">
                {images[0] && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gp-champagne/50 border-4 border-gp-cream shadow-gp-print -rotate-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-display font-semibold text-gp-ink text-base tracking-[-0.01em]">
                    {translations.fr.title || "—"}
                  </p>
                  <p className="text-xs font-medium text-gp-raspberry mt-0.5">
                    {categoryOptions.find((c) => c.slug === category)?.labels.fr || "—"}
                  </p>
                  {translations.fr.description && (
                    <p className="text-xs text-gp-ink/70 mt-1 line-clamp-2">
                      {translations.fr.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gp-ink/65">
                    {dims.persons && <span className="inline-flex items-center gap-1"><Users size={12} /> {dims.persons} pers.</span>}
                    {dims.pieces && <span className="inline-flex items-center gap-1"><CakeSlice size={12} /> {dims.pieces} portions</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Phone: the save button stays under the thumb while she scrolls the long form. */}
      {/* -bottom-4 / -mb-4: flush with the screen edge, over <main>'s bottom padding; the
          cream "skirt" shadow covers the sub-pixel seam where content peeked out. */}
      <div className="md:hidden sticky -bottom-4 -mb-4 z-20 -mx-4 px-4 pt-3 pb-3 bg-gp-cream border-t border-gp-gold/30 shadow-[0_6px_0_0_rgb(var(--gp-cream))]">
        {uploadError && <p className="text-xs text-red-700 mb-2 line-clamp-2">{uploadError}</p>}
        <button onClick={handleSave} disabled={saveDisabled} className={cn(BTN_PRIMARY, "w-full min-h-12 text-base")}>
          {saveIcon}
          {saveLabel}
        </button>
      </div>

      {previewIndex !== null && images[previewIndex] && (
        <ImagePreviewModal
          images={images}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onNavigate={(i) => setPreviewIndex(i)}
        />
      )}
    </div>
  );
}
