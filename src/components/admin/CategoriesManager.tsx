"use client";

import { useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Check, X, Loader2, Tag, AlertTriangle,
  Upload, ImagePlus, Sparkles,
} from "lucide-react";
import type { Category } from "@/lib/db-types";
import { compressImage } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import {
  BTN_AI, BTN_GHOST, BTN_GOLD, BTN_PRIMARY, CARD, EmptyState, ICON_BTN_BASE, INPUT, PageHeader,
} from "./ui";
import { ConfirmDialog } from "./dialogs";

interface Props {
  initial: Category[];
}

interface EditorPayload {
  labels: { fr: string; ar: string; en: string };
  image: string;
}

type EditingState =
  | { mode: "none" }
  | {
      mode: "new";
      tempId: string;
      data: EditorPayload;
    }
  | {
      mode: "edit";
      id: string;
      originalImage: string;
      data: EditorPayload;
    };

interface DeleteState {
  id: string;
  label: string;
  cakesAffected: number | null;
  loading: boolean;
}

export default function CategoriesManager({ initial }: Props) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [editing, setEditing] = useState<EditingState>({ mode: "none" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);

  function startNew() {
    setError("");
    setEditing({
      mode: "new",
      tempId: `new-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      data: { labels: { fr: "", ar: "", en: "" }, image: "" },
    });
  }

  function startEdit(cat: Category) {
    setError("");
    setEditing({
      mode: "edit",
      id: cat.id,
      originalImage: cat.image || "",
      data: { labels: { ...cat.labels }, image: cat.image || "" },
    });
  }

  async function cancelEdit() {
    // If user uploaded a fresh image during this editing session but didn't save,
    // clean it up from S3 so we don't leave orphans.
    if (editing.mode !== "none") {
      const current = editing.data.image;
      const original = editing.mode === "edit" ? editing.originalImage : "";
      if (current && current !== original) {
        void fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: current }),
        }).catch(() => {});
      }
    }
    setEditing({ mode: "none" });
    setError("");
  }

  function updateField(field: "fr" | "ar" | "en", value: string) {
    setEditing((e) => {
      if (e.mode === "none") return e;
      return { ...e, data: { ...e.data, labels: { ...e.data.labels, [field]: value } } };
    });
  }

  async function setImage(url: string) {
    setEditing((e) => {
      if (e.mode === "none") return e;
      return { ...e, data: { ...e.data, image: url } };
    });
  }

  async function removeImageInEditor() {
    if (editing.mode === "none") return;
    const current = editing.data.image;
    const original = editing.mode === "edit" ? editing.originalImage : "";

    setEditing((e) => {
      if (e.mode === "none") return e;
      return { ...e, data: { ...e.data, image: "" } };
    });

    // If this image was uploaded in this editing session (not the persisted one),
    // delete it from S3 immediately so we don't orphan. The persisted original
    // (if any) is cleaned up server-side on save when image differs.
    if (current && current !== original) {
      try {
        await fetch("/api/admin/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: current }),
        });
      } catch {
        /* best-effort */
      }
    }
  }

  async function saveEdit() {
    if (editing.mode === "none") return;
    if (!editing.data.labels.fr.trim()) {
      setError("Le libellé FR est requis.");
      return;
    }
    setSaving(true);
    setError("");

    try {
      if (editing.mode === "new") {
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labels: editing.data.labels,
            image: editing.data.image || undefined,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Création échouée");
        }
        const newCat = (await res.json()) as Category;
        setCategories((prev) => [...prev, newCat]);
      } else {
        const original = editing.originalImage;
        const next = editing.data.image;
        const imageField =
          next === original
            ? undefined // unchanged — don't touch
            : next === ""
            ? null // explicit removal
            : next; // new value

        const res = await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labels: editing.data.labels,
            ...(imageField !== undefined && { image: imageField }),
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Mise à jour échouée");
        }
        const data = (await res.json()) as {
          category: Category;
          cakesAffected: number;
        };
        setCategories((prev) =>
          prev.map((c) => (c.id === data.category.id ? data.category : c))
        );
      }
      setEditing({ mode: "none" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function openDelete(cat: Category) {
    setDeleteState({
      id: cat.id,
      label: cat.labels.fr,
      cakesAffected: null,
      loading: true,
    });
    try {
      const res = await fetch(`/api/admin/cakes`);
      if (res.ok) {
        const all = (await res.json()) as Array<{ category: string }>;
        const slug = categories.find((c) => c.id === cat.id)?.slug;
        const count = all.filter((c) => c.category === slug).length;
        setDeleteState({ id: cat.id, label: cat.labels.fr, cakesAffected: count, loading: false });
      } else {
        setDeleteState({ id: cat.id, label: cat.labels.fr, cakesAffected: 0, loading: false });
      }
    } catch {
      setDeleteState({ id: cat.id, label: cat.labels.fr, cakesAffected: 0, loading: false });
    }
  }

  async function confirmDelete() {
    if (!deleteState) return;
    setDeleteState({ ...deleteState, loading: true });
    try {
      const res = await fetch(`/api/admin/categories/${deleteState.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || "Suppression échouée");
      }
      setCategories((prev) => prev.filter((c) => c.id !== deleteState.id));
      setDeleteState(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setDeleteState(null);
    }
  }

  const editorId = editing.mode === "new" ? editing.tempId : editing.mode === "edit" ? editing.id : "";

  return (
    <div>
      <PageHeader
        width="4xl"
        eyebrow="Catalogue"
        title="Catégories"
        subtitle={`${categories.length} catégorie${categories.length !== 1 ? "s" : ""} · libellés et image modifiables`}
        actions={
          <button onClick={startNew} disabled={editing.mode !== "none"} className={BTN_GOLD} aria-label="Nouvelle catégorie">
            <Plus size={16} />
            <span className="sm:hidden">Ajouter</span>
            <span className="hidden sm:inline">Nouvelle catégorie</span>
          </button>
        }
      />
      <div className="max-w-4xl mx-auto space-y-4">
        {error && (
          <div role="alert" className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-2xl px-4 py-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {categories.length === 0 && editing.mode !== "new" ? (
          <EmptyState icon={<Tag size={22} />} title="Aucune catégorie">
            Ajoutez votre première catégorie pour commencer à classer vos gâteaux.
          </EmptyState>
        ) : (
          <div className={cn(CARD, "overflow-hidden")}>
            {editing.mode === "new" && (
              <EditorRow
                id={editorId}
                data={editing.data}
                saving={saving}
                onChangeLabel={updateField}
                onImageUploaded={setImage}
                onRemoveImage={removeImageInEditor}
                onSave={saveEdit}
                onCancel={cancelEdit}
              />
            )}
            <ul className="divide-y divide-gp-ink/10">
              {categories.map((cat) =>
                editing.mode === "edit" && editing.id === cat.id ? (
                  <li key={cat.id}>
                    <EditorRow
                      id={editorId}
                      data={editing.data}
                      saving={saving}
                      onChangeLabel={updateField}
                      onImageUploaded={setImage}
                      onRemoveImage={removeImageInEditor}
                      onSave={saveEdit}
                      onCancel={cancelEdit}
                    />
                  </li>
                ) : (
                  <li key={cat.id} className="pl-3 pr-1.5 md:px-4 py-3 hover:bg-gp-ink/[0.025] transition-colors flex items-center gap-3">
                    {/* Image thumbnail */}
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-gp-ink/[0.06] ring-1 ring-gp-ink/10 shrink-0 flex items-center justify-center">
                      {cat.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cat.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Tag size={18} className="text-gp-ink/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-0.5 md:gap-4">
                      <div className="min-w-0 flex items-baseline gap-2 md:block">
                        <LangTag>FR</LangTag>
                        <p className="font-semibold text-gp-ink leading-snug md:truncate">{cat.labels.fr}</p>
                      </div>
                      <div className="min-w-0 flex items-baseline gap-2 md:block">
                        <LangTag>AR</LangTag>
                        <p className="text-sm md:text-base text-gp-ink/85 truncate md:text-left" dir="rtl" lang="ar">{cat.labels.ar}</p>
                      </div>
                      <div className="min-w-0 flex items-baseline gap-2 md:block">
                        <LangTag>EN</LangTag>
                        <p className="text-sm md:text-base text-gp-ink/85 truncate" lang="en">{cat.labels.en}</p>
                      </div>
                    </div>
                    <div className="flex items-center shrink-0">
                      <button
                        onClick={() => startEdit(cat)}
                        disabled={editing.mode !== "none"}
                        className={cn(ICON_BTN_BASE, "hover:text-gp-raspberry hover:bg-gp-raspberry/[0.06]")}
                        title="Modifier"
                        aria-label={`Modifier ${cat.labels.fr}`}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        onClick={() => openDelete(cat)}
                        disabled={editing.mode !== "none"}
                        className={cn(ICON_BTN_BASE, "hover:text-red-700 hover:bg-red-50")}
                        title="Supprimer"
                        aria-label={`Supprimer ${cat.labels.fr}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Delete confirm dialog (same dialog as every other delete in the admin) */}
      {deleteState && (
        <ConfirmDialog
          title="Supprimer la catégorie ?"
          confirmLabel="Supprimer"
          loading={deleteState.loading}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteState(null)}
        >
          <p>« {deleteState.label} » sera supprimée définitivement (image incluse).</p>
          {deleteState.loading && deleteState.cakesAffected === null ? (
            <p className="flex items-center gap-2" role="status">
              <Loader2 size={14} className="animate-spin" /> Vérification...
            </p>
          ) : deleteState.cakesAffected && deleteState.cakesAffected > 0 ? (
            <p className="text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
              {deleteState.cakesAffected} gâteau{deleteState.cakesAffected > 1 ? "x" : ""} utilise{deleteState.cakesAffected > 1 ? "nt" : ""} cette catégorie.
              Ils resteront visibles mais leur catégorie ne pourra plus être modifiée vers celle-ci.
            </p>
          ) : (
            <p className="bg-gp-cream rounded-xl px-3.5 py-2.5">Aucun gâteau n&apos;utilise cette catégorie.</p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

function LangTag({ children }: { children: string }) {
  return (
    <span className="shrink-0 w-6 md:w-auto text-[11px] font-semibold uppercase tracking-[0.12em] text-gp-ink/65 md:block md:mb-0.5">
      {children}
    </span>
  );
}
function EditorRow({
  id,
  data,
  saving,
  onChangeLabel,
  onImageUploaded,
  onRemoveImage,
  onSave,
  onCancel,
}: {
  id: string;
  data: EditorPayload;
  saving: boolean;
  onChangeLabel: (field: "fr" | "ar" | "en", value: string) => void;
  onImageUploaded: (url: string) => void;
  onRemoveImage: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState("");

  async function handleTranslate() {
    const fr = data.labels.fr.trim();
    if (!fr) {
      setTranslateError("Saisissez d'abord le libellé FR.");
      return;
    }
    setTranslating(true);
    setTranslateError("");
    try {
      const res = await fetch("/api/admin/translate-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fr }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Translation failed (${res.status})`);
      }
      const json = (await res.json()) as { ar?: string; en?: string };
      if (json.ar) onChangeLabel("ar", json.ar);
      if (json.en) onChangeLabel("en", json.en);
    } catch (e) {
      setTranslateError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setTranslating(false);
    }
  }

  async function handleFile(rawFile: File | null) {
    if (!rawFile) return;
    setUploadError("");
    setUploading(true);
    try {
      // Compress on-device first to keep upload times fast.
      let file = rawFile;
      try {
        file = await compressImage(rawFile);
      } catch {
        /* fall back to original */
      }
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          scope: "categories",
          files: [{ contentType: file.type, contentLength: file.size }],
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || `Upload failed (${res.status})`);
      }
      const json = (await res.json()) as {
        uploads: Array<{ uploadUrl?: string; publicUrl?: string; error?: string }>;
      };
      const slot = json.uploads[0];
      if (!slot || slot.error || !slot.uploadUrl || !slot.publicUrl) {
        throw new Error(slot?.error || "Échec du téléchargement");
      }
      const put = await fetch(slot.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error(`S3 upload failed (${put.status})`);
      onImageUploaded(slot.publicUrl);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="relative px-4 py-4 bg-gp-champagne/40 border-b border-gp-gold/30">
      {/* Gold edge: this row is being edited. */}
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-gp-gold" />
      <div className="flex flex-col md:flex-row gap-3 mb-3">
        {/* Image upload tile */}
        <div className="w-28 shrink-0">
          <div
            role={data.image ? undefined : "button"}
            tabIndex={data.image ? undefined : 0}
            aria-label={data.image ? undefined : "Ajouter une image"}
            onKeyDown={(e) => {
              if (!data.image && !uploading && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                fileRef.current?.click();
              }
            }}
            onClick={() => !uploading && !data.image && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              if (!data.image && !uploading) handleFile(e.dataTransfer.files?.[0] || null);
            }}
            className={`relative w-full aspect-square rounded-xl overflow-hidden bg-gp-paper border-2 border-dashed transition ${
              data.image ? "border-transparent" : "border-gp-ink/30 hover:border-gp-raspberry/60 cursor-pointer"
            }`}
          >
            {data.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.image} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveImage();
                  }}
                  className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center bg-gp-paper/95 rounded-full text-red-700 hover:bg-gp-paper shadow-sm"
                  title="Retirer l'image"
                  aria-label="Retirer l'image"
                >
                  <X size={15} />
                </button>
              </>
            ) : uploading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gp-ink/65">
                <Loader2 size={18} className="animate-spin mb-1" />
                <span className="text-xs font-medium">Téléchargement…</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gp-ink/65">
                <ImagePlus size={18} className="mb-1" />
                <span className="text-xs font-medium px-2 text-center">Image (optionnelle)</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </div>
          {uploadError && <p role="alert" className="text-xs font-medium text-red-700 mt-1">{uploadError}</p>}
        </div>

        {/* Label inputs */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <label htmlFor={`cat-fr-${id}`} className="block text-[13px] font-medium text-gp-ink/80">
                Français (requis)
              </label>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating || !data.labels.fr.trim()}
                title="Traduire en arabe + anglais avec l'IA"
                className={cn(BTN_AI, "px-3 text-xs")}
              >
                {translating ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                {translating ? "Traduction…" : "Traduire IA"}
              </button>
            </div>
            <input
              id={`cat-fr-${id}`}
              type="text"
              value={data.labels.fr}
              onChange={(e) => onChangeLabel("fr", e.target.value)}
              placeholder="Ex: Mariage & Fiançailles"
              autoFocus
              className={INPUT}
            />
            {translateError && (
              <p role="alert" className="text-xs font-medium text-red-700 mt-1">{translateError}</p>
            )}
          </div>
          <div>
            <label htmlFor={`cat-ar-${id}`} className="block text-[13px] font-medium text-gp-ink/80 mb-1.5">Arabe (optionnel)</label>
            <input
              id={`cat-ar-${id}`}
              type="text"
              value={data.labels.ar}
              onChange={(e) => onChangeLabel("ar", e.target.value)}
              placeholder="مثل: زفاف وخطوبة"
              dir="rtl"
              lang="ar"
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor={`cat-en-${id}`} className="block text-[13px] font-medium text-gp-ink/80 mb-1.5">Anglais (optionnel)</label>
            <input
              id={`cat-en-${id}`}
              type="text"
              value={data.labels.en}
              onChange={(e) => onChangeLabel("en", e.target.value)}
              placeholder="Ex: Wedding & Engagement"
              lang="en"
              className={INPUT}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} disabled={saving || uploading} className={BTN_GHOST}>
          <X size={16} /> Annuler
        </button>
        <button onClick={onSave} disabled={saving || uploading || !data.labels.fr.trim()} className={BTN_PRIMARY}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          Enregistrer
        </button>
      </div>
    </div>  );
}
