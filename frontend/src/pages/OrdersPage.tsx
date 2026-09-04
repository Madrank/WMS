import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listOrders } from "../services/orderService.js";

const statusClass = (status: string) => {
  switch (status) {
    case "SHIPPED":
      return "bg-green-100 text-green-700";
    case "VALIDATED":
      return "bg-blue-100 text-blue-700";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600";
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const statusLabel = (status: string) =>
  ({ PENDING: "En attente", VALIDATED: "Validée", SHIPPED: "Expédiée", CANCELLED: "Annulée" })[status] ?? status;

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const ordersQuery = useQuery({
    queryKey: ["orders", search, status],
    queryFn: () => listOrders({ search: search || undefined, status: status || undefined, limit: 50 }),
  });

  const orders = ordersQuery.data?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Commandes</h1>

      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex gap-2 flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (référence, client)"
            className="border rounded px-3 py-2 flex-1"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="VALIDATED">Validée</option>
            <option value="SHIPPED">Expédiée</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
        <Link to="/orders/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nouvelle commande
        </Link>
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Référence</th>
            <th className="p-3">Client</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Créée le</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b">
              <td className="p-3">
                <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                  {order.reference}
                </Link>
              </td>
              <td className="p-3">{order.customerName}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded text-xs ${statusClass(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </td>
              <td className="p-3">{new Date(order.createdAt).toLocaleDateString()}</td>
              <td className="p-3">
                <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline text-sm">
                  Voir
                </Link>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className="p-3 text-center text-gray-500">
                Aucune commande.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
