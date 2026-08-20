import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getArticle, deactivateArticle, type Article } from "../services/articleService.js";
import { getCurrentUser } from "../services/authService.js";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const articleId = Number(id);
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data: article, isLoading, isError } = useQuery({
    queryKey: ["article", articleId],
    queryFn: () => getArticle(articleId),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateArticle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["article", articleId] }),
  });

  if (isLoading) return <p>Chargement...</p>;
  if (isError || !article) return <p className="text-red-600">Article introuvable.</p>;

  async function handleDeactivate(current: Article) {
    if (confirm(`Désactiver l'article ${current.reference} ?`)) {
      await deactivateMutation.mutateAsync(current.id);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link to="/articles" className="text-gray-600 text-sm hover:underline">
        ← Retour aux articles
      </Link>
      <h1 className="text-2xl font-bold mb-6">{article.reference}</h1>

      <div className="bg-white rounded shadow p-6 space-y-4">
        <Row label="Nom" value={article.name} />
        <Row label="Description" value={article.description ?? "—"} />
        <Row label="Code-barres" value={article.barcode ?? "—"} />
        <Row label="Unité" value={article.unit} />
        <Row label="Stock minimum" value={String(article.minimumStock)} />
        <Row
          label="Statut"
          value={
            article.active ? (
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Actif</span>
            ) : (
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Inactif</span>
            )
          }
        />
        <Row label="Créé le" value={new Date(article.createdAt).toLocaleDateString()} />
        <Row label="Modifié le" value={new Date(article.updatedAt).toLocaleDateString()} />

        {canManage && article.active && (
          <div className="flex items-center gap-4 pt-2">
            <Link
              to={`/articles/${articleId}/edit`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Modifier
            </Link>
            <button onClick={() => handleDeactivate(article)} className="text-red-600 hover:underline text-sm">
              Désactiver
            </button>
          </div>
        )}
      </div>
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