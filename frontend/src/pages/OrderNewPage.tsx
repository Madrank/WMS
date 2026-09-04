import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { createOrder } from "../services/orderService.js";

interface Article {
  id: number;
  reference: string;
  name: string;
  active: boolean;
}

const inputClass = "w-full border rounded px-3 py-2";

export default function OrderNewPage() {
  const navigate = useNavigate();
  const [reference, setReference] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState([{ articleId: "", quantity: "" }]);
  const [error, setError] = useState("");

  const articlesQuery = useQuery({
    queryKey: ["articles-select"],
    queryFn: async () => (await api.get("/articles", { params: { limit: 200 } })).data as { data: Article[] },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const order = await createOrder({
        reference: reference || undefined,
        customerName,
        items: lines.map((l) => ({
          articleId: Number(l.articleId),
          quantity: Number(l.quantity),
        })),
      });
      return order;
    },
    onSuccess: (order) => navigate(`/orders/${order.id}`),
    onError: (err: unknown) => {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ?? "Erreur.",
      );
    },
  });

  if (articlesQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const articles = articlesQuery.data?.data ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    await createMutation.mutateAsync();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Nouvelle commande</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Référence</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder="ORD-2026-001 (laissez vide = auto)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client *</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className={inputClass}
              placeholder="Nom du client"
            />
          </div>
        </div>

        <div>
          <h3 className="text-md font-semibold mb-2">Produits</h3>
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
                      {a.reference} — {a.name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Quantité"
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...next[index], quantity: e.target.value };
                  setLines(next);
                }}
                required
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setLines(lines.filter((_, i) => i !== index))}
                className="text-red-600 text-sm hover:underline"
              >
                Retirer
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines([...lines, { articleId: "", quantity: "" }])}
            className="text-blue-600 text-sm hover:underline"
          >
            + Ajouter un produit
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? "Création..." : "Créer la commande"}
        </button>
      </form>
    </div>
  );
}
