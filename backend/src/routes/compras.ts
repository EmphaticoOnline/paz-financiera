import { Router } from "express";
import { pool } from "../db";

const router = Router();

router.get("/", async (_, res) => {
  const r = await pool.query(`
    SELECT 
      c.id,
      c.tarjeta_id,
      t.nombre AS tarjeta,
      c.comercio,
      c.concepto,
      c.monto,
      c.meses,
      c.fecha_compra,
      COUNT(m.mes) FILTER (WHERE m.mes < CURRENT_DATE) AS meses_pagados,
      c.meses - COUNT(m.mes) FILTER (WHERE m.mes < CURRENT_DATE) AS meses_restantes,
      ROUND((c.monto / c.meses) * (c.meses - COUNT(m.mes) FILTER (WHERE m.mes < CURRENT_DATE)), 2) AS saldo_restante,
      MAX(m.mes) AS fecha_fin
    FROM comprasmsi c
    JOIN tarjetas t ON t.id = c.tarjeta_id
    LEFT JOIN mensualidades m ON m.compra_id = c.id
    GROUP BY c.id, t.nombre, c.comercio, c.concepto, c.monto, c.meses, c.fecha_compra
    ORDER BY c.fecha_compra DESC
  `);
  res.json(r.rows);
});

// POST - Crear nueva compra
router.post("/", async (req, res) => {
  const { tarjeta_id, comercio, concepto, monto, meses, fecha_compra } = req.body;
  
  console.log('📥 POST /compras recibido:', req.body);
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Validar campos requeridos
    if (!tarjeta_id || !comercio || !concepto || !monto || !meses || !fecha_compra) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Usuario fijo
    const usuario_id = '2688de70-9ac8-414d-89a9-3bb275f620fd';

    // Insertar compra
    const result = await client.query(
      `INSERT INTO comprasmsi (usuario_id, tarjeta_id, comercio, concepto, monto, meses, fecha_compra) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [usuario_id, tarjeta_id, comercio, concepto, monto, meses, fecha_compra]
    );

    const nuevaCompra = result.rows[0];
    console.log('✅ Compra creada:', nuevaCompra);

    // El trigger de la base de datos se encarga de crear las mensualidades automáticamente
    // No necesitamos crearlas manualmente aquí

    await client.query('COMMIT');
    res.status(201).json(nuevaCompra);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error al crear compra:', err);
    res.status(500).json({ error: 'Error al crear compra' });
  } finally {
    client.release();
  }
});

// PUT - Actualizar compra
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { tarjeta_id, comercio, concepto, monto, meses, fecha_compra } = req.body;
  
  console.log('📝 PUT /compras/' + id, req.body);
  
  try {
    const result = await pool.query(
      `UPDATE comprasmsi 
       SET tarjeta_id = $1, comercio = $2, concepto = $3, monto = $4, meses = $5, fecha_compra = $6
       WHERE id = $7
       RETURNING *`,
      [tarjeta_id, comercio, concepto, monto, meses, fecha_compra, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    console.log('✅ Compra actualizada:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error al actualizar compra:', err);
    res.status(500).json({ error: 'Error al actualizar compra' });
  }
});

// DELETE - Eliminar compra
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️  DELETE /compras/' + id);
  
  try {
    // Primero eliminar mensualidades
    await pool.query('DELETE FROM mensualidades WHERE compra_id = $1', [id]);
    
    // Luego eliminar compra
    const result = await pool.query(
      'DELETE FROM comprasmsi WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    console.log('✅ Compra eliminada:', result.rows[0]);
    res.json({ message: 'Compra eliminada exitosamente' });
  } catch (err) {
    console.error('❌ Error al eliminar compra:', err);
    res.status(500).json({ error: 'Error al eliminar compra' });
  }
});

// Recalcular todas las mensualidades
router.post("/recalcular-todas", async (_, res) => {
  try {
    // Llamar a la función de PostgreSQL
    await pool.query('SELECT regenerar_todas_mensualidades()');
    
    res.json({ message: 'Todas las mensualidades han sido recalculadas exitosamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al recalcular mensualidades' });
  }
});

// Recalcular mensualidades de una compra específica
router.post("/:id/recalcular", async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Eliminar mensualidades de esta compra
    await client.query('DELETE FROM mensualidades WHERE compra_id = $1', [id]);
    
    // Obtener datos de la compra y tarjeta
    const compraResult = await client.query(`
      SELECT c.id, c.tarjeta_id, c.monto, c.meses, c.fecha_compra,
             t.dia_corte, t.dia_pago
      FROM comprasmsi c
      JOIN tarjetas t ON t.id = c.tarjeta_id
      WHERE c.id = $1
    `, [id]);
    
    if (compraResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Compra no encontrada' });
    }
    
    const compra = compraResult.rows[0];
    const montoPorMes = compra.monto / compra.meses;
    const fechaCompra = new Date(compra.fecha_compra);
    
    // Calcular primer mes de pago
    let primerMes = new Date(fechaCompra);
    if (fechaCompra.getDate() <= compra.dia_corte) {
      primerMes.setMonth(primerMes.getMonth() + 1);
    } else {
      primerMes.setMonth(primerMes.getMonth() + 2);
    }
    primerMes.setDate(compra.dia_pago);
    
    // Usuario fijo
    const usuario_id = '2688de70-9ac8-414d-89a9-3bb275f620fd';
    
    // Crear mensualidades
    for (let i = 0; i < compra.meses; i++) {
      const mesPago = new Date(primerMes);
      mesPago.setMonth(mesPago.getMonth() + i);
      
      await client.query(
        'INSERT INTO mensualidades (compra_id, usuario_id, tarjeta_id, mes, numero_mensualidad, monto) VALUES ($1, $2, $3, $4, $5, $6)',
        [compra.id, usuario_id, compra.tarjeta_id, mesPago.toISOString().split('T')[0], i + 1, montoPorMes]
      );
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Mensualidades recalculadas exitosamente', meses: compra.meses });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Error al recalcular mensualidades' });
  } finally {
    client.release();
  }
});

export default router;
