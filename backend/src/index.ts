import "dotenv/config";
import express from "express";
import cors from "cors";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { authRouter } from "./routes/authRoutes.js";
import { articleRouter } from "./routes/articleRoutes.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/articles", articleRouter);
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`API démarrée sur http://localhost:${port}`);
});