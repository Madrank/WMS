import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createSupplier } from "../services/supplierService.js";
import SupplierForm from "../components/SupplierForm.js";
import type { SupplierFormValues } from "../components/SupplierForm.js";

export default function SupplierNewPage() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: (supplier) => navigate(`/suppliers/${supplier.id}`),
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Nouveau fournisseur</h1>
      <div className="bg-white rounded shadow p-6">
        <SupplierForm
          onSubmit={(values: SupplierFormValues) => mutation.mutateAsync(values)}
          submitting={mutation.isPending}
        />
        {mutation.isError && (
          <p className="text-red-600 text-sm mt-2">Erreur lors de la création.</p>
        )}
      </div>
    </div>
  );
}