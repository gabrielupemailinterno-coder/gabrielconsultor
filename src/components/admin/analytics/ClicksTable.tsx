type Click = {
  id: string;
  session_id: string;
  element_type: string | null;
  element_label: string | null;
  created_at: string;
};

export default function ClicksTable({ clicks }: { clicks: Click[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-3">Data</th>
            <th className="text-left p-3">Tipo</th>
            <th className="text-left p-3">Rótulo</th>
            <th className="text-left p-3">Sessão</th>
          </tr>
        </thead>
        <tbody>
          {clicks.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{new Date(c.created_at).toLocaleString("pt-BR")}</td>
              <td className="p-3">
                <span className="px-2 py-0.5 bg-secondary rounded text-xs">{c.element_type}</span>
              </td>
              <td className="p-3">{c.element_label}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{c.session_id.slice(0, 8)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
