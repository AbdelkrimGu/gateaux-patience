"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "./pricing/ui";
import { ICON_BUTTON_DANGER } from "./ui";

export default function DeleteCakeButton({ id, title }: { id: string; title?: string }) {
  const [asking, setAsking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={ICON_BUTTON_DANGER}
        title="Supprimer"
        aria-label={title ? `Supprimer « ${title} »` : "Supprimer ce gâteau"}
      >
        <Trash2 size={17} />
      </button>
      {asking && (
        <ConfirmDialog
          title="Supprimer ce gâteau ?"
          confirmLabel="Supprimer"
          loading={deleting}
          onCancel={() => setAsking(false)}
          onConfirm={async () => {
            setDeleting(true);
            await fetch(`/api/admin/cakes/${id}`, { method: "DELETE" });
            window.location.reload();
          }}
        >
          {title && <p>« {title} » sera retiré du site.</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
