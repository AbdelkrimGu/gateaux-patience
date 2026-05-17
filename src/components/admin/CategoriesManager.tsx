"use client";

import { useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, Check, X, Loader2, Tag, AlertTriangle,
  Upload, ImagePlus, Sparkles,
} from "lucide-react";
import type { Category } from "@/lib/db-types";

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
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Catégories</h1>
          <p className="text-sm text-gray-500">
            {categories.length} catégorie{categories.length !== 1 ? "s" : ""} ·
            libellés et image modifiables
          </p>
        </div>
        <button
          onClick={startNew}
          disabled={editing.mode !== "none"}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition shadow-sm"
        >
          <Plus size={15} />
          Nouvelle catégorie
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

        {categories.length === 0 && editing.mode !== "new" ? (
          <div className="text-center py-12 px-4">
            <Tag size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="font-semibold text-gray-700">Aucune catégorie</p>
            <p className="text-sm text-gray-400 mt-1">
              Ajoutez votre première catégorie pour commencer à classer vos gâteaux.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
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
                <li key={cat.id} className="px-4 py-3 hover:bg-gray-50/60 transition flex items-center gap-3">
                  {/* Image thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {cat.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Tag size={16} className="text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">🇫🇷 FR</p>
                      <p className="font-medium text-gray-800 truncate">{cat.labels.fr}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">🇩🇿 AR</p>
                      <p className="text-gray-700 truncate" dir="rtl">{cat.labels.ar}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">🇬🇧 EN</p>
                      <p className="text-gray-700 truncate">{cat.labels.en}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(cat)}
                      disabled={editing.mode !== "none"}
                      className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-40 transition"
                      title="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => openDelete(cat)}
                      disabled={editing.mode !== "none"}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {/* Delete confirm dialog */}
      {deleteState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Supprimer la catégorie ?</h2>
                <p className="text-sm text-gray-500 mt-1">
                  « {deleteState.label} » sera supprimée définitivement (image incluse).
                </p>
              </div>
            </div>
            {deleteState.loading ? (
              <p className="text-sm text-gray-400 flex items-center gap-2 mb-4">
                <Loader2 size={14} className="animate-spin" /> Vérification...
              </p>
            ) : deleteState.cakesAffected && deleteState.cakesAffected > 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                {deleteState.cakesAffected} gâteau{deleteState.cakesAffected > 1 ? "x" : ""} utilise{deleteState.cakesAffected > 1 ? "nt" : ""} cette catégorie.
                Ils resteront visibles mais leur catégorie ne pourra plus être modifiée vers celle-ci.
              </p>
            ) : (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                Aucun gâteau n&apos;utilise cette catégorie.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteState(null)}
                disabled={deleteState.loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteState.loading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
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
    <div className="px-4 py-3 bg-rose-50/40 border-b border-rose-100">
      <div className="flex flex-col md:flex-row gap-3 mb-3">
        {/* Image upload tile */}
        <div className="md:w-28 shrink-0">
          <div
            onClick={() => !uploading && !data.image && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => {
              e.preventDefault();
              if (!data.image && !uploading) handleFile(e.dataTransfer.files?.[0] || null);
            }}
            className={`relative w-full aspect-square rounded-xl overflow-hidden bg-white border-2 border-dashed transition ${
              data.image ? "border-transparent" : "border-gray-200 hover:border-rose-300 cursor-pointer"
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
                  className="absolute top-1 right-1 p-1 bg-white/90 rounded-lg text-red-500 hover:bg-white shadow-sm"
                  title="Retirer l'image"
                >
                  <X size={12} />
                </button>
              </>
            ) : uploading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Loader2 size={18} className="animate-spin mb-1" />
                <span className="text-[10px]">Téléchargement…</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <ImagePlus size={18} className="mb-1" />
                <span className="text-[10px] px-2 text-center">Image (optionnelle)</span>
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
          {uploadError && <p className="text-[10px] text-red-500 mt-1">{uploadError}</p>}
        </div>

        {/* Label inputs */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] uppercase tracking-wide text-gray-500">🇫🇷 FR (requis)</label>
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating || !data.labels.fr.trim()}
                title="Traduire en arabe + anglais avec l'IA"
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-50 transition"
              >
                {translating ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <Sparkles size={10} />
                )}
                {translating ? "..." : "Traduire IA"}
              </button>
            </div>
            <input
              type="text"
              value={data.labels.fr}
              onChange={(e) => onChangeLabel("fr", e.target.value)}
              placeholder="Ex: Mariage & Fiançailles"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
            />
            {translateError && (
              <p className="text-[10px] text-red-500 mt-1">{translateError}</p>
            )}
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">🇩🇿 AR (optionnel)</label>
            <input
              type="text"
              value={data.labels.ar}
              onChange={(e) => onChangeLabel("ar", e.target.value)}
              placeholder="مثل: زفاف وخطوبة"
              dir="rtl"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">🇬🇧 EN (optionnel)</label>
            <input
              type="text"
              value={data.labels.en}
              onChange={(e) => onChangeLabel("en", e.target.value)}
              placeholder="Ex: Wedding & Engagement"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={saving || uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          <X size={13} /> Annuler
        </button>
        <button
          onClick={onSave}
          disabled={saving || uploading || !data.labels.fr.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
