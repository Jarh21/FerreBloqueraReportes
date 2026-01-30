import {pool, ejecutarConsultaEnEmpresaPorId} from "../../config/database.js"

// SSE clients: map key -> array of response objects
const sseClients = new Map()

function sseKey(empresaId, codusua) {
  return `${empresaId}_${codusua}`
}

function addSseClient(empresaId, codusua, res) {
  const key = sseKey(empresaId, codusua)
  const arr = sseClients.get(key) || []
  arr.push(res)
  sseClients.set(key, arr)
}

function removeSseClient(empresaId, codusua, res) {
  const key = sseKey(empresaId, codusua)
  const arr = sseClients.get(key) || []
  const filtered = arr.filter(r => r !== res)
  if (filtered.length) sseClients.set(key, filtered)
  else sseClients.delete(key)
}

function notifySse(empresaId, codusua, payload) {
  // notify exact matches
  const key = sseKey(empresaId, codusua)
  const arr = sseClients.get(key) || []
  const data = `data: ${JSON.stringify(payload)}\n\n`
  arr.forEach(res => {
    try { res.write(data) } catch (e) { /* ignore */ }
  })
}

export const obtenerFinanzas = async (req, res) => {
  try {
    const { empresaId } = req.params

    
    const [finanzas] = await pool.query("SELECT * FROM finanzas WHERE empresa_id = ? ORDER BY fecha DESC", [
      empresaId,
    ])
    

    res.json(finanzas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener finanzas" })
  }
}


export const crearFinanza = async (req, res) => {
  try {
    const { empresa_id, tipo, descripcion, monto, fecha } = req.body

    const descripcionUpper = typeof descripcion === 'string' ? descripcion.toUpperCase() : descripcion
    
    await pool.query(
      "INSERT INTO finanzas (empresa_id, tipo, descripcion, monto, fecha) VALUES (?, ?, ?, ?, ?)",
      [empresa_id, tipo, descripcionUpper, monto, fecha],
    )
    

    res.json({ mensaje: "Finanza registrada" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al crear finanza" })
  }
}

export const listaAsesores = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params;
    
    if (!empresaId || !fecha) {
      return res.status(400).json({ error: "Faltan parámetros: empresaId y/o fecha" });
    }

    const consultaSQL = `
      SELECT
      codusua,usuario
      FROM
      (SELECT codusua, usuario FROM mov_pagos WHERE fecha = ? GROUP BY codusua
      UNION ALL
      SELECT codusua, usuario FROM mov_pago_cxc WHERE fecha = ? GROUP BY codusua)asesores
      GROUP BY codusua
    `;
    const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, [fecha, fecha]);
    res.json(resultados);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: "Error al obtener el total de saldos de la empresa" });
  }
}

export const listarArqueosCerrados = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params;
    
    if (!empresaId || !fecha) {
      return res.status(400).json({ error: "Faltan parámetros: empresaId y/o fecha" });
    }   
   
    
    const [rows] = await pool.query(
      "SELECT * FROM cuadre_arqueo_cerrado WHERE empresa_id = ? AND fecha = ? ORDER BY codusua",
      [empresaId, fecha]
    )
    
    res.json(rows)
  }
  catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: "Error al obtener los arqueos cerrados" });
  }
}

export const obtenerSumatoriaModosPagoAsesor = async (req, res) => {
  try {
    const { empresaId, fecha, codusua } = req.params;
    
    if (!empresaId || !fecha || !codusua) {
      return res.status(400).json({ error: "Faltan parámetros: empresaId, fecha y/o codusua" });
    }
    const consultaSQL = `
      WITH movimientos_combinados AS (
          -- Primera tabla
          SELECT 
              codusua,
              usuario,
              monto_moneda AS monto,
              codpago,
              tipo,
              fecha
          FROM mov_pagos
          WHERE fecha = ? 
              AND codusua = ?
          
          UNION ALL
          
          -- Segunda tabla
          SELECT 
              mpc.codusua,
              mpc.usuario,
              mpc.monto_moneda AS monto,
              mpc.codtipopago AS codpago,
              tp.nombre AS tipo,
              mpc.fecha
          FROM mov_pago_cxc mpc
          INNER JOIN tipopago tp 
              ON tp.keycodigo = mpc.codtipopago
          WHERE mpc.fecha = ?
              AND mpc.codusua = ?
      )
      SELECT 
          codusua,
          usuario,
          SUM(monto) AS monto,
          codpago,
          tipo
      FROM movimientos_combinados
      GROUP BY codusua, usuario, codpago, tipo
      ORDER BY codpago;
    `;
    const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, [fecha, codusua, fecha, codusua]);
    res.json(resultados);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: "Error al obtener los movimientos de pagos por asesor" });
  }
}

export const obtenerModosPagoDetalle = async (req, res) => {
  try {
    const consultaSQL = `SELECT id,nombre,is_efectivo,is_moneda_nacional,is_moneda_extranjera,is_aplicar_gastos,codtipomoneda_siace,nombre_corto FROM tipo_pago WHERE is_activo=1 ORDER BY nombre;`
    
    const [rows] = await pool.query(consultaSQL)
    
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener los tipos de pago" })
  }
}

export const obtenerDenominaciones = async (req, res) => {
  try {
    const { tipo_moneda } = req.params
    if (!tipo_moneda) return res.status(400).json({ error: "Falta tipo_moneda" })

    const consultaSQL = `SELECT id,nombre,tipo_moneda FROM cuadre_denominacion_efectivo WHERE tipo_moneda=? AND is_activo=1;`
    
    const [rows] = await pool.query(consultaSQL, [tipo_moneda])
    
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener denominaciones" })
  }
}

export const guardarDenominacionesCuadre = async (req, res) => {
  //let connection
  try {
    const { empresa_id, fecha, codusua,usuario, tipo_moneda_id, tipo_pago_id,valor_tasa,usuario_id, items } = req.body
    
    if (!empresa_id || !codusua || !tipo_moneda_id || !Array.isArray(items)) {
      return res.status(400).json({ error: "Faltan parámetros o formato incorrecto" })
    }

    //connection = await pool.getConnection()
    //await connection.beginTransaction()

    const insertSQL = `INSERT INTO cuadre_efectivo_detallado (empresa_id,fecha,denominacion_id,denominacion,cantidad,total,codusua,usuario,tipo_moneda_id,tipo_pago_id,valor_tasa,total_calculado,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`

    for (const it of items) {
      const { denominacion_id, cantidad } = it
      //buscamos el nombre de la denominacion
      const [denomRows] = await pool.query(`SELECT nombre FROM cuadre_denominacion_efectivo WHERE id = ?`, [denominacion_id])
      if (denomRows.length === 0) {
        //await connection.rollback()
        return res.status(400).json({ error: `Denominación con id ${denominacion_id} no encontrada` })
      }
      const nombreDenominacion = denomRows[0].nombre
      const totalDenominacion = cantidad * parseFloat(nombreDenominacion)
      const totalCalculado = totalDenominacion/valor_tasa
      const total = isNaN(totalCalculado) ? 0 : totalCalculado
      // Ignorar cantidades nulas o <= 0
      if (cantidad == null || cantidad==0) continue
      await pool.query(insertSQL, [empresa_id, fecha, denominacion_id,nombreDenominacion, cantidad,totalDenominacion,codusua,usuario, tipo_moneda_id, tipo_pago_id,valor_tasa, total,usuario_id])
    }

    //await connection.commit()
    
    // notify clients for this empresa/codusua
    try { notifySse(empresa_id, codusua, { type: 'detallado', empresa_id, codusua, fecha }) } catch (e) {}
    res.json({ mensaje: "Denominaciones guardadas" })
  } catch (error) {
    console.error(error)
    /* try {
      if (connection) await connection.rollback()
    } catch (e) {}
    if (connection) 
    res.status(500).json({ error: "Error al guardar denominaciones" }) */
  }
}

export const guardarCuadreArqueoIngreso = async (req, res) => {
  //let connection
  try {
    const { empresa_id, codusua, fecha, items } = req.body

    if (!empresa_id || !codusua || !fecha || !Array.isArray(items)) {
      return res.status(400).json({ error: "Faltan parámetros o formato incorrecto" })
    }

    //connection = await pool.getConnection()
    //await connection.beginTransaction()

      const insertSQL = `INSERT INTO cuadre_arqueo_ingreso (tipo_pago_id,fecha,empresa_id,monto,valor_tasa,credito_calculado,codusua,created_at,updated_at) VALUES (?,?,?,?,?,?,?,NOW(),NOW())`

    for (const it of items) {
        const { tipo_pago_id, monto, valor_tasa, credito_calculado } = it
      if (monto == null) continue
        // if valor_tasa or credito_calculado are undefined, default to sensible values
        const vt = valor_tasa == null ? 1 : valor_tasa
        const mc = credito_calculado == null ? 0 : credito_calculado
        await pool.query(insertSQL, [tipo_pago_id, fecha, empresa_id, monto, vt, mc, codusua])
    }

    //await connection.commit()
    
    // notify clients for this empresa/codusua
    try { notifySse(empresa_id, codusua, { type: 'arqueo_ingreso', empresa_id, codusua, fecha }) } catch (e) {}
    res.json({ mensaje: "Cuadre arqueo ingresado" })
  } catch (error) {
    console.error(error)
    //try {
      //if (connection) await connection.rollback()
    //} catch (e) {}
    //if (connection) 
    //res.status(500).json({ error: "Error al guardar cuadre arqueo ingreso" })
  }
}

export const guardarCuadreArqueoCerrado = async (req, res) => {
  //let connection
  try {
    const { empresa_id, codusua, usuario, fecha, total_efectivo_cuadre, usuario_id } = req.body

    if (!empresa_id || !codusua || !fecha) {
      return res.status(400).json({ error: "Faltan parámetros o formato incorrecto" })
    }

    //connection = await pool.getConnection()
    //await connection.beginTransaction()

    const insertSQL = `INSERT INTO cuadre_arqueo_cerrado (empresa_id, codusua,usuario, fecha, total_efectivo_cuadre, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())`

    await pool.query(insertSQL, [empresa_id, codusua, usuario ?? '', fecha, total_efectivo_cuadre, usuario_id])
    //await ejecutarConsultaEnEmpresaPorId(empresa_id,`UPDATE mov_pagos SET arqueo=1 WHERE fecha=? AND codusua=?`,[fecha,codusua])
    //await connection.commit()
    
    // notify clients for this empresa/codusua
    try { notifySse(empresa_id, codusua, { type: 'arqueo_cerrado', empresa_id, codusua, fecha }) } catch (e) {}
    res.json({ mensaje: "Cuadre arqueo cerrado" })
  } catch (error) {
    console.error(error)
    /* try {
      if (connection) await connection.rollback()
    } catch (e) {}
    if (connection) */ 
    res.status(500).json({ error: "Error al guardar cuadre arqueo cerrado" })
  }
}

export const obtenerCuadreEfectivoDetallado = async (req, res) => {
  try {
    const { codusua } = req.params
    const { empresa_id, fecha } = req.query
   
    if (!codusua || !empresa_id) return res.status(400).json({ error: "Faltan parámetros codusua o empresa_id" })

    let consultaSQL = `SELECT cef.id, cef.empresa_id, cef.denominacion, cef.cantidad, cef.codusua, cef.tipo_moneda_id,cef.tipo_pago_id, tm.abreviatura, cef.total FROM cuadre_efectivo_detallado cef LEFT JOIN tipo_moneda tm ON cef.tipo_moneda_id = tm.keycodigo WHERE cef.empresa_id = ? AND cef.codusua = ? AND cef.fecha = ? `;
    const valores = [empresa_id, codusua,fecha]
    
    consultaSQL += ` ORDER BY cef.tipo_pago_id,cef.denominacion ASC`;

    
    const [rows] = await pool.query(consultaSQL, valores)
    
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener cuadre efectivo detallado" })
  }
}

export const obtenerTodoEfectivoDetallado = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params;
    if (!empresaId || !fecha) return res.status(400).json({ error: 'Faltan parámetros' })
    const consulta = `
        SELECT 
        c.denominacion,
        SUM(c.cantidad) AS cantidad,
        SUM(c.total) AS total,
        SUM( (c.cantidad * c.denominacion) / c.valor_tasa ) AS total_calculado,
        c.tipo_pago_id,
        tp.nombre AS tipo_nombre
      FROM cuadre_efectivo_detallado c
      LEFT JOIN tipo_pago tp ON c.tipo_pago_id = tp.id
      WHERE c.empresa_id = ? AND c.fecha = ?
      GROUP BY c.tipo_pago_id, c.denominacion
      
      ORDER BY tipo_pago_id, denominacion;
    `;
    
    const [rows] = await pool.query(consulta, [empresaId, fecha])
    
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener todo efectivo detallado" })
  }
}
export const obtenerTodoEfectivoEgresos = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params;
    if (!empresaId || !fecha) return res.status(400).json({ error: 'Faltan parámetros' })
    const consulta = `         
      SELECT 
        0 AS denominacion, 
        0 AS cantidad,          
        SUM(monto) AS total,
        SUM(debito_calculado) AS total_calculado,   
        tipo_pago_id,           
        'EGRESOS' AS tipo_nombre      
      FROM cuadre_arqueo_egresos 
      WHERE empresa_id = ? AND fecha = ? 
      GROUP BY tipo_pago_id
      ORDER BY tipo_pago_id, denominacion;
    `;
    
    const [rows] = await pool.query(consulta, [empresaId, fecha])
    
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener todo efectivo egreso" })
  }
}

//funcion reutilizable para obtener gastos por fecha
const obtenerDatosGastosPorFecha = async (empresaId, fecha) => {
  if (!empresaId || !fecha) {
    throw new Error('Faltan parámetros: empresaId y fecha son requeridos');
  }

  const consulta = `
    SELECT
      ventas.id,
      'Venta Efectivo' AS concepto,
      3 AS cont_concepto_id,
      CONCAT('INGRESO POR VENTA ', COALESCE(DATE_FORMAT(ventas.fecha, '%d-%m-%Y'), '')) AS descripcion,
      ventas.total AS debito,
      0 AS credito,
      ventas.total_calculado AS debito_base,
      0 AS credito_base,
      tipo_pago.cont_cuenta_id,
      tipo_pago.nombre_cuenta,
      tipo_pago.id AS tipo_pago_id
    FROM
    (
      SELECT
        id,
        tipo_pago_id,
        MAX(fecha) AS fecha,
        SUM(total) AS total,
        SUM(total_calculado)AS total_calculado
      FROM
      (
        SELECT 
          c.id,
          c.tipo_pago_id,
          c.fecha,
          SUM(c.total_calculado)AS total_calculado,
          SUM(c.total) AS total
        FROM cuadre_efectivo_detallado c
        WHERE c.empresa_id = ? 
          AND c.fecha = ?
        GROUP BY c.tipo_pago_id, c.fecha

        UNION ALL

        SELECT 
          id,
          tipo_pago_id,
          NULL AS fecha,
          SUM(debito_calculado)AS total_calculado,
          SUM(monto) AS total
        FROM cuadre_arqueo_egresos
        WHERE empresa_id = ?
          AND fecha = ?
        GROUP BY tipo_pago_id
      ) AS union_ventas
      GROUP BY tipo_pago_id
    ) AS ventas
    INNER JOIN 
    (
      SELECT 
        t.id, 
        t.nombre, 
        t.nombre_corto, 
        ce.empresa_id, 
        ce.cont_cuenta_id, 
        ce.nombre_cuenta 
      FROM tipo_pago t 
      LEFT JOIN cuenta_por_empresas_siace ce 
        ON t.id = ce.tipo_pago_id 
        AND ce.empresa_id = ?
    ) AS tipo_pago ON ventas.tipo_pago_id = tipo_pago.id

    UNION ALL

    SELECT
      e.id,
      e.concepto,
      e.cont_concepto_id,
      e.descripcion,  
      0 AS debito,
      e.monto AS credito,
      0 AS debito_base,
      e.debito_calculado AS credito_base,
      tipo_pago.cont_cuenta_id,  
      tipo_pago.nombre_cuenta,
      tipo_pago.id AS tipo_pago_id
    FROM
      cuadre_arqueo_egresos e
      LEFT JOIN (SELECT t.id, t.nombre, t.nombre_corto, IF (ce.empresa_id IS NULL,0,ce.empresa_id)empresa_id, IF (ce.cont_cuenta_id IS NULL,0,ce.cont_cuenta_id)cont_cuenta_id, IF (ce.nombre_cuenta IS NULL,'sin cuenta vinculada en cuenta_por_empresas_siace',ce.nombre_cuenta)nombre_cuenta FROM tipo_pago t LEFT JOIN cuenta_por_empresas_siace ce ON t.id = ce.tipo_pago_id)AS tipo_pago
        ON e.tipo_pago_id = tipo_pago.id  	
    WHERE 
    e.empresa_id = ?
    AND e.fecha = ?
    AND tipo_pago.empresa_id = e.empresa_id
  `;
  
  // NOTA: Cambia 'pool' por la función adecuada para ejecutar consultas
  const [rows] = await pool.query(consulta, [empresaId, fecha, empresaId, fecha, empresaId, empresaId, fecha]);
  return rows;
};

//funcion para obtener el total efectico y gastos de cuadre_efectivo_detallado y cuadre_arqueo_egresos
export const obtenerTotalEfectivoYGastosAgrupadosPorAsesor = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params;
    if (!empresaId || !fecha) {
      return res.status(400).json({ error: "Faltan parámetros: empresaId y/o fecha" });
    }
    const consultaSQL = `
      SELECT
        efectivo.empresa_id,
        efectivo.fecha,
        SUM(efectivo.total_calculado) AS total_calculado,
        efectivo.codusua
      FROM
        (SELECT
          empresa_id,
          fecha,
          SUM(total_calculado) AS total_calculado,
          codusua,
          'EFECTIVO' AS tipo
        FROM
          cuadre_efectivo_detallado
        WHERE fecha = ?
          AND empresa_id = ?
        GROUP BY codusua
        UNION
        ALL
        SELECT
          empresa_id,
          fecha,
          SUM(debito_calculado) AS total_calculado,
          codusua,
          'EGRESO' AS tipo
        FROM
          cuadre_arqueo_egresos
        WHERE fecha = ?
        AND empresa_id = ?
        GROUP BY codusua) AS efectivo
      GROUP BY efectivo.codusua`;
    const resultados = await pool.query(consultaSQL, [fecha, empresaId, fecha, empresaId]);
    res.json(resultados[0]);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: "Error al obtener total efectivo y gastos" });
  }
}


// funcion http para mostrar gastos por fecha
export const obtenerGastosPorFecha = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params;
    const datos = await obtenerDatosGastosPorFecha(empresaId, fecha);
    res.json(datos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener gastos por fecha" });
  }
};

// funcion para obtener el total efectivo de mov_pagos
export const obtenerTotalEfectivoMovPagos = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params;
    if (!empresaId || !fecha) {
      return res.status(400).json({ error: "Faltan parámetros: empresaId y/o fecha" });
    }
    const consultaSQL = `
    SELECT
    codusua,
    usuario,
    SUM(total_calculado) AS total_calculado,
    SUM(montoreal) AS montoreal,
    SUM(monto) AS monto,
    codpago,
    tipo
    FROM
    (SELECT
      codusua,
      usuario,
      monto AS total_calculado,
      montoreal AS montoreal,
      monto_moneda AS monto,
      codpago,
      tipo
    FROM
      mov_pagos
    WHERE fecha = ?
      AND efectivo = 1
    UNION ALL
      SELECT
        m.codusua,
        m.usuario,
        m.monto_base AS total_calculado,
        m.monto_base_real AS montoreal,
        m.monto_moneda AS monto,
        m.codtipopago AS codpago,
        m.codtipomoneda AS tipo
      FROM
        mov_pago_cxc m,
        tipopago t
      WHERE m.fecha = ?
        AND m.codtipopago = t.keycodigo
        AND t.efectivo = 1
        AND t.is_efectivo = 1)AS mov_pagos
        
    GROUP BY codusua,codpago
    `;
    const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, [fecha,fecha]);
    res.json(resultados);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: "Error al obtener total efectivo de mov_pagos" });
  }
}

//funcion edita los egresos registrados en el arqueo del cuadre
export const editarGastosAsesor = async (req,res)=>{

  try {
    
    const{cont_concepto_id,cont_concepto_nombre,descripcion,monto,valor_tasa,tipoPago} = req.body    
    const{id} = req.params
    let tipoMoneda=0
    let debitoCalculado=0
    //buscamos el tipo modena del tipo_ago
     const selectTipoPago = `SELECT is_moneda_nacional FROM tipo_pago WHERE id = ?`;
    const resultado = await pool.query(selectTipoPago, [tipoPago]);
    
    if (resultado.length > 0) {
      tipoMoneda = resultado[0][0].is_moneda_nacional;      
    }

    if (tipoMoneda === 0) {
      debitoCalculado = monto;      
    } else {
      // Validar valor_tasa para evitar división por cero
      if (valor_tasa && valor_tasa !== 0) {
        debitoCalculado = monto / valor_tasa;
      } else {
        // Si no hay tasa válida, asignar monto directamente o manejar error
        debitoCalculado = monto;
      }      
    }
    const updateSql = `update cuadre_arqueo_egresos set cont_concepto_id =?,concepto=?,monto = ?,debito_calculado=?,descripcion=? where id=?`;
    await pool.query(updateSql,[cont_concepto_id,cont_concepto_nombre,monto,debitoCalculado,descripcion,id])
    res.json({ mensaje: "Gastos actualizados correctamente" });
  } catch (error) {
    console.error("Error al actualizar el egreso en informe del cuadre",error)    
  }
}

export const obtenerTasaDiaSiace = async (req, res) => {
  
  try {
    const { empresaId, fecha } = req.params;
    
    if (!empresaId || !fecha) {
      return res.status(400).json({ error: "Faltan parámetros: empresaId, fecha" });
    }
    const consultaSQL = `SELECT nueva_tasa_de_cambio_en_moneda_nacional FROM tipo_moneda_historial_tasa WHERE fecha = ? LIMIT 1;`;
    const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, [fecha]);
    res.json(resultados);
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ error: "Error al obtener valor de la tasa de cambio" });
  }
}


export const sseSubscribeCuadre = async (req, res) => {
  try {
    const { empresaId, codusua } = req.params
    if (!empresaId || !codusua) return res.status(400).json({ error: 'Faltan params' })

    // headers SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write(':ok\n\n')

    addSseClient(empresaId, codusua, res)

    req.on('close', () => {
      try { removeSseClient(empresaId, codusua, res) } catch (e) {}
    })
  } catch (error) {
    console.error(error)
  }
}

export const obtenerDatosArqueoAsesor = async (req, res) => {
  try {
    const { empresaId, fecha, codusua } = req.params
    if (!empresaId || !fecha || !codusua) return res.status(400).json({ error: 'Faltan parámetros' })

    const consulta = `SELECT c.id, c.tipo_pago_id,tp.nombre as tipo_nombre, c.fecha, c.monto, c.valor_tasa, c.credito_calculado,c.debito_calculado FROM cuadre_arqueo_ingreso c, tipo_pago tp WHERE empresa_id = ? AND fecha = ? AND codusua = ? AND c.tipo_pago_id = tp.id`;
    
    const [rows] = await pool.query(consulta, [empresaId, fecha, codusua])
    
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener datos arqueo asesor' })
  }
}

export const eliminarCuadreEfectivoDetallado = async (req, res) => {
  let connection
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: "Falta id" })

    // obtener empresa_id y codusua antes de borrar para notificar
    
    const [rows] = await pool.query(`SELECT empresa_id, codusua, fecha FROM cuadre_efectivo_detallado WHERE id = ?`, [id])
    if (rows.length === 0) {
      
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
    const { empresa_id, codusua, fecha } = rows[0]
    await pool.query(`DELETE FROM cuadre_efectivo_detallado WHERE id = ?`, [id])
    
    // notify
    try { notifySse(empresa_id, codusua, { type: 'detallado_deleted', empresa_id, codusua, fecha, id }) } catch (e) {}
    res.json({ mensaje: "Registro eliminado" })
  } catch (error) {
    console.error(error)
    
    res.status(500).json({ error: "Error al eliminar registro" })
  }
}

export const obtenerConceptosContables = async (req, res) => {
  try {
    const { empresaId } = req.params
    if (!empresaId) return res.status(400).json({ error: 'Falta empresaId' })

    const consultaSQL = `SELECT keycodigo, nombre FROM cont_concepto WHERE is_activo=1`;
    const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, [])
    res.json(resultados)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener conceptos contables' })
  }
}

export const guardarCuadreArqueoGasto = async (req, res) => {
  let connection
  try {
    const { empresa_id, codusua,usuario, fecha, tipo_pago_id, valor_tasa, debito, debito_calculado, cont_concepto_id, concepto, descripcion,usuario_id } = req.body
    if (!empresa_id || !codusua || !fecha || !tipo_pago_id) return res.status(400).json({ error: 'Faltan parámetros' })

    ///connection = await pool.getConnection()

    const descripcionUpper = typeof descripcion === 'string' ? descripcion.toUpperCase() : descripcion
    
    const insertEgresoSQL = `INSERT INTO cuadre_arqueo_egresos (empresa_id, cont_concepto_id, concepto, tipo_pago_id, descripcion, monto, valor_tasa, debito_calculado, fecha, codusua,usuario, created_by,created_at) VALUES (?,?,?,?,UPPER(?),?,?,?,?,?,?,?,NOW())`
    await pool.query(insertEgresoSQL, [empresa_id,cont_concepto_id, concepto, tipo_pago_id, descripcionUpper, debito,valor_tasa, debito_calculado, fecha, codusua,usuario,usuario_id])
   
    
   
    res.json({ mensaje: 'Gasto registrado' })
  } catch (error) {
    console.error(error)
    
    res.status(500).json({ error: 'Error al guardar gasto' })
  }
}

export const obtenerCuadreArqueoEgresos = async (req, res) => {
  try {
    const { codusua } = req.params
    const { empresa_id, fecha } = req.query
    if (!codusua || !empresa_id || !fecha) return res.status(400).json({ error: 'Faltan parámetros' })

    const consultaSQL = `SELECT e.id, e.concepto, e.cont_concepto_id, e.descripcion, e.monto,t.nombre_corto, e.debito_calculado FROM cuadre_arqueo_egresos e left join tipo_pago t on e.tipo_pago_id = t.id  WHERE e.empresa_id = ? AND e.fecha = ? AND e.codusua = ?`;
    
    const [rows] = await pool.query(consultaSQL, [empresa_id, fecha, codusua])
    
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener egresos' })
  }
}
export const eliminarCuadreArqueoEgreso = async (req, res) => {
  let connection
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: "Falta id" })

    // obtener empresa_id y codusua antes de borrar para notificar
    connection = await pool.getConnection()
    const [rows] = await pool.query(`SELECT empresa_id, codusua, fecha FROM cuadre_arqueo_egresos WHERE id = ?`, [id])
    if (rows.length === 0) {
      
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
    const { empresa_id, codusua, fecha } = rows[0]
    await pool.query(`DELETE FROM cuadre_arqueo_egresos WHERE id = ?`, [id])
    
    // notify
    try { notifySse(empresa_id, codusua, { type: 'egreso_deleted', empresa_id, codusua, fecha, id }) } catch (e) {
      console.error(e)

    }
    res.json({ mensaje: "Registro eliminado" })
  } catch (error) {
    console.error(error)
   
    res.status(500).json({ error: "Error al eliminar registro" })
  }
}

//INSERTAR REGISTRO EN EL FRLUJO DE EFECTIVO SIACE
export const exportarAlFlujoEfectivoSiace = async (req, res) => {
  const { empresaId, fecha } = req.params;
  try {
    // 0. Validar si existe un arqueo abierto no realiza la exportacion para esa fecha
    const validarArqueoAbierto = `
      SELECT COUNT(*) AS total
      FROM mov_pagos mp
      WHERE fecha = ?
      and mp.arqueo = 0
    `;

    const arqueosAbiertos = await ejecutarConsultaEnEmpresaPorId(empresaId, validarArqueoAbierto, [
      fecha,
    ]);

    const totalArqueos = Array.isArray(arqueosAbiertos) && arqueosAbiertos.length
      ? Number(arqueosAbiertos[0].total ?? arqueosAbiertos[0]['COUNT(*)'] ?? 0)
      : 0;

    if (totalArqueos > 0) {
      return res.status(409).json({
        error: `Existen arqueos abiertos en mov_pagos para la fecha ${fecha}. No se puede exportar hasta que se cierren esos arqueos.`,
        codigo: 'ARQUEOS_ABIERTOS',
      });
    }    

    // 0. Validar si ya se exportó el flujo para esa fecha (evitar duplicados)
    // Usamos el rastro del sistema (codusua/usuario/equipo) para identificar inserciones previas.
    const validarExistenciaSQL = `
      SELECT COUNT(*) AS total
      FROM cont_registro
      WHERE fecha_de_operacion = ?
        AND codusua = ?
        AND usuario = ?
        AND equipo = ?
    `;

    const yaInsertados = await ejecutarConsultaEnEmpresaPorId(empresaId, validarExistenciaSQL, [
      fecha,
      9,
      'SISTEMA-REPORTES',
      'SERVER',
    ]);

    const totalPrevio = Array.isArray(yaInsertados) && yaInsertados.length
      ? Number(yaInsertados[0].total ?? yaInsertados[0]['COUNT(*)'] ?? 0)
      : 0;

    if (totalPrevio > 0) {
      return res.status(409).json({
        error: `Ya existen registros exportados en cont_registro para la fecha ${fecha}. Si necesita re-exportar, primero elimine esos registros.`,
        codigo: 'YA_EXPORTADO',
      });
    }

    // 1. Buscar el último comprobante del flujo de efectivo
    const consultaSQL = `SELECT comprobante FROM cont_registro ORDER BY comprobante DESC LIMIT 1`;
    const ultimoComprobanteSQL = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, []);

    // 3. Generar nuevo comprobante
    let nuevoComprobante;
    
    if (ultimoComprobanteSQL.length > 0 && ultimoComprobanteSQL[0].comprobante) {
      const ultimoComprobante = ultimoComprobanteSQL[0].comprobante;
      
      // Validar que tenga 10 caracteres
      if (ultimoComprobante.length !== 10) {
        return res.status(500).json({ 
          error: `Formato de comprobante inválido. Se esperaban 10 caracteres, se recibieron ${ultimoComprobante.length}` 
        });
      }
      
      // Convertir a número y sumar 1
      const ultimoNumero = parseInt(ultimoComprobante, 10);
      
      if (isNaN(ultimoNumero)) {
        return res.status(500).json({ 
          error: `No se pudo convertir el comprobante a número: "${ultimoComprobante}"` 
        });
      }
      
      const nuevoNumero = ultimoNumero + 1;
      nuevoComprobante = nuevoNumero.toString().padStart(10, '0');
      
      // Validar que no exceda 10 dígitos
      if (nuevoComprobante.length > 10) {
        return res.status(500).json({ 
          error: `El número de comprobante excede 10 dígitos después del incremento: ${nuevoNumero}` 
        });
      }
    } else {
      // Si no hay comprobantes previos
      nuevoComprobante = '0000000001';
    }

       // 4. Insertar registros en cont_registro
    const registrosInsertados = [];
   

    const gastosYConceptos = await obtenerDatosGastosPorFecha(empresaId, fecha);
    
    for (const item of gastosYConceptos) {
      
      const insertSQL = `
        INSERT INTO cont_registro 
        (fecha_de_operacion, comprobante, codcuenta, codconcepto, descripcion, 
         debito, credito, monto_moneda_cuenta_debito, monto_moneda_cuenta_credito, 
         fecha, codusua, usuario, equipo, registrado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, NOW())
      `;
      console.log("fecha a insertar :",fecha);
      const params = [
        fecha,                      // fecha_de_operacion
        nuevoComprobante,           // comprobante (mismo para todos)
        item.cont_cuenta_id || 0,   // codcuenta
        item.cont_concepto_id || 0, // codconcepto
        item.descripcion || '',     // descripcion
        item.debito_base || 0,           // debito
        item.credito_base || 0,          // credito
        item.debito || 0,           // monto_moneda_cuenta_debito
        item.credito || 0,          // monto_moneda_cuenta_credito
        9,                          // codusua
        'SISTEMA-REPORTES',                  // usuario
        'SERVER'                    // equipo
      ];
      // insertamos en el flujo de efectivo      
      const resultadoInsert = await ejecutarConsultaEnEmpresaPorId(empresaId, insertSQL, params);
      registrosInsertados.push({
        id: resultadoInsert.insertId?resultadoInsert.insertId:null,
        comprobante: nuevoComprobante,
        concepto: item.concepto,
        monto: item.debito > 0 ? item.debito : item.credito
      });
    }

    // 5. Respuesta exitosa
    res.json({ 
      success: true, 
      mensaje: 'Datos exportados al flujo de efectivo SIACE', 
      nuevoComprobante,
      totalRegistros: registrosInsertados.length,
      registros: registrosInsertados
    });

  } catch (error) {
    console.error('Error en exportarAlFlujoEfectivoSiace:', error);
    
    // Manejo de errores más específico
    let mensajeError = 'Error al exportar al flujo de efectivo';
    let statusCode = 500;
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      mensajeError = 'La tabla especificada no existe en la base de datos';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      mensajeError = 'Campo no encontrado en la tabla';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      mensajeError = 'Acceso denegado a la base de datos';
    }
    
    res.status(statusCode).json({ 
      error: mensajeError,
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const guardarObservacionGeneralCuadreAsesor = async (req, res) => {
  try {
    const { empresa_id, codusua, usuario, fecha, observacion, usuario_id, usuario_nombre } = req.body;
    const insertSql = `
      INSERT INTO cuadre_observacion_general (empresa_id, fecha,codusua,usuario, observacion, created_by ,created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    const values = [empresa_id, fecha, codusua, usuario ?? usuario_nombre ?? '', observacion, usuario_id];
    await pool.query(insertSql, values);
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando observación general:', error);
    res.status(500).json({ error: 'Error al guardar la observación general' });
  }
};

export const obtenerObservacionGeneralCaudreAsesor = async (req, res)=> {
  try{
    const { empresaId, empresa_id, fecha, codusua } = req.params;
    const empresa = empresaId ?? empresa_id;

    if (!empresa || !fecha || !codusua) {
      return res.status(400).json({ error: 'Faltan parámetros: empresaId, fecha y/o codusua' });
    }

    const consultaSQL = `
      SELECT observacion
      FROM cuadre_observacion_general
      WHERE empresa_id = ? AND fecha = ? AND codusua = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `;

    const [registros] = await pool.query(consultaSQL, [empresa, fecha, codusua]);
    res.json({ observacion: registros.length > 0 ? registros[0].observacion : '' });
  }catch(error){
    console.error('error al obtener observacion general:', error);
    res.status(500).json({ error: 'Error al obtener la observación general' });
  }
}

export const listarObservacionesGeneralCuadreAsesor = async (req, res) => {
  try {
    const { empresaId, empresa_id, fecha, codusua } = req.params
    const empresa = empresaId ?? empresa_id

    if (!empresa || !fecha || !codusua) {
      return res.status(400).json({ error: 'Faltan parámetros: empresaId, fecha y/o codusua' })
    }

    const consultaSQL = `
      SELECT id, observacion, usuario, created_at
      FROM cuadre_observacion_general
      WHERE empresa_id = ? AND fecha = ? AND codusua = ?
      ORDER BY created_at DESC, id DESC
    `

    const [rows] = await pool.query(consultaSQL, [empresa, fecha, codusua])
    res.json(rows)
  } catch (error) {
    console.error('error al listar observaciones general:', error)
    res.status(500).json({ error: 'Error al listar las observaciones' })
  }
}

export const listarObservacionesGeneralCuadre = async (req, res) => {
  try {
    const { empresaId, fecha } = req.params    
    const empresa = empresaId 

    if (!empresa || !fecha ) {
      return res.status(400).json({ error: 'Faltan parámetros: empresaId, fecha' })
    }

    const consultaSQL = `
      SELECT id, observacion, usuario, created_at
      FROM cuadre_observacion_general
      WHERE empresa_id = ? AND fecha = ? 
      ORDER BY created_at DESC, id DESC
    `

    const [rows] = await pool.query(consultaSQL, [empresa, fecha])    
    res.json(rows)
  } catch (error) {
    console.error('error al listar observaciones general:', error)
    res.status(500).json({ error: 'Error al listar las observaciones' })
  }
}

export const eliminarObservacionGeneralCaudreAsesor = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Falta id' })

    const deleteSQL = `DELETE FROM cuadre_observacion_general WHERE id = ?`
    await pool.query(deleteSQL, [id])
    res.json({ mensaje: 'Observación eliminada' })
  } catch (error) {
    console.error('Error al eliminar observación general:', error)
    res.status(500).json({ error: 'Error al eliminar la observación' })
  }
}

export const obtenerContContable = async (request, response)=>{
  try {
    const { empresaId} = request.params
    if (!empresaId) return response.status(400).json({ error: 'Faltan parámetros' })
    const consultaSQL = `SELECT c.keycodigo,c.nombre,codtipomoneda,t.is_nacional AS nacional FROM cont_cuenta c,tipo_moneda t WHERE c.codtipomoneda=t.keycodigo AND c.is_activa=1`;
    const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL)
    response.json(resultados)
  } catch (error) {
    console.error(error)
    response.status(500).json({ error: 'Error al obtener concepto contable' })
  }
}

export const buscarFlujoEfectivoSiacePorFecha = async (req, res) => {
  try {
    const { empresaId, fechaDesde, fechaHasta, descripcion, debito, credito } = req.body;
    if (!empresaId || !fechaDesde || !fechaHasta) return res.status(400).json({ error: 'Faltan parámetros' });

    let where = `
      c.keycodigo = r.codconcepto
      AND r.codcuenta = t.keycodigo
      AND (r.fecha_de_operacion BETWEEN ? AND ?)
    `;
    const params = [fechaDesde, fechaHasta];

    if (descripcion) {
      where += " AND r.descripcion LIKE ?";
      params.push(`%${descripcion}%`);
    }
    if (debito) {
      where += " AND r.debito = ?";
      params.push(debito);
    }
    if (credito) {
      where += " AND r.credito = ?";
      params.push(credito);
    }

    const consultaSQL = `
      SELECT r.fecha_de_operacion, r.keycodigo, r.codconcepto, c.nombre AS nombre_concepto, r.codcuenta, t.nombre AS nombre_cuenta, r.descripcion, r.referencia, r.debito, r.credito, r.saldo, r.monto_moneda_cuenta_debito, r.monto_moneda_cuenta_credito, r.monto_moneda_cuenta_saldo 
      FROM cont_registro r, cont_concepto c, cont_cuenta t 
      WHERE ${where}
      ORDER BY fecha_de_operacion, comprobante
    `;

    const rows = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al listar flujo de efectivo SIACE:', error);
    res.status(500).json({ error: 'Error al listar flujo de efectivo SIACE' });
  }
}

export const nuevoComprobanteFlujoEfectivoSiace = async(empresaId)=> {
  // 1. Buscar el último comprobante del flujo de efectivo
    const consultaSQL = `SELECT comprobante FROM cont_registro ORDER BY comprobante DESC LIMIT 1`;
    const ultimoComprobanteSQL = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, []);

    // 3. Generar nuevo comprobante
    let nuevoComprobante;
    
    if (ultimoComprobanteSQL.length > 0 && ultimoComprobanteSQL[0].comprobante) {
      const ultimoComprobante = ultimoComprobanteSQL[0].comprobante;
      
      // Validar que tenga 10 caracteres
      if (ultimoComprobante.length !== 10) {
        throw new Error(`Formato de comprobante inválido. Se esperaban 10 caracteres, se recibieron ${ultimoComprobante.length}`);
      }
      
      // Convertir a número y sumar 1
      const ultimoNumero = parseInt(ultimoComprobante, 10);
      
      if (isNaN(ultimoNumero)) {
        return res.status(500).json({ 
          error: `No se pudo convertir el comprobante a número: "${ultimoComprobante}"` 
        });
      }
      
      const nuevoNumero = ultimoNumero + 1;
      nuevoComprobante = nuevoNumero.toString().padStart(10, '0');
      
      // Validar que no exceda 10 dígitos
      if (nuevoComprobante.length > 10) {
        return res.status(500).json({ 
          error: `El número de comprobante excede 10 dígitos después del incremento: ${nuevoNumero}` 
        });
      }
    } else {
      // Si no hay comprobantes previos
      nuevoComprobante = '0000000001';
    }
    return nuevoComprobante;
}

export const obtenerTodosTipoMoneda = async (req, res) => {
  try {
    const { empresaId } = req.params
    if (!empresaId) return res.status(400).json({ error: 'Falta empresaId' })

    //const consultaSQL = `SELECT keycodigo,nombre_singular,abreviatura,precio_venta_moneda_nacional FROM tipo_moneda WHERE is_activo = 1`;
    //const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, [])
    const cosultaSQL =`SELECT id as keycodigo,abreviatura,monto_moneda_nacional as valor,tipo_moneda_id as tipoMoneda,is_moneda_nacional as nacional FROM tipo_tasa_cambiaria WHERE is_activo = 1`;
    const [resultados] = await pool.query(cosultaSQL)
    res.json(resultados)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener tipos de moneda' })
  }
}
