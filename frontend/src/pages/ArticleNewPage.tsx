import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { createArticle } from "../services/articleService.js";
import ArticleForm from "../components/ArticleForm.js";
import type { ArticleFormValues } from "../schemas/articleSchema.js";

export default function ArticleNewPage() {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createArticle,
    onSuccess: (article) => navigate(`/articles/${article.id}`),
  });

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Nouvel article</h1>
      <div className="bg-white rounded shadow p-6">
        <ArticleForm
          onSubmit={(values: ArticleFormValues) => mutation.mutateAsync(values)}
          submitting={mutation.isPending}
        />
        {mutation.isError && (
          <p className="text-red-600 text-sm mt-2">Erreur lors de la création.</p>
        )}
      </div>
    </div>
  );
}