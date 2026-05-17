"use client";

import { Trash2 } from "lucide-react";

export default function DeleteCakeButton({ id }: { id: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (!confirm("Supprimer ce gâteau ?")) return;
        await fetch(`/api/admin/cakes/${id}`, { method: "DELETE" });
        window.location.reload();
      }}
      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
      title="Supprimer"
    >
      <Trash2 size={15} />
    </button>
  );
}
