import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import tarjetasRoutes from "./routes/tarjetas";
import comprasRoutes from "./routes/compras";
import flujoRoutes from "./routes/flujo";
import mensualidadesRoutes from "./routes/mensualidades";
import flujoMensualRoutes from "./routes/flujo-mensual";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());   // ← FALTABA
const PORT = 4000;

// Rutas reales de la API
app.use("/tarjetas", tarjetasRoutes);  // ← FALTABA
app.use("/compras", comprasRoutes);    // ← FALTABA
app.use("/flujo", flujoRoutes);
app.use("/mensualidades", mensualidadesRoutes);
app.use("/flujo-mensual", flujoMensualRoutes);

app.get("/", (_, res) => {
  res.send("Servidor Paz-Financiera funcionando ✅");
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT} 🚀`);
});
