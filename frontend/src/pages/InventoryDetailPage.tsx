import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getCurrentUser } from "../services/authService.js";

interface InventoryItem {
  id: number;
  articleId: number;
  theoreticalQuantity: number;
  countedQuantity: number;
}

interface Inventory {
  id: number;
  reference: string;
  locationId: number;
  status: string;
  createdAt: string;
  validatedAt: string | null;
  items: InventoryItem[];
}

interface Article {
  id: number;
  reference: string;
}

interface Location {
  id: number;
  code: string;
}

export default function InventoryDetailPage() {
  const { id } = useParams();
  const inventoryId = Number(id);
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canValidate = user?.role === "ADMIN" || user?.role === "MANAGER";

  const inventoryQuery = useQuery({
    queryKey: ["inventory", inventoryId],
    queryFn: async () => (await api.get(`/inventories/${inventoryId}`)).data as Inventory,
  });

  const articlesQuery = useQuery({
    queryKey: ["articles-select"],
    queryFn: async () => (await api.get("/articles", { params: { limit: 200 } })).data as { data: Article[] },
  });

  const locationsQuery = useQuery({
    queryKey: ["locations-select"],
    queryFn: async () => (await api.get("/locations", { params: { limit: 200 } })).data as { data: Location[] },
  });

  const validateMutation = useMutation({
    mutationFn: () => api.post(`/inventories/${inventoryId}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", inventoryId] });
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (inventoryQuery.isLoading || articlesQuery.isLoading || locationsQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  if (inventoryQuery.isError || !inventoryQuery.data) {
    return <p className="text-red-600">Inventaire introuvable.</p>;
  }

  const inventory = inventoryQuery.data;
  const articles = articlesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];
  const location = locations.find((l) => l.id === inventory.locationId);

  const statusClass =
    inventory.status === "VALIDATED"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="max-w-3xl">
      <Link to="/inventories" className="text-gray-600 text-sm hover:underline">
        ← Retour aux inventaires
      </Link>
      <h1 className="text-2xl font-bold mb-6">{inventory.reference}</h1>

      <div className="bg-white rounded shadow p-6 space-y-4 mb-6">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Emplacement</span>
          <span className="font-medium">{location?.code ?? `#${inventory.locationId}`}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Statut</span>
          <span className={`px-2 py-1 rounded text-xs ${statusClass}`}>{inventory.status}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Créé le</span>
          <span className="font-medium">{new Date(inventory.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Validé le</span>
          <span className="font-medium">
            {inventory.validatedAt ? new Date(inventory.validatedAt).toLocaleString() : "—"}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Lignes</h2>
      <table className="w-full bg-white rounded shadow mb-6">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Article</th>
            <th className="p-3">Théorique</th>
            <th className="p-3">Compté</th>
            <th className="p-3">Écart</th>
          </tr>
        </thead>
        <tbody>
          {inventory.items.map((item) => {
            const article = articles.find((a) => a.id === item.articleId);
            const difference = item.countedQuantity - item.theoreticalQuantity;
            return (
              <tr key={item.id} className="border-b">
                <td className="p-3">{article?.reference ?? `#${item.articleId}`}</td>
                <td className="p-3">{item.theoreticalQuantity}</td>
                <td className="p-3">{item.countedQuantity}</td>
                <td
                  className={`p-3 font-semibold ${
                    difference > 0 ? "text-green-600" : difference < 0 ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {difference > 0 ? `+${difference}` : difference}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {inventory.status === "DRAFT" && canValidate && (
        <button
          onClick={() => validateMutation.mutate()}
          disabled={validateMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {validateMutation.isPending ? "Validation..." : "Valider l'inventaire"}
        </button>
      )}
    </div>
  );
}