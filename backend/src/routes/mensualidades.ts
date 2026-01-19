import { Router } from "express";
import { pool } from "../db";

const router = Router();

// GET /mensualidades/detalle - Obtener detalle de mensualidades por mes y tarjeta
router.get("/detalle", async (req, res) => {
  const { mes, tarjeta } = req.query;
  
  console.log('📊 GET /mensualidades/detalle:', { mes, tarjeta });
  
  try {
    if (!mes || !tarjeta) {
      return res.status(400).json({ error: 'Se requieren parámetros mes y tarjeta' });
    }

    const result = await pool.query(`
      SELECT
        m.id,
        m.mes,
        m.numero_mensualidad,
        m.monto,
        c.comercio,
        c.concepto,
        c.meses as meses_sin_intereses,
        c.id as compra_id
      FROM mensualidades m
      JOIN comprasmsi c ON c.id = m.compra_id
      JOIN tarjetas t ON t.id = m.tarjeta_id
      WHERE m.pagada = false
        AND DATE_TRUNC('month', m.mes) = DATE_TRUNC('month', $1::date)
        AND t.nombre = $2
      ORDER BY c.fecha_compra, m.numero_mensualidad
    `, [mes, tarjeta]);

    console.log('✅ Mensualidades encontradas:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener detalle:', err);
    res.status(500).json({ error: "Error al obtener detalle de mensualidades" });
  }
});

// GET /mensualidades - Obtener todas las mensualidades
router.get("/", async (_, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.id,
        m.compra_id,
        t.nombre AS tarjeta,
        c.comercio,
        c.concepto,
        m.numero_mensualidad,
        m.monto,
        m.pagada,
        m.fecha_pago,
        m.mes
      FROM mensualidades m
      JOIN comprasmsi c ON c.id = m.compra_id
      JOIN tarjetas t ON t.id = c.tarjeta_id
      ORDER BY m.mes ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener mensualidades" });
  }
});

// GET /mensualidades/:compraId - Obtener mensualidades de una compra específica
router.get("/:compraId", async (req, res) => {
  const { compraId } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT 
        m.id,
        m.compra_id,
        t.nombre AS tarjeta,
        m.numero_mensualidad,
        m.monto,
        m.pagada,
        m.fecha_pago,
        m.mes
      FROM mensualidades m
      JOIN comprasmsi c ON c.id = m.compra_id
      JOIN tarjetas t ON t.id = c.tarjeta_id
      WHERE m.compra_id = $1
      ORDER BY m.mes ASC
    `, [compraId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener mensualidades de la compra" });
  }
});

export default router;
