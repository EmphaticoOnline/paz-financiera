import { Router } from "express";
import { pool } from "../db";

const router = Router();

// GET /flujo-mensual - Obtener el flujo mensual de compras MSI
router.get("/", async (_, res) => {
  try {
    // La view ya filtra por fechas >= hoy, no necesitamos filtro adicional
    const result = await pool.query(
      "SELECT * FROM vw_flujo_msi_mensual"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo flujo mensual" });
  }
});

export default router;
