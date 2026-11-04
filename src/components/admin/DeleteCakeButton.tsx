"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "./dialogs";
import { ICON_BUTTON_DANGER } from "./ui";

export default function DeleteCakeButton({ id, title }: { id: string; title?: string }) {
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cakes/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      window.location.reload();
    } catch {
      // Offline or server error: the dialog stays, she can retry or cancel.
      setError("La suppression n'a pas abouti. Vérifiez la connexion puis réessayez.");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setAsking(true);
        }}
        className={ICON_BUTTON_DANGER}
        title="Supprimer"
        aria-label={title ? `Supprimer « ${title} »` : "Supprimer ce gâteau"}
      >
        <Trash2 size={17} />
      </button>
      {asking && (
        <ConfirmDialog
          title="Supprimer ce gâteau ?"
          confirmLabel={error ? "Réessayer" : "Supprimer"}
          loading={deleting}
          error={error}
          onCancel={() => setAsking(false)}
          onConfirm={() => void remove()}
        >
          {title && <p>« {title} » sera retiré du site.</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
