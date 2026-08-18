import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/articles", label: "Articles" },
  { to: "/suppliers", label: "Fournisseurs" },
  { to: "/stocks", label: "Stocks" },
  { to: "/receipts", label: "Réceptions" },
  { to: "/inventories", label: "Inventaires" },
  { to: "/movements", label: "Mouvements" },
];

export default function MainLayout() {
  function handleLogout() {
    localStorage.removeItem("token");
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
        </nav>
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