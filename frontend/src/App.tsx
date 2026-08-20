import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.js";
import DashboardPage from "./pages/DashboardPage.js";
import ArticlesPage from "./pages/ArticlesPage.js";
import ArticleNewPage from "./pages/ArticleNewPage.js";
import ArticleEditPage from "./pages/ArticleEditPage.js";
import ArticleDetailPage from "./pages/ArticleDetailPage.js";
import SuppliersPage from "./pages/SuppliersPage.js";
import SupplierNewPage from "./pages/SupplierNewPage.js";
import SupplierDetailPage from "./pages/SupplierDetailPage.js";
import MainLayout from "./layouts/MainLayout.js";
import StocksPage from "./pages/StocksPage.js";
import ReceiptsPage from "./pages/ReceiptsPage.js";
import ReceiptNewPage from "./pages/ReceiptNewPage.js";
import ReceiptDetailPage from "./pages/ReceiptDetailPage.js";
import InventoriesPage from "./pages/InventoriesPage.js";
import InventoryNewPage from "./pages/InventoryNewPage.js";
import InventoryDetailPage from "./pages/InventoryDetailPage.js";
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
        <Route path="articles/new" element={<ArticleNewPage />} />
        <Route path="articles/:id/edit" element={<ArticleEditPage />} />
        <Route path="articles/:id" element={<ArticleDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="suppliers/new" element={<SupplierNewPage />} />
        <Route path="suppliers/:id" element={<SupplierDetailPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="warehouse/zones" element={<ZonesPage />} />
        <Route path="warehouse/locations" element={<LocationsPage />} />
        <Route path="stocks" element={<StocksPage />} />
        <Route path="receipts" element={<ReceiptsPage />} />
        <Route path="receipts/new" element={<ReceiptNewPage />} />
        <Route path="receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="inventories" element={<InventoriesPage />} />
        <Route path="inventories/new" element={<InventoryNewPage />} />
        <Route path="inventories/:id" element={<InventoryDetailPage />} />
        <Route path="movements" element={<MovementsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}