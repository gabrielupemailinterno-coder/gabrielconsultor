type Visit = {
  id: string;
  session_id: string;
  path: string;
  referrer: string | null;
  created_at: string;
};

export default function VisitsTable({ visits }: { visits: Visit[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-3">Data</th>
            <th className="text-left p-3">Sessão</th>
            <th className="text-left p-3">Página</th>
            <th className="text-left p-3">Origem</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{new Date(v.created_at).toLocaleString("pt-BR")}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{v.session_id.slice(0, 8)}</td>
              <td className="p-3">{v.path}</td>
              <td className="p-3 text-muted-foreground truncate max-w-xs">{v.referrer || "Direto"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
