import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { getCurrentUser, logout } from "../services/authService.js";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/articles", label: "Articles" },
  { to: "/suppliers", label: "Fournisseurs" },
  { to: "/warehouse", label: "Entrepôt" },
  { to: "/stocks", label: "Stocks" },
  { to: "/receipts", label: "Réceptions" },
  { to: "/inventories", label: "Inventaires" },
  { to: "/movements", label: "Mouvements" },
];

interface DashboardSummary {
  lowStock: { reference: string; name: string; minimumStock: number; totalQuantity: number }[];
}

export default function MainLayout() {
  const user = getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data as DashboardSummary,
  });

  const lowStockCount = dashboardQuery.data?.lowStock.length ?? 0;
  const lowStockLabel =
    lowStockCount === 1 ? "1 produit à réapprovisionner" : `${lowStockCount} produits à réapprovisionner`;

  async function handleLogout() {
    await logout();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 text-xl font-bold border-b border-gray-700">
          Mini-WMS
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-2 rounded mb-1 ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `block px-4 py-2 rounded mb-1 ${
                  isActive ? "bg-blue-600" : "hover:bg-gray-800"
                }`
              }
            >
              Utilisateurs
            </NavLink>
          )}
          {lowStockCount > 0 && (
            <NavLink
              to="/dashboard"
              className="flex items-center justify-between px-4 py-2 rounded mb-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40"
            >
              <span className="text-orange-300">Stock faible</span>
              <span className="bg-orange-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {lowStockCount}
              </span>
            </NavLink>
          )}
        </nav>
        <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-700">
          {dashboardQuery.isLoading ? "Vérification du stock..." : lowStockCount > 0 ? lowStockLabel : "Stock OK"}
        </div>
        <button
          onClick={handleLogout}
          className="p-4 text-left text-red-400 hover:bg-gray-800"
        >
          Déconnexion
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}