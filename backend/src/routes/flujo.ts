import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        mes,
        banamex,
        bbva,
        volaris,
        liverpool,
        liverpool_visa,
        palacio,
        mercado_pago,
        suma_total
      FROM vw_flujo_msi_mensual
      ORDER BY mes ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al consultar flujo:", error);
    res.status(500).json({ error: "Error al obtener el flujo mensual" });
  }
});

export default router;
