import { pool } from "../../config/database.js";

// ----------------------------------------------------
// CREAR SOLICITUD (CORREGIDO: GUARDA TIPO_PAGO)
// ----------------------------------------------------
export const CrearSolicitud = async (req, res) => {
    
    // Iniciamos conexión
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. OBTENER DATOS
        const {
            // Flags de control
            modo_beneficiario,      
            guardar_en_directorio,  
            
            // Datos del Beneficiario
            beneficiario_nombre,
            beneficiario_rif,
            beneficiario_email,
            beneficiario_telefono,
            beneficiario_cuenta,
            beneficiario_banco,
            
            // Datos de la Solicitud
            tipo_pago, // <--- Este dato ahora SÍ se guardará en el snapshot
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

        // ----------------------------------------------------
        // PASO 1: SANITIZACIÓN Y UNIFICACIÓN
        // ----------------------------------------------------
        
        const rifLimpio = beneficiario_rif ? beneficiario_rif.trim().toUpperCase() : '';
        const nombreLimpio = beneficiario_nombre ? beneficiario_nombre.trim() : '';

        let identificador = '';
        if (tipo_pago === 'ZELLE' || tipo_pago === 'BINANCE') identificador = beneficiario_email ? beneficiario_email.trim() : '';
        else if (tipo_pago === 'PAGO MOVIL') identificador = beneficiario_telefono ? beneficiario_telefono.trim() : '';
        else if (tipo_pago === 'TRANSFERENCIA') identificador = beneficiario_cuenta ? beneficiario_cuenta.trim() : '';
        else identificador = 'N/A'; 

        // Validación básica
        if (modo_beneficiario === 'registrado') {
            if (!nombreLimpio || !rifLimpio) {
                await connection.rollback();
                connection.release();
                return res.status(400).json({ message: "Faltan datos del beneficiario." });
            }
        }

        // ----------------------------------------------------
        // PASO 2: GESTIÓN DE BENEFICIARIO (BUSCAR O CREAR)
        // ----------------------------------------------------
        let beneficiarioId = null;

        // A. Buscar por RIF
        if (rifLimpio) {
            const [existingUser] = await connection.query("SELECT id FROM beneficiarios WHERE rif = ?", [rifLimpio]);
            if (existingUser.length > 0) beneficiarioId = existingUser[0].id;
        }

        // B. Crear si no existe
        if (!beneficiarioId && (modo_beneficiario === 'nuevo' || modo_beneficiario === 'solo_registro' || modo_beneficiario === 'registrado')) {
             const [result] = await connection.query(
                "INSERT INTO beneficiarios (nombre, rif) VALUES (?, ?)",
                [nombreLimpio, rifLimpio]
            );
            beneficiarioId = result.insertId;
        }

        // C. Gestión de la Cuenta Bancaria
        if (beneficiarioId && (modo_beneficiario === 'solo_registro' || guardar_en_directorio) && tipo_pago !== 'EFECTIVO USD') {
            const [cuentas] = await connection.query(
                "SELECT id FROM beneficiarios_cuentas WHERE beneficiario_id = ? AND tipo_pago = ? AND identificador = ?",
                [beneficiarioId, tipo_pago, identificador]
            );

            if (cuentas.length === 0) {
                await connection.query(
                    "INSERT INTO beneficiarios_cuentas (beneficiario_id, tipo_pago, banco, identificador) VALUES (?, ?, ?, ?)",
                    [beneficiarioId, tipo_pago, beneficiario_banco || null, identificador]
                );
            } else if (modo_beneficiario === 'solo_registro') {
                await connection.commit(); 
                connection.release();
                return res.status(200).json({ success: true, message: "El beneficiario ya tenía esta cuenta registrada." });
            }
        }

        // ----------------------------------------------------
        // PASO 3: INTERRUPCIÓN SI ES "SOLO REGISTRO"
        // ----------------------------------------------------
        if (modo_beneficiario === 'solo_registro') {
            await connection.commit();
            return res.status(200).json({ success: true, message: "Beneficiario agregado al directorio correctamente." });
        }

        // ----------------------------------------------------
        // PASO 4: CREAR LA SOLICITUD / SNAPSHOT (CORREGIDO)
        // ----------------------------------------------------
        // Aquí agregamos explícitamente 'tipo_pago' a la lista de columnas y valores
        
        const querySolicitud = `
            INSERT INTO detalles_solicitudes 
            (
                solicitante, 
                empresa_id, 
                concepto, 
                beneficiario_nombre, 
                beneficiario_rif, 
                beneficiario_banco, 
                beneficiario_identificador,
                tipo_pago,  -- <--- COLUMNA AGREGADA
                monto, 
                moneda_pago, 
                tasa_cambio, 
                pago_efectivo, 
                referencia_pago, 
                banco_origen, 
                estado_pago
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(querySolicitud, [
            solicitante,
            empresa_id || 1,
            concepto,
            nombreLimpio,
            rifLimpio,
            beneficiario_banco || (tipo_pago === 'ZELLE' ? 'ZELLE' : null),
            identificador,
            tipo_pago, // <--- VALOR AGREGADO
            monto,
            moneda,
            tasa || 1,
            tipo_pago === 'EFECTIVO USD' ? 1 : 0,
            referencia || null,
            banco_origen || null,
            estado_pago || 0
        ]);

        await connection.commit();
        res.status(200).json({ success: true, message: "Solicitud de pago creada exitosamente." });

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
        
        // 1. Obtener las solicitudes principales
        const [solicitudes] = await pool.query(
            "SELECT * FROM detalles_solicitudes WHERE empresa_id = ? ORDER BY creado_en DESC", 
            [empresaId]
        );

        if (solicitudes.length === 0) {
            return res.json([]);
        }

        // 2. Extraer los IDs para buscar sus pagos
        const solicitudIds = solicitudes.map(s => s.id);

        // 3. Buscar el HISTORIAL COMPLETO de pagos para estas solicitudes
        const [pagos] = await pool.query(
            `SELECT * FROM pagos_historial WHERE solicitud_id IN (?) ORDER BY creado_en ASC`,
            [solicitudIds]
        );

        // 4. Combinar: Metemos el array de 'pagos' dentro de cada 'solicitud'
        const resultado = solicitudes.map(solicitud => {
            // Filtramos los pagos que pertenecen a esta solicitud
            const susPagos = pagos.filter(p => p.solicitud_id === solicitud.id);
            
            return {
                ...solicitud,
                pagos: susPagos // <--- AQUÍ ESTÁ LA CLAVE. Ahora el frontend recibe la lista.
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