import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { listUsers } from "../services/userService.js";
import { getCurrentUser } from "../services/authService.js";

interface Movement {
  id: number;
  type: string;
  articleId: number;
  quantity: number;
  sourceLocationId: number | null;
  destinationLocationId: number | null;
  userId: number;
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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const typeLabels: Record<string, string> = {
  IN: "Entrée",
  OUT: "Sortie",
  TRANSFER: "Transfert",
  ADJUSTMENT: "Ajustement",
};

const PAGE_SIZE = 20;

export default function MovementsPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [articleId, setArticleId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const user = getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const movementsQuery = useQuery({
    queryKey: ["movements", search, type, articleId, locationId, userId, from, to, page],
    queryFn: async () =>
      (
        await api.get("/movements", {
          params: {
            search: search || undefined,
            type: type || undefined,
            articleId: articleId || undefined,
            locationId: locationId || undefined,
            userId: userId || undefined,
            from: from || undefined,
            to: to || undefined,
            page,
            limit: PAGE_SIZE,
          },
        })
      ).data as { data: Movement[]; pagination: Pagination },
  });

  const articlesQuery = useQuery({
    queryKey: ["articles-select"],
    queryFn: async () => (await api.get("/articles", { params: { limit: 200 } })).data as { data: Article[] },
  });

  const locationsQuery = useQuery({
    queryKey: ["locations-select"],
    queryFn: async () => (await api.get("/locations", { params: { limit: 200 } })).data as { data: Location[] },
  });

  const usersQuery = useQuery({
    queryKey: ["users-select"],
    queryFn: () => listUsers({ limit: 200 }),
    enabled: isAdmin,
  });

  if (movementsQuery.isLoading || articlesQuery.isLoading || locationsQuery.isLoading || (isAdmin && usersQuery.isLoading)) {
    return <p>Chargement...</p>;
  }

  const movements = movementsQuery.data?.data ?? [];
  const pagination = movementsQuery.data?.pagination;
  const articles = articlesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Mouvements</h1>

      <div className="bg-white rounded shadow p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher un motif..."
          className="border rounded px-3 py-2"
        />
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">Tous les types</option>
          <option value="IN">Entrée</option>
          <option value="OUT">Sortie</option>
          <option value="TRANSFER">Transfert</option>
          <option value="ADJUSTMENT">Ajustement</option>
        </select>
        <select
          value={articleId}
          onChange={(e) => {
            setArticleId(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">Tous les produits</option>
          {articles.map((a) => (
            <option key={a.id} value={a.id}>
              {a.reference} — {a.name}
            </option>
          ))}
        </select>
        <select
          value={locationId}
          onChange={(e) => {
            setLocationId(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
        >
          <option value="">Tous les emplacements</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code}
            </option>
          ))}
        </select>
        {isAdmin && (
          <select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setPage(1);
            }}
            className="border rounded px-3 py-2"
          >
            <option value="">Tous les utilisateurs</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName}
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
          title="Du"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
          title="Au"
        />
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Type</th>
            <th className="p-3">Article</th>
            <th className="p-3">Quantité</th>
            <th className="p-3">Source</th>
            <th className="p-3">Destination</th>
            <th className="p-3">Utilisateur</th>
            <th className="p-3">Motif</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m) => {
            const article = articles.find((a) => a.id === m.articleId);
            const source = locations.find((l) => l.id === m.sourceLocationId);
            const dest = locations.find((l) => l.id === m.destinationLocationId);
            const movementUser = users.find((u) => u.id === m.userId);
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
                <td className="p-3">
                  {isAdmin && movementUser ? `${movementUser.firstName} ${movementUser.lastName}` : `#${m.userId}`}
                </td>
                <td className="p-3 text-gray-600">{m.reason ?? "—"}</td>
                <td className="p-3">{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} / {pagination.totalPages} ({pagination.total} mouvements)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}