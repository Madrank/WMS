import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";

interface DashboardData {
  stats: {
    activeArticles: number;
    activeSuppliers: number;
    locations: number;
    totalStockUnits: number;
    pendingReceipts: number;
  };
  lowStock: { reference: string; name: string; minimumStock: number; totalQuantity: number }[];
  stockByLocation: { locationCode: string; zoneName: string; totalQuantity: number }[];
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data,
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !data) return <p className="text-red-600">Erreur de chargement.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard label="Articles actifs" value={data.stats.activeArticles} />
        <StatCard label="Fournisseurs" value={data.stats.activeSuppliers} />
        <StatCard label="Emplacements" value={data.stats.locations} />
        <StatCard label="Unités en stock" value={data.stats.totalStockUnits} />
        <StatCard label="Réceptions en attente" value={data.stats.pendingReceipts} />
      </div>

      <h2 className="text-xl font-semibold mb-3">Alertes de stock bas</h2>
      {data.lowStock.length === 0 ? (
        <p>Aucune alerte.</p>
      ) : (
        <table className="w-full bg-white rounded shadow mb-8">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Référence</th>
              <th className="p-3">Nom</th>
              <th className="p-3">Minimum</th>
              <th className="p-3">Quantité</th>
            </tr>
          </thead>
          <tbody>
            {data.lowStock.map((item) => (
              <tr key={item.reference} className="border-b">
                <td className="p-3">{item.reference}</td>
                <td className="p-3">{item.name}</td>
                <td className="p-3">{item.minimumStock}</td>
                <td className="p-3 text-red-600 font-semibold">
                  {item.totalQuantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="text-xl font-semibold mb-3">Stock par emplacement</h2>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Emplacement</th>
            <th className="p-3">Zone</th>
            <th className="p-3">Quantité</th>
          </tr>
        </thead>
        <tbody>
          {data.stockByLocation.map((loc) => (
            <tr key={loc.locationCode} className="border-b">
              <td className="p-3">{loc.locationCode}</td>
              <td className="p-3">{loc.zoneName}</td>
              <td className="p-3">{loc.totalQuantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}