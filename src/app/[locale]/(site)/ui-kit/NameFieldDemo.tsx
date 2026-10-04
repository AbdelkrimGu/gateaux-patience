"use client";

import { useState } from "react";
import { NameField } from "@/components/ui/NameField";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// Kit demo: the name flows into the WhatsApp brief.
export function NameFieldDemo({ locale, label, placeholder }: { locale: string; label: string; placeholder: string }) {
  const [name, setName] = useState("");
  const href = buildWhatsAppUrl({ locale, kind: "general", name });
  return (
    <div className="grid gap-2">
      <NameField value={name} onChange={setName} label={label} placeholder={placeholder} />
      <code className="block truncate text-xs text-ink-muted" dir="ltr">
        {decodeURIComponent(href.split("?text=")[1] ?? "").replace(/\n/g, " / ")}
      </code>
    </div>
  );
}
