import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupplier, updateSupplier, deactivateSupplier, type Supplier } from "../services/supplierService.js";
import { getCurrentUser } from "../services/authService.js";
import SupplierForm from "../components/SupplierForm.js";
import type { SupplierFormValues } from "../components/SupplierForm.js";

export default function SupplierDetailPage() {
  const { id } = useParams();
  const supplierId = Number(id);
  const [editing, setEditing] = useState(false);
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data: supplier, isLoading, isError } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => getSupplier(supplierId),
  });

  const updateMutation = useMutation({
    mutationFn: (values: SupplierFormValues) => updateSupplier(supplierId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
      setEditing(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] }),
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !supplier) return <p className="text-red-600">Fournisseur introuvable.</p>;

  async function handleDeactivate(current: Supplier) {
    if (confirm(`Désactiver le fournisseur ${current.name} ?`)) {
      await deactivateMutation.mutateAsync(current.id);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/suppliers" className="text-gray-600 text-sm hover:underline">
        ← Retour aux fournisseurs
      </Link>
      <h1 className="text-2xl font-bold mb-6">{supplier.name}</h1>

      {editing && canManage ? (
        <div className="bg-white rounded shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Modifier le fournisseur</h2>
          <SupplierForm
            onSubmit={(values) => updateMutation.mutateAsync(values)}
            initial={{
              name: supplier.name,
              email: supplier.email ?? undefined,
              phone: supplier.phone ?? undefined,
              address: supplier.address ?? undefined,
              city: supplier.city ?? undefined,
              postalCode: supplier.postalCode ?? undefined,
              country: supplier.country ?? undefined,
            }}
            submitting={updateMutation.isPending}
          />
          {updateMutation.isError && (
            <p className="text-red-600 text-sm mt-2">Erreur lors de la modification.</p>
          )}
          <button onClick={() => setEditing(false)} className="text-gray-600 text-sm hover:underline mt-3">
            Annuler
          </button>
        </div>
      ) : (
        <div className="bg-white rounded shadow p-6 space-y-4 mb-6">
          <Row label="Email" value={supplier.email ?? "—"} />
          <Row label="Téléphone" value={supplier.phone ?? "—"} />
          <Row label="Adresse" value={supplier.address ?? "—"} />
          <Row label="Ville" value={supplier.city ?? "—"} />
          <Row label="Code postal" value={supplier.postalCode ?? "—"} />
          <Row label="Pays" value={supplier.country ?? "—"} />
          <Row
            label="Statut"
            value={
              supplier.active ? (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Actif</span>
              ) : (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Inactif</span>
              )
            }
          />

          {canManage && supplier.active && (
            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Modifier
              </button>
              <button onClick={() => handleDeactivate(supplier)} className="text-red-600 hover:underline text-sm">
                Désactiver
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}