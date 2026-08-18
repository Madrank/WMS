import { dashboardRepository } from "../repositories/dashboardRepository.js";

export const dashboardService = {
  async getSummary() {
    const [stats, lowStock, recentMovements, stockByLocation] = await Promise.all([
      dashboardRepository.getStats(),
      dashboardRepository.getLowStock(),
      dashboardRepository.getRecentMovements(10),
      dashboardRepository.getStockByLocation(),
    ]);

    return {
      stats,
      lowStock,
      recentMovements,
      stockByLocation,
    };
  },
};