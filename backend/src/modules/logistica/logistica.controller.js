import {pool, ejecutarConsultaEnEmpresaPorId} from "../../config/database.js"
import {nuevoComprobanteFlujoEfectivoSiace} from "../finanzas/finanzas.controller.js";
export const obtenerAutos = async (req,res)=>{
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
export const obtenerAutosFletes = async (req, res) => {
    try {
        
        const empresaId = req.body.empresaId;
        const fechaDesde = req.body.fechaDesde;
        const fechaHasta =  req.body.fechaHasta;
        const vehiculo = req.body.vehiculo;
        console.log(fechaDesde, fechaHasta, empresaId, vehiculo);
        if (!empresaId || !fechaDesde || !fechaHasta) {
            return res.status(400).json({ error: "Faltan parámetros: empresaId, fechaDesde o fechaHasta" });
        }
        
        const whereClause = vehiculo ? "AND f.ultimo_cod_logistica_vehiculo_asignado = ?" : "";
       
        const resultadosFletesPorPagar = await ejecutarConsultaEnEmpresaPorId(empresaId, 
            `SELECT
                f.keycodigo, 
                DATE_FORMAT(f.registrado, '%d-%m-%Y') AS fecha,
                l.documento,
                l.fiscalcomp,
                f.receptor_nombre AS cliente,
                f.total,
                CONCAT_WS(' ', 
                    f.ultimo_logistica_vehiculo_marca_asignado, 
                    f.ultimo_logistica_vehiculo_modelo_asignado, 
                    f.ultimo_logistica_vehiculo_placa_asignado
                ) AS vehiculo,
                f.ultimo_cod_logistica_vehiculo_asignado as vehiculoId,
                f.status_nombre AS estatus
            FROM factura_tipo_logistica f
            INNER JOIN logistica_factura l ON f.keycodigo = l.cod_factura_tipo_logistica
            WHERE 
                f.fecha_enviado_servidor_logistica BETWEEN ? AND ?
                AND f.status_codigo = 4
                ${whereClause}`, 
            [fechaDesde+' 00:00:00', fechaHasta+' 23:59:59', vehiculo]);
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
    console.log("guardarFletesSeleccionados llamado");
    try {
        const { empresaId, keycodigos, contCuenta,montoFletes } = req.body; 
       
        if (!empresaId || keycodigos.length === 0 || !contCuenta || !montoFletes) {
           
            return res.status(400).json({ error: "Faltan parámetros: empresaId, fletes, cuenta contable o monto" });
        }
        
        //guardar en la tabla logistica_fletes_cancelados
        const valores = keycodigos.map((fleteId, index) => [fleteId, new Date(), contCuenta, montoFletes[index], new Date(), new Date()]);
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
        const asientoValores = [new Date(), nuevoComprobante, contCuenta, 25,'PAGO DE FLETES BASE DE DATOS LOCAL', 0, sumaMontoFletes,0,sumaMontoFletes,9,'SISTEMA-REPORTES','SERVER'];
        await pool.query(asientoSql, asientoValores);

        //insertamos los fletes cancelados
        const sql = `INSERT INTO logistica_fletes_cancelados (id_factura_tipo_logistica, fecha_cancelado,cont_cuenta_id,monto,created_at,updated_at) VALUES ?`;
        await pool.query(sql, [valores]);
        res.json({ mensaje: "Fletes guardados correctamente" });
    } catch (error) {
        console.error("Error al guardar fletes seleccionados:", error);
        res.status(500).json({ error: "Error al guardar fletes seleccionados" });
    }
}




