import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSuppliers, deactivateSupplier, type Supplier } from "../services/supplierService.js";
import { getCurrentUser } from "../services/authService.js";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => listSuppliers({ search, page: 1, limit: 50 }),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !data) return <p className="text-red-600">Erreur de chargement.</p>;

  async function handleDeactivate(supplier: Supplier) {
    if (confirm(`Désactiver le fournisseur ${supplier.name} ?`)) {
      await deactivateMutation.mutateAsync(supplier.id);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fournisseurs</h1>
        {canManage && (
          <Link
            to="/suppliers/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nouveau fournisseur
          </Link>
        )}
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un fournisseur..."
          className="w-full max-w-sm border rounded px-3 py-2"
        />
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Nom</th>
            <th className="p-3">Email</th>
            <th className="p-3">Ville</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((supplier) => (
            <tr key={supplier.id} className="border-b">
              <td className="p-3">
                <Link to={`/suppliers/${supplier.id}`} className="text-blue-600 hover:underline">
                  {supplier.name}
                </Link>
              </td>
              <td className="p-3">{supplier.email ?? "—"}</td>
              <td className="p-3">{supplier.city ?? "—"}</td>
              <td className="p-3">
                {supplier.active ? (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Actif</span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Inactif</span>
                )}
              </td>
              <td className="p-3">
                {canManage && supplier.active && (
                  <button
                    onClick={() => handleDeactivate(supplier)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Désactiver
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}