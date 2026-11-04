"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_BTN_BASE } from "./ui";

export default function DeleteCakeButton({ id }: { id: string }) {
  return (
    <button
      type="button"
      onClick={async () => {
        if (!confirm("Supprimer ce gâteau ?")) return;
        await fetch(`/api/admin/cakes/${id}`, { method: "DELETE" });
        window.location.reload();
      }}
      className={cn(ICON_BTN_BASE, "hover:text-red-700 hover:bg-red-50")}
      title="Supprimer"
      aria-label="Supprimer"
    >
      <Trash2 size={17} />
    </button>
  );
}
