type Session = {
  session_id: string;
  duration_seconds: number;
  started_at: string;
  referrer: string | null;
};

export default function SessionsTable({ sessions }: { sessions: Session[] }) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg">
      <table className="w-full text-sm">
        <thead className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left p-3">Início</th>
            <th className="text-left p-3">Sessão</th>
            <th className="text-left p-3">Tempo</th>
            <th className="text-left p-3">Origem</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.session_id} className="border-t border-border">
              <td className="p-3 whitespace-nowrap">{new Date(s.started_at).toLocaleString("pt-BR")}</td>
              <td className="p-3 font-mono text-xs text-muted-foreground">{s.session_id.slice(0, 8)}</td>
              <td className="p-3">{s.duration_seconds}s</td>
              <td className="p-3 text-muted-foreground truncate max-w-xs">{s.referrer || "Direto"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
