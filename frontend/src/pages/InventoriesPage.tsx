import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getCurrentUser } from "../services/authService.js";

interface Inventory {
  id: number;
  reference: string;
  locationId: number;
  status: string;
  createdAt: string;
}

interface Location {
  id: number;
  code: string;
}

export default function InventoriesPage() {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canValidate = user?.role === "ADMIN" || user?.role === "MANAGER";

  const inventoriesQuery = useQuery({
    queryKey: ["inventories"],
    queryFn: async () => (await api.get("/inventories", { params: { limit: 100 } })).data as { data: Inventory[] },
  });

  const locationsQuery = useQuery({
    queryKey: ["locations-select"],
    queryFn: async () => (await api.get("/locations", { params: { limit: 200 } })).data as { data: Location[] },
  });

  const validateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/inventories/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventories"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (inventoriesQuery.isLoading || locationsQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const inventories = inventoriesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Inventaires</h1>

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {inventories.length} inventaire{inventories.length > 1 ? "s" : ""}
        </p>
        <Link
          to="/inventories/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nouvel inventaire
        </Link>
      </div>

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
                <td className="p-3">
                  <Link to={`/inventories/${inv.id}`} className="text-blue-600 hover:underline">
                    {inv.reference}
                  </Link>
                </td>
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
                  {canValidate && inv.status === "DRAFT" && (
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