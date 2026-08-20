import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getCurrentUser } from "../services/authService.js";

interface ReceiptItem {
  id: number;
  articleId: number;
  expectedQuantity: number;
  receivedQuantity: number;
  locationId: number;
}

interface Receipt {
  id: number;
  reference: string;
  supplierId: number;
  status: string;
  createdAt: string;
  validatedAt: string | null;
  items: ReceiptItem[];
}

interface Article {
  id: number;
  reference: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Location {
  id: number;
  code: string;
}

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const receiptId = Number(id);
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canValidate = user?.role === "ADMIN" || user?.role === "MANAGER";

  const receiptQuery = useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: async () => (await api.get(`/receipts/${receiptId}`)).data as Receipt,
  });

  const suppliersQuery = useQuery({
    queryKey: ["suppliers-select"],
    queryFn: async () => (await api.get("/suppliers", { params: { limit: 200 } })).data as { data: Supplier[] },
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
    mutationFn: () => api.post(`/receipts/${receiptId}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipt", receiptId] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["stocks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (
    receiptQuery.isLoading ||
    suppliersQuery.isLoading ||
    articlesQuery.isLoading ||
    locationsQuery.isLoading
  ) {
    return <p>Chargement...</p>;
  }

  if (receiptQuery.isError || !receiptQuery.data) {
    return <p className="text-red-600">Réception introuvable.</p>;
  }

  const receipt = receiptQuery.data;
  const supplier = suppliersQuery.data?.data.find((s) => s.id === receipt.supplierId);
  const articles = articlesQuery.data?.data ?? [];
  const locations = locationsQuery.data?.data ?? [];

  const statusClass =
    receipt.status === "VALIDATED"
      ? "bg-green-100 text-green-700"
      : receipt.status === "CANCELLED"
        ? "bg-gray-100 text-gray-600"
        : "bg-yellow-100 text-yellow-700";

  return (
    <div className="max-w-3xl">
      <Link to="/receipts" className="text-gray-600 text-sm hover:underline">
        ← Retour aux réceptions
      </Link>
      <h1 className="text-2xl font-bold mb-6">{receipt.reference}</h1>

      <div className="bg-white rounded shadow p-6 space-y-4 mb-6">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Fournisseur</span>
          <span className="font-medium">{supplier?.name ?? `#${receipt.supplierId}`}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Statut</span>
          <span className={`px-2 py-1 rounded text-xs ${statusClass}`}>{receipt.status}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Créée le</span>
          <span className="font-medium">{new Date(receipt.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-500 text-sm">Validée le</span>
          <span className="font-medium">
            {receipt.validatedAt ? new Date(receipt.validatedAt).toLocaleString() : "—"}
          </span>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-3">Lignes</h2>
      <table className="w-full bg-white rounded shadow mb-6">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Article</th>
            <th className="p-3">Quantité attendue</th>
            <th className="p-3">Quantité reçue</th>
            <th className="p-3">Emplacement</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item) => {
            const article = articles.find((a) => a.id === item.articleId);
            const location = locations.find((l) => l.id === item.locationId);
            return (
              <tr key={item.id} className="border-b">
                <td className="p-3">{article?.reference ?? `#${item.articleId}`}</td>
                <td className="p-3">{item.expectedQuantity}</td>
                <td className="p-3">{item.receivedQuantity}</td>
                <td className="p-3">{location?.code ?? `#${item.locationId}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {receipt.status === "DRAFT" && canValidate && (
        <button
          onClick={() => validateMutation.mutate()}
          disabled={validateMutation.isPending}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {validateMutation.isPending ? "Validation..." : "Valider la réception"}
        </button>
      )}
    </div>
  );
}