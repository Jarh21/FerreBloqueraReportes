import { pool,ejecutarConsultaEnEmpresaPorId } from "../../config/database.js";

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
            
            concepto_contable, // <--- 1. RECIBIMOS EL NUEVO CAMPO (STRING)
            concepto,
            
            monto,
            moneda,      
            tasa,
            referencia_usd,
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

        // C. GESTIÓN DE LA CUENTA BANCARIA
        if (beneficiarioId && debeGuardar && tipo_pago !== 'EFECTIVO USD') {
            const [cuentas] = await connection.query(
                "SELECT id FROM beneficiarios_cuentas WHERE beneficiario_id = ? AND tipo_pago = ? AND identificador = ? AND banco = ?",
                [beneficiarioId, tipo_pago, identificador, beneficiario_banco || null]
            );

            if (cuentas.length === 0) {
                await connection.query(
                    "INSERT INTO beneficiarios_cuentas (beneficiario_id, tipo_pago, banco, identificador) VALUES (?, ?, ?, ?)",
                    [beneficiarioId, tipo_pago, beneficiario_banco || null, identificador]
                );
            }
        }

        // 3. SI ERA SOLO REGISTRO, TERMINAMOS AQUÍ
        if (modo_beneficiario === 'solo_registro') {
            await connection.commit();
            return res.status(200).json({ success: true, message: "Beneficiario agregado al directorio correctamente." });
        }

        // 4. CREAR LA SOLICITUD (CON LOS NUEVOS CAMPOS)
        const querySolicitud = `
            INSERT INTO detalles_solicitudes 
            (
                solicitante, empresa_id, concepto, concepto_contable, 
                beneficiario_nombre, beneficiario_rif, beneficiario_banco, beneficiario_identificador, tipo_pago,
                monto, moneda_pago, tasa_cambio, pago_efectivo, referencia_pago, banco_origen, estado_pago,
                referencia_usd
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
        `;

        const [resultSolicitud] = await connection.query(querySolicitud, [
            solicitante,
            empresa_id || 1,
            concepto,
            concepto_contable || null, // <--- 3. INSERTAMOS EL VALOR
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
            estado_pago || 0,
            referencia_usd || null 
        ]);

        // 5. NOTIFICACIÓN PUSH
        if (req.io) {
            const [infoEmpresa] = await connection.query(
                "SELECT nombre FROM empresas WHERE id = ?", 
                [empresa_id || 1] 
            );
            
            const nombreEmpresa = infoEmpresa.length > 0 ? infoEmpresa[0].nombre : 'Sistema';

            req.io.emit('nueva_solicitud', {
                id: resultSolicitud.insertId,
                mensaje: `Empresa: ${nombreEmpresa} Creada por: ${solicitante}`,
                monto: monto,
                moneda: moneda,
                empresa_id: empresa_id 
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
        // 1. Recibimos las fechas por Query Params
        const { fechaDesde, fechaHasta } = req.query; 
        
        // --- CONSTRUCCIÓN DINÁMICA DE LA CONSULTA CON SUBCONSULTA USD ---
        // Usamos el alias 'ds' para la tabla detalles_solicitudes
        let sql = `
            SELECT ds.*, 
            (
                SELECT COALESCE(SUM(ph.monto_equivalente_usd), 0) 
                FROM pagos_historial ph 
                WHERE ph.solicitud_id = ds.id
            ) as pagado_usd_historico
            FROM detalles_solicitudes ds 
            WHERE ds.empresa_id = ?
        `;
        
        let params = [empresaId];

        // Si existen ambas fechas, aplicamos el filtro de rango
        if (fechaDesde && fechaHasta) {
            // Usamos 'ds.creado_en' para ser específicos por el alias
            sql += " AND ds.creado_en BETWEEN ? AND ?";
            params.push(`${fechaDesde} 00:00:00`); // Inicio del día
            params.push(`${fechaHasta} 23:59:59`); // Final del día
        }

        // Agregamos el ordenamiento al final
        sql += " ORDER BY ds.creado_en DESC";

        // 2. Ejecutamos la consulta con los parámetros dinámicos
        const [solicitudes] = await pool.query(sql, params);

        // Si no hay solicitudes (por filtro o porque no existen), retornamos vacío
        if (solicitudes.length === 0) {
            return res.json([]);
        }

        // --- A PARTIR DE AQUÍ TU LÓGICA DE PAGOS SE MANTIENE IGUAL ---

        // 3. Extraer los IDs para buscar sus pagos detallados
        const solicitudIds = solicitudes.map(s => s.id);

        // 4. Buscar el HISTORIAL COMPLETO de pagos para estas solicitudes
        const [pagos] = await pool.query(
            `SELECT * FROM pagos_historial WHERE solicitud_id IN (?) ORDER BY creado_en ASC`,
            [solicitudIds]
        );
         // Obtener cuentas y conceptos para mapear los nombres posteriormente
        const [cuentas, conceptos] = await Promise.all([
            listarContCuentas(empresaId),
            //listarContConceptos(empresaId)
        ]);
        // Crear mapas para acceso rápido a nombres por keycodigo
        const cuentasMap = new Map(cuentas.map(item => [Number(item.keycodigo), item.nombre]));
        //const conceptosMap = new Map(conceptos.map(item => [Number(item.keycodigo), item.nombre]));

        // Agregar nombres de cuenta y concepto a cada resultado
        const resultadosConNombres = pagos.map(row => ({
            ...row,
            cont_cuenta_nombre: cuentasMap.get(Number(row.banco_origen)) || null,
            //cont_concepto_nombre: conceptosMap.get(Number(row.cont_concepto_id)) || null
        }));

        // 5. Combinar: Metemos el array de 'pagos' dentro de cada 'solicitud'
        const resultado = solicitudes.map(solicitud => {
            const susPagos = resultadosConNombres.filter(p => p.solicitud_id === solicitud.id);
            
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

        const usuarioResponsable = req.user ? (req.user.nombre || req.user.email) : 'Sistema';

        const { 
            id_solicitud, 
            banco_origen, 
            referencia, 
            monto_pagado,
            tasa_cambio 
        } = req.body;

        // 1. Parseo de Tasa
        let tasaFinal = null;
        if (tasa_cambio && tasa_cambio !== 'null' && tasa_cambio !== '') {
            tasaFinal = parseFloat(tasa_cambio);
        }

        const comprobanteUrl = req.file ? `/uploads/comprobantes/${req.file.filename}` : null;

        // 2. OBTENER DATOS
        const [solicitud] = await connection.query(
            "SELECT monto, total_pagado, moneda_pago FROM detalles_solicitudes WHERE id = ?", 
            [id_solicitud]
        );

        if (solicitud.length === 0) throw new Error("Solicitud no encontrada");

        const datosSolicitud = solicitud[0]; 
        const montoTotal = parseFloat(datosSolicitud.monto);
        const pagadoPrevio = parseFloat(datosSolicitud.total_pagado || 0);
        const pagoActual = parseFloat(monto_pagado);

        // --- 3. NUEVO CÁLCULO DE EQUIVALENCIA USD ---
        let equivalenteUsd = 0;

        if (datosSolicitud.moneda_pago === 'USD') {
            // Si pagan en Dólares, la equivalencia es el mismo monto
            equivalenteUsd = pagoActual;
        } else {
            // Si pagan en Bolívares (VES), dividimos entre la tasa recibida
            // (Protegemos contra división por cero)
            if (tasaFinal && tasaFinal > 0) {
                equivalenteUsd = pagoActual / tasaFinal;
            } else {
                equivalenteUsd = 0; // O lanzar error si es obligatorio
            }
        }
        // ---------------------------------------------

        // 4. CALCULAR NUEVO ESTADO (En moneda original)
        const nuevoTotalPagado = pagadoPrevio + pagoActual;
        let nuevoEstado = (nuevoTotalPagado >= (montoTotal - 0.01)) ? 1 : 3;

        // 5. INSERTAR EN HISTORIAL (CON EL CAMPO NUEVO)
        await connection.query(`
            INSERT INTO pagos_historial 
            (solicitud_id, monto_pagado, moneda, banco_origen, referencia, comprobante_url, creado_por, tasa_cambio, monto_equivalente_usd)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_solicitud, 
            pagoActual, 
            datosSolicitud.moneda_pago, 
            banco_origen, 
            referencia, 
            comprobanteUrl,
            usuarioResponsable,
            tasaFinal,
            equivalenteUsd // <--- AQUI SE GUARDA EL CÁLCULO
        ]);

        // 6. ACTUALIZAR SOLICITUD
        await connection.query(`
            UPDATE detalles_solicitudes 
            SET total_pagado = ?, estado_pago = ?, comprobante_url = ?, banco_origen = ?, referencia_pago = ?  
            WHERE id = ?
        `, [nuevoTotalPagado, nuevoEstado, comprobanteUrl, banco_origen, referencia, id_solicitud]);

        await connection.commit();
        
        res.status(200).json({ 
            success: true, 
            message: nuevoEstado === 1 ? "Pago completado." : "Abono registrado." 
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error al procesar pago:", error);
        res.status(500).json({ message: "Error interno", error: error.message });
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

// solicitudes.controller.js

export const EditarSolicitud = async (req, res) => {
    const { id } = req.params;
    const { 
        beneficiario_nombre, beneficiario_rif, beneficiario_banco, 
        identificador, concepto, monto, moneda_pago, tasa_cambio 
    } = req.body;

    const connection = await pool.getConnection();

    try {
        // Validar que no esté pagada (Estado 1)
        const [check] = await connection.query("SELECT estado_pago FROM detalles_solicitudes WHERE id = ?", [id]);
        if (check.length === 0) return res.status(404).json({ message: "Solicitud no encontrada" });
        if (check[0].estado_pago === 1) return res.status(400).json({ message: "No se puede editar una solicitud PAGADA" });

        await connection.query(`
            UPDATE detalles_solicitudes SET 
                beneficiario_nombre = ?,
                beneficiario_rif = ?,
                beneficiario_banco = ?,
                beneficiario_identificador = ?,
                concepto = ?,
                monto = ?,
                moneda_pago = ?,
                tasa_cambio = ?
            WHERE id = ?
        `, [beneficiario_nombre, beneficiario_rif, beneficiario_banco, identificador, concepto, monto, moneda_pago, tasa_cambio, id]);

        res.json({ success: true, message: "Solicitud actualizada correctamente" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar" });
    } finally {
        connection.release();
    }
};
function listarContCuentas(empresaId) {
    const sql = `SELECT keycodigo, nombre FROM cont_cuenta `;
    return ejecutarConsultaEnEmpresaPorId(empresaId, sql);
}
function listarContConceptos(empresaId) {
    const sql = `SELECT keycodigo, nombre FROM cont_concepto`;
    return ejecutarConsultaEnEmpresaPorId(empresaId, sql);
}