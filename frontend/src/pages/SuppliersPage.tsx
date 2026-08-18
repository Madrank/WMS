import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSuppliers, createSupplier, deactivateSupplier, type Supplier } from "../services/supplierService.js";

interface SupplierFormValues {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SupplierFormValues>({ name: "" });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => listSuppliers({ search, page: 1, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setForm({ name: "" });
      setShowForm(false);
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateSupplier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !data) return <p className="text-red-600">Erreur de chargement.</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync(form);
  }

  async function handleDeactivate(supplier: Supplier) {
    if (confirm(`Désactiver le fournisseur ${supplier.name} ?`)) {
      await deactivateMutation.mutateAsync(supplier.id);
    }
  }

  const inputClass = "w-full border rounded px-3 py-2";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fournisseurs</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Fermer" : "+ Nouveau fournisseur"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded shadow p-6 mb-6 max-w-xl space-y-4"
        >
          <h2 className="text-lg font-semibold">Nouveau fournisseur</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Nom *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <input
              value={form.address ?? ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ville</label>
              <input
                value={form.city ?? ""}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Code postal</label>
              <input
                value={form.postalCode ?? ""}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pays</label>
              <input
                value={form.country ?? ""}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </button>
          {createMutation.isError && (
            <p className="text-red-600 text-sm">Erreur lors de la création.</p>
          )}
        </form>
      )}

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
              <td className="p-3">{supplier.name}</td>
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
                {supplier.active && (
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