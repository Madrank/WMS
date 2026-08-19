import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listZones, createZone } from "../services/zoneService.js";
import { listWarehouses } from "../services/warehouseService.js";

export default function ZonesPage() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const zonesQuery = useQuery({
    queryKey: ["zones"],
    queryFn: listZones,
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses-select"],
    queryFn: listWarehouses,
  });

  const createMutation = useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      setName("");
      setCode("");
      setWarehouseId("");
      setError("");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(message ?? "Erreur lors de la création.");
    },
  });

  if (zonesQuery.isLoading || warehousesQuery.isLoading) return <p>Chargement...</p>;
  if (zonesQuery.isError || !zonesQuery.data) return <p className="text-red-600">Erreur de chargement.</p>;

  const zones = zonesQuery.data.data;
  const warehouses = warehousesQuery.data?.data ?? [];
  const warehouseById = new Map(warehouses.map((w) => [w.id, w]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({ name, code, warehouseId: Number(warehouseId) });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Zones</h1>

      <div className="bg-white rounded shadow p-6 mb-6 max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">Nouvelle zone</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Entrepôt</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Choisir...</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="A"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Zone A"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Création..." : "Créer la zone"}
          </button>
        </form>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Entrepôt</th>
            <th className="p-3">Code</th>
            <th className="p-3">Nom</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((zone) => {
            const warehouse = warehouseById.get(zone.warehouseId);
            return (
              <tr key={zone.id} className="border-b">
                <td className="p-3">{warehouse ? warehouse.name : `#${zone.warehouseId}`}</td>
                <td className="p-3">{zone.code}</td>
                <td className="p-3">{zone.name}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}