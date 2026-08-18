import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Inventory {
  id: number;
  reference: string;
  locationId: number;
  status: string;
  createdAt: string;
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

export default function InventoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [reference, setReference] = useState("");
  const [locationId, setLocationId] = useState("");
  const [lines, setLines] = useState([{ articleId: "", theoreticalQuantity: "", countedQuantity: "" }]);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const inventoriesQuery = useQuery({
    queryKey: ["inventories"],
    queryFn: async () => (await api.get("/inventories", { params: { limit: 100 } })).data as { data: Inventory[] },
  });

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
      await api.post("/inventories", {
        reference,
        locationId: Number(locationId),
        items: lines.map((l) => ({
          articleId: Number(l.articleId),
          theoreticalQuantity: Number(l.theoreticalQuantity),
          countedQuantity: Number(l.countedQuantity),
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      setReference("");
      setLines([{ articleId: "", theoreticalQuantity: "", countedQuantity: "" }]);
      setShowForm(false);
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Erreur.");
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/inventories/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (inventoriesQuery.isLoading || articlesQuery.isLoading || locationsQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const inventories = inventoriesQuery.data?.data ?? [];
  const articles = articlesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    await createMutation.mutateAsync();
  }

  const inputClass = "w-full border rounded px-3 py-2";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventaires</h1>

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {inventories.length} inventaire{inventories.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Fermer" : "+ Nouvel inventaire"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Nouvel inventaire</h2>

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
                {locations.filter((l) => l.active).map((l) => (
                  <option key={l.id} value={l.id}>{l.code}</option>
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
                  {articles.filter((a) => a.active).map((a) => (
                    <option key={a.id} value={a.id}>{a.reference}</option>
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
      )}

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Référence</th>
            <th className="p-3">Emplacement</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Créé le</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {inventories.map((inv) => {
            const location = locations.find((l) => l.id === inv.locationId);
            return (
              <tr key={inv.id} className="border-b">
                <td className="p-3">{inv.reference}</td>
                <td className="p-3">{location?.code ?? `#${inv.locationId}`}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      inv.status === "VALIDATED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="p-3">{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  {inv.status === "DRAFT" && (
                    <button
                      onClick={() => validateMutation.mutate(inv.id)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Valider
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}