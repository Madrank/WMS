import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import ArticlesPage from "./pages/ArticlesPage.js";
import MainLayout from "./layouts/MainLayout.js";
import SuppliersPage from "./pages/SuppliersPage.js";
import StocksPage from "./pages/StocksPage.js";
import ReceiptsPage from "./pages/ReceiptsPage.js";
import InventoriesPage from "./pages/InventoriesPage.js";
import MovementsPage from "./pages/MovementsPage.js";
import WarehousePage from "./pages/WarehousePage.js";
import ZonesPage from "./pages/ZonesPage.js";
import LocationsPage from "./pages/LocationsPage.js";
import UsersPage from "./pages/UsersPage.js";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<MainLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="articles" element={<ArticlesPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="warehouse/zones" element={<ZonesPage />} />
        <Route path="warehouse/locations" element={<LocationsPage />} />
        <Route path="stocks" element={<StocksPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="inventories" element={<InventoriesPage />} />
        <Route path="movements" element={<MovementsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}