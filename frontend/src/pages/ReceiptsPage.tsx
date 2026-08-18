import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface Receipt {
  id: number;
  reference: string;
  supplierId: number;
  status: string;
  createdAt: string;
}

interface Article {
  id: number;
  reference: string;
  name: string;
  active: boolean;
}

interface Supplier {
  id: number;
  name: string;
  active: boolean;
}

interface Location {
  id: number;
  code: string;
  active: boolean;
}

export default function ReceiptsPage() {
  const [showForm, setShowForm] = useState(false);
  const [reference, setReference] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState([{ articleId: "", expectedQuantity: "", receivedQuantity: "", locationId: "" }]);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const receiptsQuery = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => (await api.get("/receipts", { params: { limit: 100 } })).data as { data: Receipt[] },
  });

  const articlesQuery = useQuery({
    queryKey: ["articles-select"],
    queryFn: async () => (await api.get("/articles", { params: { limit: 200 } })).data as { data: Article[] },
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers-select"],
    queryFn: async () => (await api.get("/suppliers", { params: { limit: 200 } })).data as { data: Supplier[] },
  });

  const locationsQuery = useQuery({
    queryKey: ["locations-select"],
    queryFn: async () => (await api.get("/locations", { params: { limit: 200 } })).data as { data: Location[] },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post("/receipts", {
        reference,
        supplierId: Number(supplierId),
        items: lines.map((l) => ({
          articleId: Number(l.articleId),
          expectedQuantity: Number(l.expectedQuantity),
          receivedQuantity: Number(l.receivedQuantity || l.expectedQuantity),
          locationId: Number(l.locationId),
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      setReference("");
      setLines([{ articleId: "", expectedQuantity: "", receivedQuantity: "", locationId: "" }]);
      setShowForm(false);
    },
    onError: (err: unknown) => {
      setError((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Erreur.");
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (id: number) => api.post(`/receipts/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (receiptsQuery.isLoading || articlesQuery.isLoading || suppliersQuery.isLoading || locationsQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const receipts = receiptsQuery.data?.data ?? [];
  const articles = articlesQuery.data?.data ?? [];
  const suppliers = suppliersQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    await createMutation.mutateAsync();
  }

  const inputClass = "w-full border rounded px-3 py-2";

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Réceptions</h1>

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {receipts.length} réception{receipts.length > 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Fermer" : "+ Nouvelle réception"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 mb-6 space-y-4">
          <h2 className="text-lg font-semibold">Nouvelle réception</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Référence *</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                className={inputClass}
                placeholder="REC-2026-003"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fournisseur *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Choisir...</option>
                {suppliers.filter((s) => s.active).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2">Lignes</h3>
            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-4 gap-3 mb-3">
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
                  min="1"
                  placeholder="Qté attendue"
                  value={line.expectedQuantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[index] = { ...next[index], expectedQuantity: e.target.value };
                    setLines(next);
                  }}
                  required
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Qté reçue"
                  value={line.receivedQuantity}
                  onChange={(e) => {
                    const next = [...lines];
                    next[index] = { ...next[index], receivedQuantity: e.target.value };
                    setLines(next);
                  }}
                  className={inputClass}
                />
                <select
                  value={line.locationId}
                  onChange={(e) => {
                    const next = [...lines];
                    next[index] = { ...next[index], locationId: e.target.value };
                    setLines(next);
                  }}
                  required
                  className={inputClass}
                >
                  <option value="">Emplacement</option>
                  {locations.filter((l) => l.active).map((l) => (
                    <option key={l.id} value={l.id}>{l.code}</option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLines([...lines, { articleId: "", expectedQuantity: "", receivedQuantity: "", locationId: "" }])}
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
            {createMutation.isPending ? "Création..." : "Créer la réception"}
          </button>
        </form>
      )}

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Référence</th>
            <th className="p-3">Fournisseur</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Créée le</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => {
            const supplier = suppliers.find((s) => s.id === receipt.supplierId);
            return (
              <tr key={receipt.id} className="border-b">
                <td className="p-3">{receipt.reference}</td>
                <td className="p-3">{supplier?.name ?? `#${receipt.supplierId}`}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      receipt.status === "VALIDATED"
                        ? "bg-green-100 text-green-700"
                        : receipt.status === "CANCELLED"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {receipt.status}
                  </span>
                </td>
                <td className="p-3">{new Date(receipt.createdAt).toLocaleDateString()}</td>
                <td className="p-3">
                  {receipt.status === "DRAFT" && (
                    <button
                      onClick={() => validateMutation.mutate(receipt.id)}
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