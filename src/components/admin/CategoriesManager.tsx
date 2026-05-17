"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, Tag, AlertTriangle } from "lucide-react";
import type { Category } from "@/lib/db-types";

interface Props {
  initial: Category[];
}

type EditingState =
  | { mode: "none" }
  | { mode: "new"; labels: { fr: string; ar: string; en: string } }
  | { mode: "edit"; id: string; labels: { fr: string; ar: string; en: string } };

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
    setEditing({ mode: "new", labels: { fr: "", ar: "", en: "" } });
  }

  function startEdit(cat: Category) {
    setError("");
    setEditing({ mode: "edit", id: cat.id, labels: { ...cat.labels } });
  }

  function cancelEdit() {
    setEditing({ mode: "none" });
    setError("");
  }

  function updateField(field: "fr" | "ar" | "en", value: string) {
    setEditing((e) => {
      if (e.mode === "none") return e;
      return { ...e, labels: { ...e.labels, [field]: value } };
    });
  }

  async function saveEdit() {
    if (editing.mode === "none") return;
    if (!editing.labels.fr.trim()) {
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
          body: JSON.stringify({ labels: editing.labels }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Création échouée");
        }
        const newCat = (await res.json()) as Category;
        setCategories((prev) => [...prev, newCat]);
      } else {
        const res = await fetch(`/api/admin/categories/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ labels: editing.labels }),
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
    // Fetch the affected count by attempting deletion preview — we don't have a dedicated
    // count endpoint, so we just open the dialog and let the user confirm. The DELETE call
    // returns the count, but we want to show it BEFORE confirming. Solution: query the
    // /api/admin/cakes endpoint and count locally.
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

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Catégories</h1>
          <p className="text-sm text-gray-500">
            {categories.length} catégorie{categories.length !== 1 ? "s" : ""} ·
            modifiables, leurs libellés se propagent aux gâteaux existants
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
            labels={editing.labels}
            saving={saving}
            onChange={updateField}
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
                    labels={editing.labels}
                    saving={saving}
                    onChange={updateField}
                    onSave={saveEdit}
                    onCancel={cancelEdit}
                  />
                </li>
              ) : (
                <li key={cat.id} className="px-4 py-3 hover:bg-gray-50/60 transition flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                    <Tag size={14} />
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
                  « {deleteState.label} » sera supprimée définitivement.
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
  labels,
  saving,
  onChange,
  onSave,
  onCancel,
}: {
  labels: { fr: string; ar: string; en: string };
  saving: boolean;
  onChange: (field: "fr" | "ar" | "en", value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="px-4 py-3 bg-rose-50/40 border-b border-rose-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">🇫🇷 FR (requis)</label>
          <input
            type="text"
            value={labels.fr}
            onChange={(e) => onChange("fr", e.target.value)}
            placeholder="Ex: Mariage & Fiançailles"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">🇩🇿 AR (optionnel)</label>
          <input
            type="text"
            value={labels.ar}
            onChange={(e) => onChange("ar", e.target.value)}
            placeholder="مثل: زفاف وخطوبة"
            dir="rtl"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">🇬🇧 EN (optionnel)</label>
          <input
            type="text"
            value={labels.en}
            onChange={(e) => onChange("en", e.target.value)}
            placeholder="Ex: Wedding & Engagement"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
        >
          <X size={13} /> Annuler
        </button>
        <button
          onClick={onSave}
          disabled={saving || !labels.fr.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
          Enregistrer
        </button>
      </div>
    </div>
  );
}
