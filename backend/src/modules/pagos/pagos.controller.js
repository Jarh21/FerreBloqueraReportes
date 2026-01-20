import { ejecutarConsultaEnEmpresaPorId,pool } from "../../config/database.js";

// Obtener solicitudes de pago para una empresa
export async function obtenerSolicitudes(req, res) {
  try {
    const empresaId = req.query.empresa_id || req.query.empresaId || req.body.empresa_id;
    if (!empresaId) return res.status(400).json({ error: "empresa_id es requerido" });

    const sql = `SELECT * FROM solicitudes_pagos WHERE empresa_id = ? ORDER BY creado_en DESC LIMIT 500`;
    const rows = await pool.query(sql, [empresaId]);
    return res.json(Array.isArray(rows) ? rows : rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener solicitudes" });
  }
}

// Crear nueva solicitud (espera JSON con campos relevantes)
export async function crearSolicitud(req, res) {
  try {
    const payload = req.body || {};
    const empresaId = payload.empresa_id || req.query.empresa_id;
    if (!empresaId) return res.status(400).json({ error: "empresa_id es requerido" });

    // Campos esperados (ajustar según esquema de BD)
    const {
      usuario_id = null,
      tipo_pago = null,
      concepto = null,
      cuenta_contable_id = null,
      beneficiario_nombre = null,
      beneficiario_rif = null,
      beneficiario_banco = null,
      beneficiario_telefono = null,
      beneficiario_cuenta = null,
      monto_usd = 0,
      tasa = 0,
      monto_bs = 0,
      referencia = null,
      banco_origen = null,
    } = payload;

    const sql = `INSERT INTO solicitudes_pagos (empresa_id, usuario_id, tipo_pago, concepto, cuenta_contable_id, beneficiario_nombre, beneficiario_rif, beneficiario_banco, beneficiario_telefono, beneficiario_cuenta, monto_usd, tasa, monto_bs, referencia, banco_origen, creado_en, estatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pendiente')`;

    const params = [
      empresaId,
      usuario_id,
      tipo_pago,
      concepto,
      cuenta_contable_id,
      beneficiario_nombre,
      beneficiario_rif,
      beneficiario_banco,
      beneficiario_telefono,
      beneficiario_cuenta,
      monto_usd,
      tasa,
      monto_bs,
      referencia,
      banco_origen,
    ];

    const result = await pool.query(sql, params);

    return res.json({ success: true, insertId: result.insertId || result.insert_id || null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear solicitud" });
  }
}
