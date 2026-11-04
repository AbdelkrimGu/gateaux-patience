"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./dialogs";
import { ICON_BTN_BASE } from "./ui";

export default function DeleteCakeButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    if (loading) return; // no double submit
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cakes/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error();
      window.location.reload();
    } catch {
      setError("La suppression n'a pas abouti. Vérifiez la connexion et réessayez.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={cn(ICON_BTN_BASE, "hover:text-red-700 hover:bg-red-50")}
        title="Supprimer"
        aria-label={`Supprimer « ${title} »`}
      >
        <Trash2 size={17} />
      </button>
      {open && (
        <ConfirmDialog
          title={`Supprimer « ${title} » ?`}
          confirmLabel="Supprimer"
          loading={loading}
          error={error}
          onConfirm={confirmDelete}
          onCancel={() => setOpen(false)}
        >
          <p>Le gâteau et ses photos seront retirés du site et de l&apos;administration.</p>
        </ConfirmDialog>
      )}
    </>
  );
}
