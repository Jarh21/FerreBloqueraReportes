import { pool } from "../../config/database.js";

// ----------------------------------------------------
// CREAR SOLICITUD (CORREGIDO: GUARDA TIPO_PAGO)
// ----------------------------------------------------
export const CrearSolicitud = async (req, res) => {
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            modo_beneficiario,      
            guardar_en_directorio,  
            
            beneficiario_nombre,
            beneficiario_rif,
            beneficiario_email,
            beneficiario_telefono,
            beneficiario_cuenta,
            beneficiario_banco,
            
            tipo_pago, 
            solicitante,
            empresa_id,
            concepto,
            monto,
            moneda,      
            tasa,
            referencia,  
            banco_origen, 
            estado_pago 
        } = req.body;

        // 1. SANITIZACIÓN
        const rifLimpio = beneficiario_rif ? beneficiario_rif.trim().toUpperCase() : '';
        const nombreLimpio = beneficiario_nombre ? beneficiario_nombre.trim() : '';

        let identificador = '';
        if (tipo_pago === 'ZELLE' || tipo_pago === 'BINANCE') identificador = beneficiario_email ? beneficiario_email.trim() : '';
        else if (tipo_pago === 'PAGO MOVIL') identificador = beneficiario_telefono ? beneficiario_telefono.trim() : '';
        else if (tipo_pago === 'TRANSFERENCIA') identificador = beneficiario_cuenta ? beneficiario_cuenta.trim() : '';
        else identificador = 'N/A'; 

        // 2. GESTIÓN DE BENEFICIARIO
        let beneficiarioId = null;

        // A. Buscar si ya existe
        if (rifLimpio) {
            const [existingUser] = await connection.query("SELECT id FROM beneficiarios WHERE rif = ?", [rifLimpio]);
            if (existingUser.length > 0) beneficiarioId = existingUser[0].id;
        }

        const debeGuardar = modo_beneficiario === 'solo_registro' || (modo_beneficiario === 'nuevo' && guardar_en_directorio);

        // B. Crear SOLO si no existe Y tenemos permiso de guardar
        if (!beneficiarioId && debeGuardar) {
             const [result] = await connection.query(
                "INSERT INTO beneficiarios (nombre, rif) VALUES (?, ?)",
                [nombreLimpio, rifLimpio]
            );
            beneficiarioId = result.insertId;
        }

        // -----------------------------------------------------------------------
        // C. GESTIÓN DE LA CUENTA BANCARIA (AQUÍ ESTÁ LA MODIFICACIÓN)
        // -----------------------------------------------------------------------
        if (beneficiarioId && debeGuardar && tipo_pago !== 'EFECTIVO USD') {
            
            // CAMBIO: Ahora verificamos también el 'banco'.
            // Antes: Solo miraba si el teléfono existía.
            // Ahora: Mira si el teléfono existe EN ESE BANCO ESPECÍFICO.
            const [cuentas] = await connection.query(
                "SELECT id FROM beneficiarios_cuentas WHERE beneficiario_id = ? AND tipo_pago = ? AND identificador = ? AND banco = ?",
                [beneficiarioId, tipo_pago, identificador, beneficiario_banco || null]
            );

            // Si no existe esa combinación exacta (ID + Tipo + Identificador + Banco), la insertamos.
            if (cuentas.length === 0) {
                await connection.query(
                    "INSERT INTO beneficiarios_cuentas (beneficiario_id, tipo_pago, banco, identificador) VALUES (?, ?, ?, ?)",
                    [beneficiarioId, tipo_pago, beneficiario_banco || null, identificador]
                );
            }
        }
        // -----------------------------------------------------------------------

        // 3. SI ERA SOLO REGISTRO, TERMINAMOS AQUÍ
        if (modo_beneficiario === 'solo_registro') {
            await connection.commit();
            return res.status(200).json({ success: true, message: "Beneficiario agregado al directorio correctamente." });
        }

        // 4. CREAR LA SOLICITUD
        const querySolicitud = `
            INSERT INTO detalles_solicitudes 
            (
                solicitante, empresa_id, concepto, 
                beneficiario_nombre, beneficiario_rif, beneficiario_banco, beneficiario_identificador, tipo_pago,
                monto, moneda_pago, tasa_cambio, pago_efectivo, referencia_pago, banco_origen, estado_pago
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [resultSolicitud] = await connection.query(querySolicitud, [
            solicitante,
            empresa_id || 1,
            concepto,
            nombreLimpio,
            rifLimpio, 
            beneficiario_banco || (tipo_pago === 'ZELLE' ? 'ZELLE' : null),
            identificador,
            tipo_pago,
            monto,
            moneda,
            tasa || 1,
            tipo_pago === 'EFECTIVO USD' ? 1 : 0,
            referencia || null,
            banco_origen || null,
            estado_pago || 0
        ]);

        // 5. NOTIFICACIÓN PUSH
        if (req.io) {
            req.io.emit('nueva_solicitud', {
                id: resultSolicitud.insertId,
                mensaje: `Nueva solicitud creada por ${solicitante}`,
                monto: monto,
                moneda: moneda
            });
        }

        await connection.commit();
        res.status(200).json({ 
            success: true, 
            message: "Solicitud de pago creada exitosamente.",
            id: resultSolicitud.insertId 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error en CrearSolicitud:", error);
        res.status(500).json({ success: false, message: "Error al procesar la solicitud", error: error.message });
    } finally {
        connection.release();
    }
};
// ----------------------------------------------------
// OBTENER LISTADO (GET)
// ----------------------------------------------------
export const ObtenerSolicitudes = async (req, res) => {
    try {
        const { empresaId } = req.params;
        // 1. Recibimos las fechas por Query Params (ej: ?fechaDesde=2023-10-01&fechaHasta=2023-10-31)
        const { fechaDesde, fechaHasta } = req.query; 
        
        // --- CONSTRUCCIÓN DINÁMICA DE LA CONSULTA ---
        let sql = "SELECT * FROM detalles_solicitudes WHERE empresa_id = ?";
        let params = [empresaId];

        // Si existen ambas fechas, aplicamos el filtro de rango
        if (fechaDesde && fechaHasta) {
            sql += " AND creado_en BETWEEN ? AND ?";
            params.push(`${fechaDesde} 00:00:00`); // Inicio del día
            params.push(`${fechaHasta} 23:59:59`); // Final del día
        }

        // Agregamos el ordenamiento al final
        sql += " ORDER BY creado_en DESC";

        // 2. Ejecutamos la consulta con los parámetros dinámicos
        const [solicitudes] = await pool.query(sql, params);

        // Si no hay solicitudes (por filtro o porque no existen), retornamos vacío
        if (solicitudes.length === 0) {
            return res.json([]);
        }

        // --- A PARTIR DE AQUÍ TU LÓGICA DE PAGOS SE MANTIENE IGUAL ---

        // 3. Extraer los IDs para buscar sus pagos
        const solicitudIds = solicitudes.map(s => s.id);

        // 4. Buscar el HISTORIAL COMPLETO de pagos para estas solicitudes
        // Nota: Al usar solicitudIds filtrados, esta consulta también es más eficiente
        const [pagos] = await pool.query(
            `SELECT * FROM pagos_historial WHERE solicitud_id IN (?) ORDER BY creado_en ASC`,
            [solicitudIds]
        );

        // 5. Combinar: Metemos el array de 'pagos' dentro de cada 'solicitud'
        const resultado = solicitudes.map(solicitud => {
            const susPagos = pagos.filter(p => p.solicitud_id === solicitud.id);
            
            return {
                ...solicitud,
                pagos: susPagos 
            };
        });

        res.json(resultado);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener solicitudes" });
    }
};

// ----------------------------------------------------
// BUSCAR BENEFICIARIOS (AUTOCOMPLETE)
// ----------------------------------------------------
export const BuscarBeneficiarios = async (req, res) => {
    try {
        const { term } = req.query; 

        if (!term || term.length < 2) {
            return res.json([]);
        }

        const searchTerm = `%${term}%`;

        const query = `
            SELECT 
                b.id as beneficiario_id,
                b.nombre,
                b.rif,
                c.id as cuenta_id,
                c.tipo_pago,
                c.banco,
                c.identificador
            FROM beneficiarios b
            INNER JOIN beneficiarios_cuentas c ON b.id = c.beneficiario_id
            WHERE 
                b.nombre LIKE ? OR 
                b.rif LIKE ? OR 
                c.identificador LIKE ?
            LIMIT 15
        `;

        const [rows] = await pool.query(query, [searchTerm, searchTerm, searchTerm]);
        res.json(rows);

    } catch (error) {
        console.error("Error buscando beneficiarios:", error);
        res.status(500).json({ message: "Error en la búsqueda" });
    }
};

// Asegúrate de importar 'fs' y 'path' si necesitas borrar imágenes en caso de error (opcional)
// import fs from 'fs'; 

// ----------------------------------------------------
// PROCESAR PAGO (TOTAL O PARCIAL)
// ----------------------------------------------------
export const ProcesarPago = async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Asumiendo que req.user tiene los datos del usuario logueado (gracias al middleware de auth)
        // Si no tienes req.user.nombre o email, puedes poner 'Sistema' o null
        const usuarioResponsable = req.user ? (req.user.nombre || req.user.email) : 'Sistema';

        const { 
            id_solicitud, 
            banco_origen, 
            referencia, 
            monto_pagado 
        } = req.body;

        const comprobanteUrl = req.file ? `/uploads/comprobantes/${req.file.filename}` : null;

        // 1. OBTENER INFORMACIÓN ACTUAL (Agregamos 'moneda_pago')
        const [solicitud] = await connection.query(
            "SELECT monto, total_pagado, moneda_pago FROM detalles_solicitudes WHERE id = ?", 
            [id_solicitud]
        );

        if (solicitud.length === 0) {
            throw new Error("Solicitud no encontrada");
        }

        const datosSolicitud = solicitud[0]; // Guardamos la info para usarla
        const montoTotal = parseFloat(datosSolicitud.monto);
        const pagadoPrevio = parseFloat(datosSolicitud.total_pagado || 0);
        const pagoActual = parseFloat(monto_pagado);

        // 2. CALCULAR NUEVO ESTADO
        const nuevoTotalPagado = pagadoPrevio + pagoActual;
        
        let nuevoEstado = 0;
        // Usamos una pequeña tolerancia (0.01) para evitar problemas de redondeo
        if (nuevoTotalPagado >= (montoTotal - 0.01)) { 
            nuevoEstado = 1; // Pagado completo
        } else {
            nuevoEstado = 3; // Abonado / Parcial
        }

        // 3. INSERTAR EN EL HISTORIAL (ADAPTADO A TU TABLA REAL)
        // OJO: 'moneda' es NOT NULL en tu tabla, así que la tomamos de la solicitud padre
        await connection.query(`
            INSERT INTO pagos_historial 
            (solicitud_id, monto_pagado, moneda, banco_origen, referencia, comprobante_url, creado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            id_solicitud, 
            pagoActual, 
            datosSolicitud.moneda_pago, // Insertamos la moneda (VES/USD)
            banco_origen, 
            referencia, 
            comprobanteUrl,
            usuarioResponsable // Guardamos quién registró el pago
        ]);

        // 4. ACTUALIZAR LA SOLICITUD PRINCIPAL
        await connection.query(`
            UPDATE detalles_solicitudes 
            SET 
                total_pagado = ?,
                estado_pago = ?,
                comprobante_url = ?,  
                banco_origen = ?,    
                referencia_pago = ?  
            WHERE id = ?
        `, [nuevoTotalPagado, nuevoEstado, comprobanteUrl, banco_origen, referencia, id_solicitud]);

        await connection.commit();
        
        res.status(200).json({ 
            success: true, 
            message: nuevoEstado === 1 ? "Pago completado exitosamente." : "Abono registrado correctamente." 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error al procesar pago:", error);
        res.status(500).json({ message: "Error interno al procesar el pago", error: error.message });
    } finally {
        connection.release();
    }
};

// solicitudes.controller.js

export const AnularSolicitud = async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Verificar estado actual
        const [solicitud] = await connection.query(
            "SELECT estado_pago, solicitante FROM detalles_solicitudes WHERE id = ?", 
            [id]
        );

        if (solicitud.length === 0) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        if (solicitud[0].estado_pago === 1) {
            return res.status(400).json({ message: "No se puede anular una solicitud que ya está PAGADA." });
        }

        // 2. Actualizar estado a 2 (ANULADO)
        await connection.query(
            "UPDATE detalles_solicitudes SET estado_pago = 2 WHERE id = ?",
            [id]
        );

        // 3. Notificar a todos por Socket (Para que la tabla se refresque sola)
        if (req.io) {
            req.io.emit('solicitud_anulada', {
                id: id,
                mensaje: `Solicitud #${id} anulada por administración.`
            });
        }

        await connection.commit();
        res.status(200).json({ message: "Solicitud anulada correctamente" });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: "Error interno al anular" });
    } finally {
        connection.release();
    }
};