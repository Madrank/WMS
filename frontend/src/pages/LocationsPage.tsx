import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listLocations, createLocation, deactivateLocation, type Location } from "../services/locationService.js";
import { listZones } from "../services/zoneService.js";

export default function LocationsPage() {
  const [zoneId, setZoneId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("1000");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ["locations", zoneId],
    queryFn: () => listLocations({ zoneId: zoneId ? Number(zoneId) : undefined, limit: 200 }),
  });

  const zonesQuery = useQuery({
    queryKey: ["zones-select"],
    queryFn: listZones,
  });

  const createMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setName("");
      setCode("");
      setCapacity("1000");
      setError("");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(message ?? "Erreur lors de la création.");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
  });

  if (locationsQuery.isLoading || zonesQuery.isLoading) return <p>Chargement...</p>;
  if (locationsQuery.isError || !locationsQuery.data) return <p className="text-red-600">Erreur de chargement.</p>;

  const locations = locationsQuery.data.data;
  const zones = zonesQuery.data?.data ?? [];
  const zoneById = new Map(zones.map((z) => [z.id, z]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({
      name,
      code,
      capacity: Number(capacity),
      zoneId: Number(zoneId),
    });
  }

  async function handleDeactivate(location: Location) {
    if (confirm(`Désactiver l'emplacement ${location.code} ?`)) {
      await deactivateMutation.mutateAsync(location.id);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Emplacements</h1>

      <div className="bg-white rounded shadow p-6 mb-6 max-w-xl space-y-4">
        <h2 className="text-lg font-semibold">Nouvel emplacement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Zone</label>
            <select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Choisir...</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.code} — {z.name}
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
              placeholder="A-01-01"
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
              placeholder="A-01-01"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Capacité</label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Création..." : "Créer l'emplacement"}
          </button>
        </form>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Filtrer par zone</label>
        <select
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          className="w-full max-w-sm border rounded px-3 py-2"
        >
          <option value="">Toutes les zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>
              {z.code} — {z.name}
            </option>
          ))}
        </select>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Zone</th>
            <th className="p-3">Code</th>
            <th className="p-3">Capacité</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => {
            const zone = zoneById.get(location.zoneId);
            return (
              <tr key={location.id} className="border-b">
                <td className="p-3">{zone ? `${zone.code} — ${zone.name}` : `#${location.zoneId}`}</td>
                <td className="p-3">{location.code}</td>
                <td className="p-3">{location.capacity}</td>
                <td className="p-3">
                  {location.active ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Actif</span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Inactif</span>
                  )}
                </td>
                <td className="p-3">
                  {location.active && (
                    <button
                      onClick={() => handleDeactivate(location)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Désactiver
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