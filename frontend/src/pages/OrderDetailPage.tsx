import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrder, validateOrder, shipOrder, cancelOrder, type Order } from "../services/orderService.js";

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

export default function OrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["stocks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["movements"] });
  };

  const validateMutation = useMutation({ mutationFn: () => validateOrder(orderId), onSuccess: invalidate });
  const shipMutation = useMutation({ mutationFn: () => shipOrder(orderId), onSuccess: invalidate });
  const cancelMutation = useMutation({ mutationFn: () => cancelOrder(orderId), onSuccess: invalidate });

  if (orderQuery.isLoading) {
    return <p>Chargement...</p>;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return <p className="text-red-600">Commande introuvable.</p>;
  }

  const order: Order = orderQuery.data;
  const items = order.items ?? [];

  return (
    <div className="max-w-3xl">
      <Link to="/orders" className="text-gray-600 text-sm hover:underline">
        ← Retour aux commandes
      </Link>
      <h1 className="text-2xl font-bold mb-6">{order.reference}</h1>

      <div className="bg-white rounded shadow p-6 space-y-4 mb-6">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Client</span>
          <span className="font-medium">{order.customerName}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Statut</span>
          <span className={`px-2 py-1 rounded text-xs ${statusClass(order.status)}`}>
            {statusLabel(order.status)}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Créée le</span>
          <span className="font-medium">{new Date(order.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Validée le</span>
          <span className="font-medium">
            {order.validatedAt ? new Date(order.validatedAt).toLocaleString() : "—"}
          </span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Expédiée le</span>
          <span className="font-medium">
            {order.shippedAt ? new Date(order.shippedAt).toLocaleString() : "—"}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Produits</h2>
      <table className="w-full bg-white rounded shadow mb-6">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Article</th>
            <th className="p-3">Quantité</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b">
              <td className="p-3">{item.reference ?? item.name ?? `#${item.articleId}`}</td>
              <td className="p-3">{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-3">
        {order.status === "PENDING" && (
          <>
            <button
              onClick={() => validateMutation.mutate()}
              disabled={validateMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {validateMutation.isPending ? "Validation..." : "Valider (réserver le stock)"}
            </button>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Annuler
            </button>
          </>
        )}
        {order.status === "VALIDATED" && (
          <>
            <button
              onClick={() => shipMutation.mutate()}
              disabled={shipMutation.isPending}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {shipMutation.isPending ? "Expédition..." : "Expédier (déstockage)"}
            </button>
            <button
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Annuler
            </button>
          </>
        )}
      </div>
    </div>
  );
}
