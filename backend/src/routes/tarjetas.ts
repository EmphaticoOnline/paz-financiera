import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_, res) => {
  const r = await pool.query(`
    SELECT 
      id,
      usuario_id,
      nombre,
      ultimos4,
      ultimos4_digital,
      dia_corte,
      dia_pago,
      limite_credito::float AS limite_credito
    FROM tarjetas
    ORDER BY nombre
  `);
  res.json(r.rows);
});

export default router;
