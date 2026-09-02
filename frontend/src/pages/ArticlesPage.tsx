import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listArticles, deactivateArticle, type Article } from "../services/articleService.js";
import { getCurrentUser } from "../services/authService.js";
import { downloadCsv } from "../utils/exportFile.js";

export default function ArticlesPage() {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState("");
  const [exporting, setExporting] = useState(false);
  const queryClient = useQueryClient();
  const user = getCurrentUser();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["articles", search, active],
    queryFn: () =>
      listArticles({
        search,
        active: active === "" ? undefined : active === "true",
        page: 1,
        limit: 50,
      }),
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

  async function handleDeactivate(article: Article) {
    if (confirm(`Désactiver l'article ${article.reference} ?`)) {
      await deactivateMutation.mutateAsync(article.id);
    }
  }

  async function handleExport() {
    try {
      setExporting(true);
      await downloadCsv("/articles/export", "articles.csv");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {exporting ? "Export..." : "Exporter CSV"}
          </button>
          {canManage && (
            <Link
              to="/articles/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              + Nouvel article
            </Link>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un article..."
          className="w-full max-w-sm border rounded px-3 py-2"
        />
        <select
          value={active}
          onChange={(e) => setActive(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Tous</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
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
              <td className="p-3">
                <Link to={`/articles/${article.id}`} className="text-blue-600 hover:underline">
                  {article.reference}
                </Link>
              </td>
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
                {canManage && article.active && (
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