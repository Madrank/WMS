import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (v === "" ? undefined : v);

const supplierSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  email: z.preprocess(emptyToUndefined, z.string().email("Email invalide").optional()),
  phone: z.preprocess(emptyToUndefined, z.string().max(50).optional()),
  address: z.preprocess(emptyToUndefined, z.string().max(255).optional()),
  city: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
  postalCode: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
  country: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
});

export type SupplierFormValues = z.output<typeof supplierSchema>;
export type SupplierFormInput = z.input<typeof supplierSchema>;

interface SupplierFormProps {
  onSubmit: (values: SupplierFormValues) => void;
  initial?: Partial<SupplierFormValues>;
  submitting?: boolean;
}

export default function SupplierForm({ onSubmit, initial, submitting }: SupplierFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierFormInput, any, SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { ...initial },
  });

  const inputClass = "w-full border rounded px-3 py-2";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nom *</label>
        <input {...register("name")} className={inputClass} placeholder="ACME" />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register("email")} className={inputClass} />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Téléphone</label>
          <input {...register("phone")} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Adresse</label>
        <input {...register("address")} className={inputClass} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ville</label>
          <input {...register("city")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Code postal</label>
          <input {...register("postalCode")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Pays</label>
          <input {...register("country")} className={inputClass} />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}