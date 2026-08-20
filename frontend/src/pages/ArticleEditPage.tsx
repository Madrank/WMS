import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getArticle, updateArticle } from "../services/articleService.js";
import ArticleForm from "../components/ArticleForm.js";
import type { ArticleFormValues } from "../schemas/articleSchema.js";

export default function ArticleEditPage() {
  const { id } = useParams();
  const articleId = Number(id);
  const navigate = useNavigate();

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticle(articleId),
  });

  const mutation = useMutation({
    mutationFn: (values: ArticleFormValues) => updateArticle(articleId, values),
    onSuccess: () => navigate(`/articles/${articleId}`),
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !article) return <p className="text-red-600">Article introuvable.</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Modifier l'article</h1>
      <div className="bg-white rounded shadow p-6">
        <ArticleForm
          onSubmit={(values) => mutation.mutateAsync(values)}
          initial={{
            reference: article.reference,
            name: article.name,
            description: article.description ?? undefined,
            barcode: article.barcode ?? undefined,
            unit: article.unit,
            minimumStock: article.minimumStock,
          }}
          submitting={mutation.isPending}
        />
        {mutation.isError && (
          <p className="text-red-600 text-sm mt-2">Erreur lors de la modification.</p>
        )}
        <Link
          to={`/articles/${articleId}`}
          className="text-gray-600 text-sm hover:underline block mt-3"
        >
          ← Annuler
        </Link>
      </div>
    </div>
  );
}