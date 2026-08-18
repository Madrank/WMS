import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Movement {
  id: number;
  type: string;
  articleId: number;
  quantity: number;
  sourceLocationId: number | null;
  destinationLocationId: number | null;
  reason: string | null;
  createdAt: string;
}

interface Article {
  id: number;
  reference: string;
  name: string;
}

interface Location {
  id: number;
  code: string;
}

const typeLabels: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  TRANSFER: "Transfert",
  ADJUSTMENT: "Ajustement",
};

export default function MovementsPage() {
  const movementsQuery = useQuery({
    queryKey: ["movements"],
    queryFn: async () => (await api.get("/movements", { params: { limit: 100 } })).data as { data: Movement[] },
  });

  const articlesQuery = useQuery({
    queryKey: ["articles-select"],
    queryFn: async () => (await api.get("/articles", { params: { limit: 200 } })).data as { data: Article[] },
  });

  const locationsQuery = useQuery({
    queryKey: ["locations-select"],
    queryFn: async () => (await api.get("/locations", { params: { limit: 200 } })).data as { data: Location[] },
  });

  if (movementsQuery.isLoading || articlesQuery.isLoading || locationsQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const movements = movementsQuery.data?.data ?? [];
  const articles = articlesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mouvements</h1>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Type</th>
            <th className="p-3">Article</th>
            <th className="p-3">Quantité</th>
            <th className="p-3">Source</th>
            <th className="p-3">Destination</th>
            <th className="p-3">Motif</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => {
            const article = articles.find((a) => a.id === m.articleId);
            const source = locations.find((l) => l.id === m.sourceLocationId);
            const dest = locations.find((l) => l.id === m.destinationLocationId);
            const isNegative = m.type === "OUT" || m.type === "ADJUSTMENT";
            return (
              <tr key={m.id} className="border-b">
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      m.type === "IN"
                        ? "bg-green-100 text-green-700"
                        : m.type === "OUT"
                          ? "bg-red-100 text-red-700"
                          : m.type === "TRANSFER"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {typeLabels[m.type] ?? m.type}
                  </span>
                </td>
                <td className="p-3">
                  {article ? `${article.reference} — ${article.name}` : `#${m.articleId}`}
                </td>
                <td className={`p-3 font-semibold ${isNegative ? "text-red-600" : "text-green-600"}`}>
                  {isNegative ? "−" : "+"}{m.quantity}
                </td>
                <td className="p-3">{source?.code ?? "—"}</td>
                <td className="p-3">{dest?.code ?? "—"}</td>
                <td className="p-3 text-gray-600">{m.reason ?? "—"}</td>
                <td className="p-3">{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}