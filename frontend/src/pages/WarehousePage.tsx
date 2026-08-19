import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listWarehouses, createWarehouse, type Warehouse } from "../services/warehouseService.js";

export default function WarehousePage() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["warehouses"],
    queryFn: listWarehouses,
  });

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setName("");
      setAddress("");
      setError("");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(message ?? "Erreur lors de la création.");
    },
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !data) return <p className="text-red-600">Erreur de chargement.</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({ name, address });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Entrepôts</h1>

      <div className="bg-white rounded shadow p-6 mb-6 max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">Nouvel entrepôt</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Création..." : "Créer l'entrepôt"}
          </button>
        </form>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Nom</th>
            <th className="p-3">Adresse</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((warehouse: Warehouse) => (
            <tr key={warehouse.id} className="border-b">
              <td className="p-3">{warehouse.name}</td>
              <td className="p-3">{warehouse.address ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}