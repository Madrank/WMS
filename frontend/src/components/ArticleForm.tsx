import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { articleSchema, type ArticleFormValues, type ArticleFormInput } from "../schemas/articleSchema.js";

interface ArticleFormProps {
  onSubmit: (values: ArticleFormValues) => void;
  initial?: Partial<ArticleFormValues>;
  submitting?: boolean;
}

export default function ArticleForm({ onSubmit, initial, submitting }: ArticleFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ArticleFormInput, unknown, ArticleFormValues>({
    resolver: zodResolver(articleSchema),
    defaultValues: { unit: "unité", minimumStock: 0, ...initial },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Référence</label>
        <input
          {...register("reference")}
          className="w-full border rounded px-3 py-2"
          placeholder="SKU-001"
        />
        {errors.reference && <p className="text-red-600 text-sm mt-1">{errors.reference.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Nom</label>
        <input
          {...register("name")}
          className="w-full border rounded px-3 py-2"
          placeholder="Clavier mécanique"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          {...register("description")}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Unité</label>
          <input {...register("unit")} className="w-full border rounded px-3 py-2" />
          {errors.unit && <p className="text-red-600 text-sm mt-1">{errors.unit.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Stock minimum</label>
          <input
            type="number"
            {...register("minimumStock")}
            className="w-full border rounded px-3 py-2"
          />
          {errors.minimumStock && <p className="text-red-600 text-sm mt-1">{errors.minimumStock.message}</p>}
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