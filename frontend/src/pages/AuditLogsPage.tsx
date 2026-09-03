import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "../services/auditLogService.js";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  VALIDATE: "Validation",
  ACTIVATE: "Activation",
  DEACTIVATE: "Désactivation",
};

const ENTITY_LABELS: Record<string, string> = {
  article: "Produit",
  supplier: "Fournisseur",
  user: "Utilisateur",
  receipt: "Réception",
  inventory: "Inventaire",
};

const PAGE_SIZE = 20;

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", search, page],
    queryFn: () => listAuditLogs({ search: search || undefined, page, limit: PAGE_SIZE }),
  });

  const logs = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Journal d'audit</h1>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Rechercher dans le journal..."
          className="w-full max-w-sm border rounded px-3 py-2"
        />
      </div>

      {isLoading && <p>Chargement...</p>}
      {isError && <p className="text-red-600">Erreur de chargement.</p>}
      {!isLoading && !isError && logs.length === 0 && (
        <p className="text-gray-600">Aucun événement d'audit.</p>
      )}

      {!isLoading && !isError && logs.length > 0 && (
        <>
          <table className="w-full bg-white rounded shadow">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">Date</th>
                <th className="p-3">Utilisateur</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entité</th>
                <th className="p-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-3">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="p-3">
                    {log.userFirstName || log.userLastName
                      ? `${log.userFirstName ?? ""} ${log.userLastName ?? ""}`.trim()
                      : `Utilisateur #${log.userId ?? "inconnu"}`}
                  </td>
                  <td className="p-3">{ACTION_LABELS[log.action] ?? log.action}</td>
                  <td className="p-3">{ENTITY_LABELS[log.entityType] ?? log.entityType}</td>
                  <td className="p-3 text-gray-700">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
