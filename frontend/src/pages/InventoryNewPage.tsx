import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Article {
  id: number;
  reference: string;
  active: boolean;
}

interface Location {
  id: number;
  code: string;
  active: boolean;
}

const inputClass = "w-full border rounded px-3 py-2";

export default function InventoryNewPage() {
  const navigate = useNavigate();
  const [reference, setReference] = useState("");
  const [locationId, setLocationId] = useState("");
  const [lines, setLines] = useState([{ articleId: "", theoreticalQuantity: "", countedQuantity: "" }]);
  const [error, setError] = useState("");

  const articlesQuery = useQuery({
    queryKey: ["articles-select"],
    queryFn: async () => (await api.get("/articles", { params: { limit: 200 } })).data as { data: Article[] },
  });

  const locationsQuery = useQuery({
    queryKey: ["locations-select"],
    queryFn: async () => (await api.get("/locations", { params: { limit: 200 } })).data as { data: Location[] },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/inventories", {
        reference,
        locationId: Number(locationId),
        items: lines.map((l) => ({
          articleId: Number(l.articleId),
          theoreticalQuantity: Number(l.theoreticalQuantity),
          countedQuantity: Number(l.countedQuantity),
        })),
      });
      return data as { id: number };
    },
    onSuccess: (inventory) => navigate(`/inventories/${inventory.id}`),
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Erreur.",
      );
    },
  });

  if (articlesQuery.isLoading || locationsQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const articles = articlesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    await createMutation.mutateAsync();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Nouvel inventaire</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Référence *</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              className={inputClass}
              placeholder="INV-2026-002"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Emplacement *</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Choisir...</option>
              {locations
                .filter((l) => l.active)
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code}
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-2">Lignes</h3>
          {lines.map((line, index) => (
            <div key={index} className="grid grid-cols-3 gap-3 mb-3">
              <select
                value={line.articleId}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...next[index], articleId: e.target.value };
                  setLines(next);
                }}
                required
                className={inputClass}
              >
                <option value="">Article</option>
                {articles
                  .filter((a) => a.active)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.reference}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                min="0"
                placeholder="Théorique"
                value={line.theoreticalQuantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...next[index], theoreticalQuantity: e.target.value };
                  setLines(next);
                }}
                required
                className={inputClass}
              />
              <input
                type="number"
                min="0"
                placeholder="Compté"
                value={line.countedQuantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...next[index], countedQuantity: e.target.value };
                  setLines(next);
                }}
                required
                className={inputClass}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines([...lines, { articleId: "", theoreticalQuantity: "", countedQuantity: "" }])}
            className="text-blue-600 text-sm hover:underline"
          >
            + Ajouter une ligne
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? "Création..." : "Créer l'inventaire"}
        </button>
      </form>
    </div>
  );
}