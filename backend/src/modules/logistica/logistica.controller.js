import {pool, ejecutarConsultaEnEmpresaPorId} from "../../config/database.js"

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
                ${whereClause}`, 
            [fechaDesde+' 00:00:00', fechaHasta+' 23:59:59', vehiculo]);
        const resultadoFletesPagados = await pool.query(
            `SELECT id_factura_tipo_logistica FROM logistica_fletes_cancelados`
        );
        const fletesPagadosSet = new Set(resultadoFletesPagados[0].map(row => row.id_factura_tipo_logistica));    
            
        res.json(resultados);
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
            console.log("Parámetros inválidos:", req.body);
            return res.status(400).json({ error: "Faltan parámetros: empresaId, fletes, cuenta contable o monto" });
        }
        console.log("apunto de guardar fletes:", keycodigos);
        //guardar en la tabla logistica_fletes_cancelados
        const valores = keycodigos.map(fleteId => [fleteId, new Date(), contCuenta, montoFletes, new Date(), new Date()]);
        console.log("valores a insertar:", valores);
        const sql = `INSERT INTO logistica_fletes_cancelados (id_factura_tipo_logistica, fecha_cancelado,cont_cuenta_id,monto,created_at,updated_at) VALUES ?`;
        await pool.query(sql, [valores]);
        res.json({ mensaje: "Fletes guardados correctamente" });
    } catch (error) {
        console.error("Error al guardar fletes seleccionados:", error);
        res.status(500).json({ error: "Error al guardar fletes seleccionados" });
    }
}


