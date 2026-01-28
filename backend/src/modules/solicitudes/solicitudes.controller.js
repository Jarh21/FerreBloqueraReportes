import { pool } from "../../config/database.js";

export const CrearSolicitud = async (req, res) => {

    // ... dentro de CrearSolicitud, después de const { ... } = req.body



// ... resto del código (Paso 1, Paso 2...)
    // Obtenemos una conexión del pool para poder manejar transacciones (commit/rollback)
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            // Flags de control desde el Front
            modo_beneficiario,      // 'nuevo', 'registrado', 'solo_registro'
            guardar_en_directorio,  // viene como boolean en el body (o check en front)
            
            // Datos del Beneficiario (Snapshot)
            beneficiario_nombre,
            beneficiario_rif,
            beneficiario_email,
            beneficiario_telefono,
            beneficiario_cuenta,
            beneficiario_banco,
            
            // Datos de la Solicitud
            tipo_pago,
            solicitante,
            empresa_id,
            concepto,
            monto,
            moneda,       // 'USD' o 'VES'
            tasa,
            referencia,   // Opcional
            banco_origen, // Opcional
            estado_pago   // 0 (Pendiente) o 1 (Pagado)
        } = req.body;

        // ----------------------------------------------------
        // PASO 1: UNIFICAR EL IDENTIFICADOR DE LA CUENTA
        // ----------------------------------------------------
        // Dependiendo del tipo de pago, el dato clave cambia (correo, telefono o cuenta)
        let identificador = '';
        if (tipo_pago === 'ZELLE' || tipo_pago === 'BINANCE') identificador = beneficiario_email;
        else if (tipo_pago === 'PAGO MOVIL') identificador = beneficiario_telefono;
        else if (tipo_pago === 'TRANSFERENCIA') identificador = beneficiario_cuenta;
        else identificador = 'N/A'; // Efectivo

        // ----------------------------------------------------
        // PASO 2: GESTIÓN DE MAESTRO DE BENEFICIARIOS (Tablas 1 y 2)
        // ----------------------------------------------------
        // Solo entramos aquí si estamos creando uno nuevo o es solo registro
        
        let beneficiarioId = null;

        if (modo_beneficiario === 'nuevo' || modo_beneficiario === 'solo_registro') {
            
            // A. Verificar o Crear Beneficiario (Por RIF)
            const [rows] = await connection.query("SELECT id FROM beneficiarios WHERE rif = ?", [beneficiario_rif]);

            if (rows.length > 0) {
                beneficiarioId = rows[0].id; // Ya existe, lo reutilizamos
            } else {
                const [result] = await connection.query(
                    "INSERT INTO beneficiarios (nombre, rif) VALUES (?, ?)",
                    [beneficiario_nombre, beneficiario_rif]
                );
                beneficiarioId = result.insertId;
            }

            // B. Guardar la Cuenta (Si el usuario quiso guardar o es 'solo_registro')
            // Nota: modo_beneficiario 'solo_registro' implica guardar obligatoriamente
            if (modo_beneficiario === 'solo_registro' || guardar_en_directorio) {
                
                // Evitamos duplicar la misma cuenta para el mismo beneficiario
                const [cuentas] = await connection.query(
                    "SELECT id FROM beneficiarios_cuentas WHERE beneficiario_id = ? AND tipo_pago = ? AND identificador = ?",
                    [beneficiarioId, tipo_pago, identificador]
                );

                if (cuentas.length === 0) {
                    await connection.query(
                        "INSERT INTO beneficiarios_cuentas (beneficiario_id, tipo_pago, banco, identificador) VALUES (?, ?, ?, ?)",
                        [beneficiarioId, tipo_pago, beneficiario_banco || null, identificador]
                    );
                }
            }
        }

        // ----------------------------------------------------
        // PASO 3: INTERRUPCIÓN SI ES "SOLO REGISTRO"
        // ----------------------------------------------------
        if (modo_beneficiario === 'solo_registro') {
            await connection.commit();
            return res.status(200).json({ 
                success: true, 
                message: "Beneficiario agregado al directorio correctamente." 
            });
        }

        // ----------------------------------------------------
        // PASO 4: CREAR LA SOLICITUD / SNAPSHOT (Tabla 3)
        // ----------------------------------------------------
        // Aquí guardamos la "Foto" de los datos, independiente de si el beneficiario es nuevo o viejo.
        
        const querySolicitud = `
            INSERT INTO detalles_solicitudes 
            (solicitante, empresa_id, concepto, 
             beneficiario_nombre, beneficiario_rif, beneficiario_banco, beneficiario_identificador,
             monto, moneda_pago, tasa_cambio, 
             pago_efectivo, referencia_pago, banco_origen, estado_pago)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(querySolicitud, [
            solicitante,
            empresa_id || 1, // Puedes manejar esto dinámicamente si tienes login de empresas
            concepto,
            // Snapshot del beneficiario
            beneficiario_nombre, 
            beneficiario_rif, 
            beneficiario_banco || (tipo_pago === 'ZELLE' ? 'ZELLE' : null),
            identificador,
            // Financiero
            monto,
            moneda,
            tasa || 1,
            // Estado y control
            tipo_pago === 'EFECTIVO USD' ? 1 : 0, // Flag de efectivo
            referencia || null,
            banco_origen || null,
            estado_pago || 0
        ]);

        // Si todo salió bien, hacemos commit
        await connection.commit();
        res.status(200).json({ success: true, message: "Solicitud de pago creada exitosamente." });

    } catch (error) {
        // Si algo falla, revertimos todo para no dejar datos basura
        await connection.rollback();
        console.error("Error en CrearSolicitud:", error);
        res.status(500).json({ success: false, message: "Error al procesar la solicitud", error: error.message });
    } finally {
        connection.release(); // ¡Muy importante liberar la conexión!
    }
    
};

// ... (Todo el código de CrearSolicitud que ya tienes arriba) ...

// ----------------------------------------------------
// NUEVA FUNCIÓN: OBTENER LISTADO (GET)
// ----------------------------------------------------
export const ObtenerSolicitudes = async (req, res) => {
    try {
        const { empresaId } = req.params;

        // Validamos que venga el ID
        if (!empresaId) {
            return res.status(400).json({ message: "Se requiere el ID de la empresa" });
        }

        const query = `
            SELECT * FROM detalles_solicitudes 
            WHERE empresa_id = ? 
            ORDER BY creado_en DESC 
            LIMIT 500
        `;
        
        // Usamos pool.query directamente (no hace falta transacción para un SELECT simple)
        const [rows] = await pool.query(query, [empresaId]);
        
        res.json(rows);

    } catch (error) {
        console.error("Error obteniendo solicitudes:", error);
        res.status(500).json({ message: "Error al obtener la lista", error: error.message });
    }
};


// ... (Tus funciones anteriores: CrearSolicitud, ObtenerSolicitudes) ...

// ----------------------------------------------------
// NUEVA FUNCIÓN: BUSCAR BENEFICIARIOS (AUTOCOMPLETE)
// ----------------------------------------------------
export const BuscarBeneficiarios = async (req, res) => {
    try {
        const { term } = req.query; // El término que escribe el usuario (ej: "Juan")

        // Si no han escrito nada o es muy corto, devolvemos array vacío
        if (!term || term.length < 2) {
            return res.json([]);
        }

        const searchTerm = `%${term}%`;

        // Buscamos coincidencia en Nombre, RIF o incluso el correo/cuenta (identificador)
        // Traemos también los datos de la cuenta para rellenar el formulario automáticamente
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