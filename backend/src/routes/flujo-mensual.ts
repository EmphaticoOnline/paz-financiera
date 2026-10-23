import { Router } from "express";
import { pool } from "../db";

const router = Router();

// GET /flujo-mensual - Obtener el flujo mensual de compras MSI
router.get("/", async (_, res) => {
  try {
    const [tarjetasResult, mensualidadesResult] = await Promise.all([
      pool.query("SELECT id, nombre FROM tarjetas ORDER BY nombre, id"),
      pool.query(`
        SELECT to_char(date_trunc('month', m.mes), 'YYYY-MM-DD') AS mes,
               m.tarjeta_id,
               SUM(m.monto) AS monto
        FROM mensualidades m
        WHERE m.pagada = false AND m.mes >= CURRENT_DATE
        GROUP BY date_trunc('month', m.mes), m.tarjeta_id
        ORDER BY date_trunc('month', m.mes)::date
      `)
    ]);

    const rows = new Map<string, { mes: string; importes: Record<string, number>; suma_total: number }>();
    for (const row of mensualidadesResult.rows) {
      const mes = String(row.mes);
      const current = rows.get(mes) ?? { mes, importes: {}, suma_total: 0 };
      const monto = Number(row.monto) || 0;
      current.importes[row.tarjeta_id] = monto;
      current.suma_total += monto;
      rows.set(mes, current);
    }

    res.json({ tarjetas: tarjetasResult.rows, flujo: Array.from(rows.values()) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo flujo mensual" });
  }
});

export default router;
