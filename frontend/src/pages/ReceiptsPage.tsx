import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getCurrentUser } from "../services/authService.js";

interface Receipt {
  id: number;
  reference: string;
  supplierId: number;
  status: string;
  createdAt: string;
}

interface Supplier {
  id: number;
  name: string;
}

export default function ReceiptsPage() {
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canValidate = user?.role === "ADMIN" || user?.role === "MANAGER";

  const receiptsQuery = useQuery({
    queryKey: ["receipts"],
    queryFn: async () => (await api.get("/receipts", { params: { limit: 100 } })).data as { data: Receipt[] },
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers-select"],
    queryFn: async () => (await api.get("/suppliers", { params: { limit: 200 } })).data as { data: Supplier[] },
  });

  const validateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/receipts/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (receiptsQuery.isLoading || suppliersQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  const receipts = receiptsQuery.data?.data ?? [];
  const suppliers = suppliersQuery.data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Réceptions</h1>

      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          {receipts.length} réception{receipts.length > 1 ? "s" : ""}
        </p>
        <Link
          to="/receipts/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nouvelle réception
        </Link>
      </div>

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
                <td className="p-3">
                  <Link to={`/receipts/${receipt.id}`} className="text-blue-600 hover:underline">
                    {receipt.reference}
                  </Link>
                </td>
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
                  {canValidate && receipt.status === "DRAFT" && (
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