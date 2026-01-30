import {pool, ejecutarConsultaEnEmpresaPorId} from "../../config/database.js"
import {nuevoComprobanteFlujoEfectivoSiace} from "../finanzas/finanzas.controller.js";
export const obtenerAutos = async (req,res)=>{
    try {
        const {empresaId,es_vehiculo_externo} = req.params;               
        if (!empresaId) {
            return res.status(400).json({ error: "Faltan parámetros: empresaId" });
        }
        const tipos = String(es_vehiculo_externo ?? "")
            .split(",")
            .map(v => v.trim())
            .filter(Boolean)
            .map(v => Number(v))
            .filter(v => Number.isInteger(v));

        if (tipos.length === 0) {
            return res.status(400).json({ error: "Parámetro 'tipo' inválido. Ejemplo válido: 0,1" });
        }

        const placeholders = tipos.map(() => "?").join(",");        
        const sql=`SELECT asociado_siace_id as keycodigo,CONCAT_WS(' ', 
        logistica_vehiculos.marca, 
        logistica_vehiculos.modelo, 
        logistica_vehiculos.placa
        
    ) AS vehiculo,is_vehiculo_externo FROM logistica_vehiculos where empresa_id=? and is_vehiculo_externo IN (${placeholders})`;
        const [resultados] = await pool.query(sql, [empresaId, ...tipos]);
        res.json(resultados);
    } catch (error) {
        console.error("Error al obtener autos:", error);
        res.status(500).json({ error: "Error al obtener autos" });
    }
}

export const obtenerAutosSiace = async (req,res)=>{
    try {

        const {empresaId} = req.params;       
        if (!empresaId) {
            return res.status(400).json({ error: "Faltan parámetros: empresaId" });
        }
        const sql=`SELECT keycodigo,CONCAT_WS(' ', 
        logistica_vehiculo.marca, 
        logistica_vehiculo.modelo, 
        logistica_vehiculo.placa
    ) AS vehiculo FROM logistica_vehiculo`;
        const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId,sql);
        res.json(resultados);
    } catch (error) {
        console.error("Error al obtener autos:", error);
        res.status(500).json({ error: "Error al obtener autos" });
    }
}
export const obtenerAutosQueRealizaronFletes = async (req, res) => {
    try {
        const { empresaId, fechaDesde, fechaHasta } = req.body;
        if (!empresaId || !fechaDesde || !fechaHasta) {
            return res.status(400).json({ error: "Faltan parámetros: empresaId, fechaDesde o fechaHasta" });
        }
        const sql = `SELECT    
            f.ultimo_cod_logistica_vehiculo_asignado AS keycodigo,
            CONCAT_WS(' ', 
                f.ultimo_logistica_vehiculo_marca_asignado, 
                f.ultimo_logistica_vehiculo_modelo_asignado, 
                f.ultimo_logistica_vehiculo_placa_asignado
            ) AS vehiculo            
            FROM factura_tipo_logistica f
            INNER JOIN logistica_factura l ON f.keycodigo = l.cod_factura_tipo_logistica
            WHERE 
                f.fecha_enviado_servidor_logistica BETWEEN ? AND ?            
            AND f.status_codigo = 4 group BY f.ultimo_cod_logistica_vehiculo_asignado`;
        const resultadosVehiculosFleteados = await ejecutarConsultaEnEmpresaPorId(empresaId, sql, [fechaDesde+' 00:00:00', fechaHasta+' 23:59:59']);
       
        //buscamos los vehiculos en la base de datos local que son foraneos
        const [vehiculosForaneos] = await pool.query(`SELECT asociado_siace_id as keycodigo FROM logistica_vehiculos where empresa_id=? and is_vehiculo_externo=0`, [empresaId]);
        
        //se crea un objeto con los keycodigo sin repeticion de los vehiculos foraneos
        const vehiculosForaneosSet = new Set(vehiculosForaneos.map(v => v.keycodigo));
        
        //filtramos los vehiculos que no son foraneos y los eliminamos de la lista de resultados
        for (let i = resultadosVehiculosFleteados.length - 1; i >= 0; i--) {
            if (vehiculosForaneosSet.has(resultadosVehiculosFleteados[i].keycodigo)) {
                resultadosVehiculosFleteados.splice(i, 1);
            }
        }
        res.json(resultadosVehiculosFleteados);
    } catch (error) {
        console.error("Error al obtener autos que realizaron fletes:", error);
        res.status(500).json({ error: "Error al obtener autos que realizaron fletes" });
    }
}
export const obtenerAutosFletes = async (req, res) => {
    //buscamos los fletes por pagar segun los filtros
    try {
        
        const empresaId = req.body.empresaId;
        const fechaDesde = req.body.fechaDesde;
        const fechaHasta =  req.body.fechaHasta;
        const vehiculo = req.body.vehiculo;
        const vehiculos = req.body.vehiculos;
        
        if (!empresaId || !fechaDesde || !fechaHasta) {
            return res.status(400).json({ error: "Faltan parámetros: empresaId, fechaDesde o fechaHasta" });
        }
        //filtramos segun la cantidad de vehiculos seleccionados
        const vehiculoIds = (Array.isArray(vehiculos) ? vehiculos : (vehiculo != null ? [vehiculo] : []))
            .map(v => Number(v))
            .filter(v => Number.isInteger(v) && v > 0);

        const whereClause = vehiculoIds.length
            ? `AND f.ultimo_cod_logistica_vehiculo_asignado IN (${vehiculoIds.map(() => "?").join(",")})`
            : "";
       
        const resultadosFletesPorPagar = await ejecutarConsultaEnEmpresaPorId(empresaId, 
            `SELECT
                f.keycodigo, 
                DATE_FORMAT(f.registrado, '%d-%m-%Y') AS fecha,
                l.documento,
                d.fiscalcomp,
                d.nomclie AS cliente,
                f.total,
                CONCAT_WS(' ', 
                    f.ultimo_logistica_vehiculo_marca_asignado, 
                    f.ultimo_logistica_vehiculo_modelo_asignado, 
                    f.ultimo_logistica_vehiculo_placa_asignado
                ) AS vehiculo,
                f.ultimo_cod_logistica_vehiculo_asignado AS vehiculoId,
                f.status_nombre AS estatus
            FROM factura_tipo_logistica f
            INNER JOIN logistica_factura l ON f.keycodigo = l.cod_factura_tipo_logistica
            INNER JOIN facturas d ON d.documento = l.documento
            WHERE 
                f.fecha_enviado_servidor_logistica BETWEEN ? AND ?
                AND f.status_codigo = 4
                ${whereClause}`, 
            [fechaDesde+' 00:00:00', fechaHasta+' 23:59:59', ...vehiculoIds]);
        const [resultadoFletesPagados] = await pool.query(
            `SELECT id_factura_tipo_logistica FROM logistica_fletes_cancelados`
        );
        const resultadoFletesPagadosSet = new Set(resultadoFletesPagados.map(row => row.id_factura_tipo_logistica));
       
        for (let i = resultadosFletesPorPagar.length - 1; i >= 0; i--) {
            if (resultadoFletesPagadosSet.has(resultadosFletesPorPagar[i].keycodigo)) {
                resultadosFletesPorPagar.splice(i, 1);
            }
        }   
            
        res.json(resultadosFletesPorPagar);
    } catch (error) {
        console.error("Error al obtener autos fletes:", error);
        res.status(500).json({ error: "Error al obtener autos fletes" });
    }
}
export const guardarFletesSeleccionados = async (req, res) => {
    
    try {
        const { empresaId, keycodigos, contCuenta, contConcepto, montoFletes,descripcion } = req.body; 
       
        if (!empresaId || keycodigos.length === 0 || !contCuenta || !contConcepto || !montoFletes) {
           
            return res.status(400).json({ error: "Faltan parámetros: empresaId, fletes, cuenta contable o monto" });
        }        
        
       //suma de montoFletes
        const sumaMontoFletes = montoFletes.reduce((a, b) => a + b, 0);

        //conseguimos el ultimo comprobante
        const nuevoComprobante = await nuevoComprobanteFlujoEfectivoSiace(empresaId);        

        //insertamos el asiento contable
        const asientoSql = ` INSERT INTO cont_registro 
        (fecha_de_operacion, comprobante, codcuenta, codconcepto, descripcion, 
         debito, credito, monto_moneda_cuenta_debito, monto_moneda_cuenta_credito, 
         fecha, codusua, usuario, equipo, registrado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, NOW())`;
        const asientoValores = [new Date(), nuevoComprobante, contCuenta, contConcepto, descripcion, 0, sumaMontoFletes,0,sumaMontoFletes,9,'SISTEMA-REPORTES','SERVER'];
        await pool.query(asientoSql, asientoValores);

        //guardar en la tabla logistica_fletes_cancelados
        const valores = keycodigos.map((fleteId, index) => [fleteId, new Date(), contCuenta, contConcepto, montoFletes[index], new Date(), new Date()]);

        //insertamos los fletes cancelados
        const sql = `INSERT INTO logistica_fletes_cancelados (id_factura_tipo_logistica, fecha_cancelado,cont_cuenta_id, cont_concepto_id, monto,created_at,updated_at) VALUES ?`;
        await pool.query(sql, [valores]);
        res.json({ mensaje: "Fletes guardados correctamente" });
    } catch (error) {
        console.error("Error al guardar fletes seleccionados:", error);
        res.status(500).json({ error: "Error al guardar fletes seleccionados" });
    }
}

export const guardarVehiculo = async (req, res) => {
    
    try {
        const { empresaId, marca, modelo, placa, observacion, asociadoSiace, localForaneo } = req.body;  
        if (!empresaId || !marca || !modelo || !placa ) {
            return res.status(400).json({ error: "Faltan parámetros: empresaId, marca, modelo, placa, observacion, asociadoSiace o localForaneo" });
        }
        const sql=`INSERT INTO logistica_vehiculos 
        (empresa_id, marca, modelo, placa, observacion, asociado_siace_id, is_vehiculo_externo, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
        await pool.query(sql, [empresaId, marca, modelo, placa, observacion, asociadoSiace, localForaneo]);
        res.json({ mensaje: "Vehículo guardado correctamente" });
    } catch (error) {
        console.error("Error al guardar vehículo:", error);
        res.status(500).json({ error: "Error al guardar vehículo" });
    }
}

export const obtenerTotalFletesPorVehiculo = async (req, res) => {
    //estadistivas de fletes por vehiculo
    try {
        const { empresaId, fechaDesde, fechaHasta, vehiculos } = req.body;
        //filtramos segun la cantidad de vehiculos seleccionados
        const vehiculoIds = (Array.isArray(vehiculos) ? vehiculos : (vehiculo != null ? [vehiculo] : []))
            .map(v => Number(v))
            .filter(v => Number.isInteger(v) && v > 0);

        const whereClause = vehiculoIds.length
            ? `AND f.ultimo_cod_logistica_vehiculo_asignado IN (${vehiculoIds.map(() => "?").join(",")})`
            : "";

        if (!empresaId || !fechaDesde || !fechaHasta) {
            return res.status(400).json({ error: "Faltan parámetros: empresaId, fechaDesde o fechaHasta" });
        }
        const sql = `SELECT 
                f.ultimo_cod_logistica_vehiculo_asignado,
                CONCAT_WS(' ',                     
                    f.ultimo_logistica_vehiculo_marca_asignado, 
                    f.ultimo_logistica_vehiculo_modelo_asignado, 
                    f.ultimo_logistica_vehiculo_placa_asignado
                ) AS vehiculo,
                COUNT(*) AS cantidad_facturas,
                SUM(f.total) AS monto_total,
                ROUND(AVG(f.total), 2) AS promedio_por_factura,
                COUNT(DISTINCT f.receptor_nombre) AS clientes_distintos_atendidos,
                -- Nueva columna de porcentaje
                ROUND((SUM(f.total) * 100 / SUM(SUM(f.total)) OVER()),2) AS porcentaje_del_total
            FROM factura_tipo_logistica f
            WHERE 
                1=1                
                AND
                f.fecha_enviado_servidor_logistica BETWEEN ? AND ?
                AND f.status_codigo = 4
                ${whereClause}
            GROUP BY 
                f.ultimo_logistica_vehiculo_marca_asignado, 
                f.ultimo_logistica_vehiculo_modelo_asignado, 
                f.ultimo_logistica_vehiculo_placa_asignado
            ORDER BY monto_total DESC`;
        const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, sql, [fechaDesde+' 00:00:00', fechaHasta+' 23:59:59', ...vehiculoIds]);
        res.json(resultados);
    }catch (error) {
        console.error("Error al obtener total de fletes por vehículo:", error);
        res.status(500).json({ error: "Error al obtener total de fletes por vehículo" });
    }
}
export const obtenerDetalleFacturasPorVehiculo = async (req, res) => {
    try {
        // Ahora recibimos un array de vehiculoIds (IDs o Placas)
        const { empresaId, vehiculoIds, fechaDesde, fechaHasta } = req.body;

        if (!empresaId || !vehiculoIds || vehiculoIds.length === 0) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }

        const sql = `
        select * from (
        SELECT
                    d.codprod,
                    d.nombre AS producto,
                    f.ultimo_logistica_vehiculo_placa_asignado AS placa,
                    CONCAT_WS(' ',                     
                        f.ultimo_logistica_vehiculo_marca_asignado, 
                        f.ultimo_logistica_vehiculo_modelo_asignado, 
                        f.ultimo_logistica_vehiculo_placa_asignado
                    ) AS vehiculo,
                    SUM(d.cantidad) AS cantidad
                FROM factura_tipo_logistica f
                INNER JOIN logistica_factura l ON f.keycodigo = l.cod_factura_tipo_logistica
                INNER JOIN facturas_dat d ON l.documento = d.documento
                WHERE 
                    f.fecha_enviado_servidor_logistica BETWEEN ? AND ?                    
                    AND f.status_codigo = 4
                    AND f.ultimo_cod_logistica_vehiculo_asignado IN (?)
                
                GROUP BY
                    d.codprod, f.ultimo_logistica_vehiculo_placa_asignado
        ) datos
        ORDER BY datos.producto ASC`;

        const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, sql, [
            fechaDesde + ' 00:00:00', 
            fechaHasta + ' 23:59:59', 
            vehiculoIds // Asegúrate que tu función soporte arrays para el IN
        ]);

        // --- PROCESAMIENTO PARA PIVOTAR ---
        const matrizMap = {};
        const columnasMap = new Map();

        resultados.forEach(row => {
            const { codprod, producto, placa, vehiculo, cantidad } = row;
            if (!columnasMap.has(placa)) {
                columnasMap.set(placa, { placa, vehiculo });
            }

            if (!matrizMap[codprod]) {
                matrizMap[codprod] = { codprod, producto, cantidades: {} };
            }
            matrizMap[codprod].cantidades[placa] = Number(cantidad);
        });

        res.json({
            columnas: Array.from(columnasMap.values()), // Esto servirá para los headers en React
            datos: Object.values(matrizMap)
                .sort((a, b) => String(a.producto).localeCompare(String(b.producto)))
        });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Error interno" });
    }
}

