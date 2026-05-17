"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Upload, X, Loader2, Save, ChevronDown,
  Globe, GripVertical, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminCake } from "@/lib/admin-data";
import type { Category } from "@/lib/db-types";

type Lang = "fr" | "ar" | "en";
const LANGS: { code: Lang; label: string; flag: string; dir: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "ar", label: "العربية", flag: "🇩🇿", dir: "rtl" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
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
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [uploadError, setUploadError] = useState("");
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
  const [published, setPublished] = useState(cake?.published ?? true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiError, setAiError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setUploadError("");
    setUploadProgress({ done: 0, total: arr.length });

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cakeId: cakeIdRef.current,
          files: arr.map((f) => ({
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
        arr.map(async (file, i) => {
          const slot = data.uploads[i];
          if (!slot || slot.error || !slot.uploadUrl || !slot.publicUrl) {
            console.warn(`[upload] ${file.name}: ${slot?.error || "no slot"}`);
            done++;
            setUploadProgress({ done, total: arr.length });
            return;
          }
          const putRes = await fetch(slot.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          done++;
          setUploadProgress({ done, total: arr.length });
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
      if (uploaded.length < arr.length) {
        setUploadError(`${arr.length - uploaded.length} fichier(s) n'ont pas pu être téléchargés.`);
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

  function moveImage(from: number, to: number) {
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            {mode === "new" ? "Nouveau gâteau" : "Modifier le gâteau"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {mode === "new" ? "Ajoutez une nouvelle création" : "Mettez à jour les informations"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600 font-medium">
              {published ? "Publié" : "Brouillon"}
            </span>
            <div
              onClick={() => setPublished(!published)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors cursor-pointer",
                published ? "bg-green-400" : "bg-gray-300"
              )}
            >
              <div className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                published ? "translate-x-5" : "translate-x-0"
              )} />
            </div>
          </label>

          <button
            onClick={handleSave}
            disabled={saving || !translations.fr.title || uploading || noCategories}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}
            {saving ? "Enregistrement..." : saved ? "Enregistré !" : "Enregistrer"}
          </button>
        </div>
      </div>

      {noCategories && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          Aucune catégorie disponible. Créez-en au moins une dans{" "}
          <a href="/admin/categories" className="font-semibold underline">Catégories</a>{" "}avant d&apos;ajouter un gâteau.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left col — images + category */}
        <div className="lg:col-span-1 space-y-4">
          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Photos</h3>

            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50/30 transition-colors mb-3"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-rose-400 mx-auto mb-1" />
              ) : (
                <Upload size={20} className="text-gray-400 mx-auto mb-1" />
              )}
              <p className="text-xs text-gray-500">
                {uploading
                  ? `Téléchargement ${uploadProgress!.done}/${uploadProgress!.total}...`
                  : "Cliquez ou glissez vos photos"}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {uploadError && (
              <p className="text-xs text-red-500 mb-2">{uploadError}</p>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => (
                  <div key={img} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute top-1 left-1 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                        Principale
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      {i > 0 && (
                        <button
                          onClick={() => moveImage(i, i - 1)}
                          className="p-1 bg-white rounded-lg text-gray-600 hover:text-rose-500"
                          title="Déplacer à gauche"
                        >
                          <GripVertical size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        className="p-1 bg-white rounded-lg text-red-500"
                        title="Supprimer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {images.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-2">La 1ère photo sera la photo principale.</p>
            )}
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Catégorie</h3>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={noCategories}
                className="w-full px-3 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.labels.fr}{c.id.startsWith("__ghost__") ? " (supprimée)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <p className="text-[10px] text-gray-400 mt-2">
              Gérer la liste dans <a href="/admin/categories" className="text-rose-500 hover:underline">Catégories</a>.
            </p>
          </div>

          {/* Dimensions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm">Dimensions & Portions</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { key: "length", label: "Long. (cm)" },
                { key: "width", label: "Larg. (cm)" },
                { key: "height", label: "Haut. (cm)" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[10px] text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={dims[key as keyof typeof dims]}
                    onChange={(e) => setDims((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-100 outline-none text-center"
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
                  <label className="block text-[10px] text-gray-400 mb-1">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={dims[key as keyof typeof dims]}
                    onChange={(e) => setDims((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full px-2 py-2 rounded-lg border border-gray-200 text-sm focus:border-rose-400 focus:ring-1 focus:ring-rose-100 outline-none text-center"
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Featured */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="font-semibold text-gray-700 text-sm">Gâteau à la une</p>
                <p className="text-xs text-gray-400">Affiché en premier sur la page d&apos;accueil</p>
              </div>
              <div
                onClick={() => setFeatured(!featured)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors cursor-pointer",
                  featured ? "bg-rose-400" : "bg-gray-300"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                  featured ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </label>
          </div>
        </div>

        {/* Right col — titles + descriptions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={15} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">Titres & Descriptions</span>
            </div>

            <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setActiveLang(l.code)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
                    activeLang === l.code
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <span>{l.flag}</span>
                  <span className="hidden sm:inline">{l.label}</span>
                  {translations[l.code].title && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  )}
                </button>
              ))}
            </div>

            <div className="space-y-3" dir={LANGS.find((l) => l.code === activeLang)?.dir}>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  Titre {activeLang === "fr" ? "(requis)" : "(rempli par l'IA ou copié du FR)"}
                </label>
                <input
                  type="text"
                  value={cur.title}
                  onChange={(e) =>
                    setTranslations((t) => ({
                      ...t,
                      [activeLang]: { ...t[activeLang], title: e.target.value },
                    }))
                  }
                  placeholder={activeLang === "fr" ? "Ex: Gâteau Princesse" : activeLang === "ar" ? "عنوان الكعكة" : "Cake title"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-gray-500">Description</label>
                  {activeLang === "fr" && (
                    <button
                      onClick={handleGenerate}
                      disabled={generating || !translations.fr.title}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-medium hover:bg-violet-600 disabled:opacity-50 transition"
                    >
                      {generating ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Sparkles size={12} />
                      )}
                      {generating ? "Génération IA..." : "Traduire & générer (IA)"}
                    </button>
                  )}
                </div>
                <textarea
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-sm transition resize-none"
                />
                {aiError && (
                  <p className="text-xs text-red-500 mt-1">{aiError}</p>
                )}
                {activeLang === "fr" && !aiError && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    💡 L&apos;IA traduit le titre FR vers AR/EN et génère les 3 descriptions en une fois.
                    Ajoutez des photos avant de générer pour un meilleur résultat.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview card */}
          {(images[0] || translations.fr.title) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Aperçu</h3>
              <div className="flex gap-4 items-start">
                {images[0] && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">
                    {translations.fr.title || "—"}
                  </p>
                  <p className="text-xs text-rose-500 mt-0.5">
                    {categoryOptions.find((c) => c.slug === category)?.labels.fr || "—"}
                  </p>
                  {translations.fr.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {translations.fr.description}
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gray-400">
                    {dims.persons && <span>👥 {dims.persons} pers.</span>}
                    {dims.pieces && <span>🍰 {dims.pieces} portions</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
