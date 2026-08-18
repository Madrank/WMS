import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listArticles, createArticle, deactivateArticle, type Article } from "../services/articleService.js";
import ArticleForm from "../components/ArticleForm.js";
import type { ArticleFormValues } from "../schemas/articleSchema.js";

export default function ArticlesPage() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", search],
    queryFn: () => listArticles({ search, page: 1, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: createArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
    
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !data) return <p className="text-red-600">Erreur de chargement.</p>;

  async function handleCreate(values: ArticleFormValues) {
    await createMutation.mutateAsync(values);
  }

  async function handleDeactivate(article: Article) {
    if (confirm(`Désactiver l'article ${article.reference} ?`)) {
      await deactivateMutation.mutateAsync(article.id);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? "Fermer" : "+ Nouvel article"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded shadow p-6 mb-6 max-w-xl">
          <h2 className="text-lg font-semibold mb-4">Nouvel article</h2>
          <ArticleForm onSubmit={handleCreate} submitting={createMutation.isPending} />
          {createMutation.isError && (
            <p className="text-red-600 text-sm mt-2">Erreur lors de la création.</p>
          )}
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full max-w-sm border rounded px-3 py-2"
        />
      </div>

      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">Référence</th>
            <th className="p-3">Nom</th>
            <th className="p-3">Unité</th>
            <th className="p-3">Min</th>
            <th className="p-3">Statut</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((article) => (
            <tr key={article.id} className="border-b">
              <td className="p-3">{article.reference}</td>
              <td className="p-3">{article.name}</td>
              <td className="p-3">{article.unit}</td>
              <td className="p-3">{article.minimumStock}</td>
              <td className="p-3">
                {article.active ? (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                    Actif
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    Inactif
                  </span>
                )}
              </td>
              <td className="p-3">
                {article.active && (
                  <button
                    onClick={() => handleDeactivate(article)}
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