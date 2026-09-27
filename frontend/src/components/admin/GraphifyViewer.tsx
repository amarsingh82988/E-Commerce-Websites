import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

type Node = {
  id: string;
  type?: string;
  name?: string;
};

type GraphData = {
  nodes: Node[];
  links: { source: string; target: string }[];
};

export function GraphifyViewer() {
  const [data, setData] = useState<GraphData | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/graph.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load graph data");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-muted-foreground p-4">Loading graph data...</div>;
  if (error) return <div className="text-destructive p-4">Error: {error}</div>;
  if (!data) return null;

  const filteredNodes = data.nodes.filter((node) =>
    (node.name || node.id).toLowerCase().includes(query.toLowerCase())
  ).slice(0, 50);

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl mb-4">Graphify Codebase Query</h2>
      <Input
        type="search"
        placeholder="Search nodes by name or ID..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4"
      />
      <div className="max-h-[400px] overflow-y-auto rounded-md border border-border bg-secondary/20 p-4">
        {filteredNodes.length > 0 ? (
          <ul className="space-y-2">
            {filteredNodes.map((node) => (
              <li key={node.id} className="text-sm font-mono break-all">
                <span className="text-accent font-semibold">{node.type || "node"}</span>: {node.name || node.id}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No matches found.</p>
        )}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Total nodes: {data.nodes.length} | Total edges: {data.links?.length || 0}
      </p>
    </div>
  );
}
