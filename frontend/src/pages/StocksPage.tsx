import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface StockRow {
  id: number;
  articleId: number;
  locationId: number;
  quantity: number;
}

interface Article {
  id: number;
  reference: string;
  name: string;
  active: boolean;
}

interface Location {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

interface Zone {
  id: number;
  code: string;
  name: string;
}

export default function StocksPage() {
  const [type, setType] = useState("IN");
  const [articleId, setArticleId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [search, setSearch] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const stocksQuery = useQuery({
    queryKey: ["stocks", search, zoneId],
    queryFn: async () =>
      (
        await api.get("/stocks", {
          params: { limit: 200, search: search || undefined, zoneId: zoneId || undefined },
        })
      ).data as { data: StockRow[] },
  });

  const articlesQuery = useQuery({
    queryKey: ["articles-select"],
    queryFn: async () => (await api.get("/articles", { params: { limit: 200 } })).data as { data: Article[] },
  });

  const locationsQuery = useQuery({
    queryKey: ["locations-select"],
    queryFn: async () => (await api.get("/locations", { params: { limit: 200 } })).data as { data: Location[] },
  });

  const zonesQuery = useQuery({
    queryKey: ["zones-select"],
    queryFn: async () => (await api.get("/zones", { params: { limit: 200 } })).data as { data: Zone[] },
  });

  const movementMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        type,
        articleId: Number(articleId),
        quantity: Number(quantity),
        reason: "Saisie manuelle",
      };
      if (type === "IN") payload.destinationLocationId = Number(locationId);
      if (type === "OUT") payload.sourceLocationId = Number(locationId);
      if (type === "TRANSFER") {
        const [source, dest] = locationId.split(",");
        payload.sourceLocationId = Number(source);
        payload.destinationLocationId = Number(dest);
      }
      await api.post("/movements", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setError("");
      setQuantity("");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(message ?? "Erreur lors du mouvement.");
    },
  });

  if (stocksQuery.isLoading || articlesQuery.isLoading || locationsQuery.isLoading || zonesQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const stocks = stocksQuery.data?.data ?? [];
  const articles = articlesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];
  const zones = zonesQuery.data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await movementMutation.mutateAsync();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Stocks</h1>

      <div className="bg-white rounded shadow p-6 mb-6 max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">Nouveau mouvement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="IN">Entrée</option>
              <option value="OUT">Sortie</option>
              <option value="TRANSFER">Transfert</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Article</label>
            <select
              value={articleId}
              onChange={(e) => setArticleId(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Choisir...</option>
              {articles.filter((a) => a.active).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.reference} — {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {type === "TRANSFER" ? "Emplacements (source, destination)" : "Emplacement"}
            </label>
            <input
              type="text"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              placeholder={type === "TRANSFER" ? "1,2" : "1"}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {type === "TRANSFER"
                ? "Sépare les deux ID par une virgule (ex : 1,2)"
                : "Saisis l'ID de l'emplacement"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Quantité</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={movementMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {movementMutation.isPending ? "Envoi..." : "Enregistrer le mouvement"}
          </button>
        </form>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full max-w-sm border rounded px-3 py-2"
        />
        <select
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Toutes les zones</option>
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.code} — {zone.name}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Article</th>
            <th className="p-3">Emplacement</th>
            <th className="p-3">Quantité</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const article = articles.find((a) => a.id === stock.articleId);
            const location = locations.find((l) => l.id === stock.locationId);
            return (
              <tr key={stock.id} className="border-b">
                <td className="p-3">
                  {article ? `${article.reference} — ${article.name}` : `Article #${stock.articleId}`}
                </td>
                <td className="p-3">{location ? location.code : `#${stock.locationId}`}</td>
                <td className="p-3">{stock.quantity}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}