import { useState } from "react";
import WhatsAppSettingsTab from "./WhatsAppSettingsTab";
import WhatsAppCampaignsTab from "./WhatsAppCampaignsTab";
import WhatsAppComplianceTab from "./WhatsAppComplianceTab";

export default function WhatsAppAdmin() {
  const [sub, setSub] = useState<"campaigns" | "settings" | "compliance">("campaigns");
  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border">
        {[
          { id: "campaigns", label: "Campanhas" },
          { id: "settings", label: "Configurações" },
          { id: "compliance", label: "Bloqueios & Opt-outs" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id as any)}
            className={`px-4 py-2 text-sm border-b-2 transition ${sub === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {sub === "campaigns" && <WhatsAppCampaignsTab />}
      {sub === "settings" && <WhatsAppSettingsTab />}
      {sub === "compliance" && <WhatsAppComplianceTab />}
    </div>
  );
}
