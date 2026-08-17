import "dotenv/config";
import express from "express";
import cors from "cors";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { articleRouter } from "./routes/articleRoutes.js";
import { supplierRouter } from "./routes/supplierRoutes.js";
import { warehouseRouter } from "./routes/warehouseRoutes.js";
import { zoneRouter } from "./routes/zoneRoutes.js";
import { locationRouter } from "./routes/locationRoutes.js";
import { stockRouter } from "./routes/stockRoutes.js";
import { movementRouter } from "./routes/stockMovementRoutes.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/articles", articleRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/warehouses", warehouseRouter);
app.use("/api/zones", zoneRouter);
app.use("/api/locations", locationRouter);
app.use("/api/stocks", stockRouter);
app.use("/api/movements", movementRouter);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API démarrée sur http://localhost:${port}`);
});