import {pool, ejecutarConsultaEnEmpresaPorId } from "../../config/database.js"

export const obtenerEstadoProveedores = async (req, res) => {
  try {
    const { empresaId } = req.params

    const connection = await pool.getConnection()
    const [reportes] = await connection.execute(
      "SELECT * FROM reportes_proveedores WHERE empresa_id = ? ORDER BY fecha DESC",
      [empresaId],
    )
    connection.release()

    res.json(reportes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener reportes" })
  }
}

export const obtenerVentas = async (req, res) => {
  try {
    const { empresaId } = req.params

    const connection = await pool.getConnection()
    const [reportes] = await connection.execute(
      "SELECT * FROM reportes_ventas WHERE empresa_id = ? ORDER BY fecha DESC",
      [empresaId],
    )
    connection.release()

    res.json(reportes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener reportes" })
  }
}

export const obtenerSaldos = async (req, res) => {
  try {
    const { empresaId } = req.params

    const connection = await pool.getConnection()
    const [reportes] = await connection.execute(
      "SELECT * FROM reportes_saldos WHERE empresa_id = ? ORDER BY fecha DESC",
      [empresaId],
    )
    connection.release()

    res.json(reportes)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener reportes" })
  }
}

export const totalSaldoEmpresa = async (req, resp)=>{
  try {
    const {empresaId} = req.params;
    const consultaSQL = `WITH UltimoRegistro AS (
      
      SELECT
          codcuenta,
          monto_moneda_cuenta_saldo,
          ROW_NUMBER() OVER (
              PARTITION BY codcuenta 
              ORDER BY fecha_de_operacion DESC, keycodigo DESC
          ) AS rn
      FROM
          cont_registro
      WHERE
          codcuenta IN (10, 38, 45, 37, 33, 11, 32, 20, 40, 46, 13, 25, 31, 24, 44, 43)
      ),
      UltimosSaldosBase AS (
          
          SELECT
              codcuenta,
              monto_moneda_cuenta_saldo
          FROM
              UltimoRegistro
          WHERE
              rn = 1
      ),
      TasaCambioBCV AS (
          
          SELECT
              precio_compra_moneda_nacional
          FROM
              tipo_moneda
          WHERE
              keycodigo = 1
      ),
      SaldosCalculados AS (
          
          SELECT
              USB.codcuenta,
              USB.monto_moneda_cuenta_saldo,
              
              
              CASE 
                  WHEN USB.codcuenta IN (40, 46, 13, 25, 31, 24, 44, 43) THEN 1.00
                  ELSE TCB.precio_compra_moneda_nacional
              END AS Tasa_BCV_Aplicada,

              
              CASE 
                  WHEN USB.codcuenta IN (40, 46, 13, 25, 31, 24, 44, 43) THEN 1.00
                  ELSE 325.00
              END AS Tasa_Paralelo_Aplicada
              
          FROM
              UltimosSaldosBase USB, TasaCambioBCV TCB
      )
      

      
      SELECT
          'Total Bs Efectivo' AS Tipo_Cuenta,
          FORMAT(SUM(monto_moneda_cuenta_saldo), 2) AS Total_VES_USD, -- RENOMBRADO
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_BCV_Aplicada), 2) AS Dolares_BCV,
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_Paralelo_Aplicada), 2) AS Dolares_Paralelo
      FROM
          SaldosCalculados
      WHERE
          codcuenta IN (32)

      UNION ALL

      
      SELECT
          'Total Bs Banco' AS Tipo_Cuenta,
          FORMAT(SUM(monto_moneda_cuenta_saldo), 2) AS Total_VES_USD, -- RENOMBRADO
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_BCV_Aplicada), 2) AS Dolares_BCV,
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_Paralelo_Aplicada), 2) AS Dolares_Paralelo
      FROM
          SaldosCalculados
      WHERE
          codcuenta IN (10, 38, 45, 37, 33, 11, 20)

      UNION ALL

      
      SELECT
          'Total Efectivo Divisas' AS Tipo_Cuenta,
          FORMAT(SUM(monto_moneda_cuenta_saldo), 2) AS Total_VES_USD, -- RENOMBRADO
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_BCV_Aplicada), 2) AS Dolares_BCV,
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_Paralelo_Aplicada), 2) AS Dolares_Paralelo
      FROM
          SaldosCalculados
      WHERE
          codcuenta IN (25, 31)

      UNION ALL

      
      SELECT
          'Total Efectivo Divisa Deteriorados' AS Tipo_Cuenta,
          FORMAT(SUM(monto_moneda_cuenta_saldo), 2) AS Total_VES_USD, -- RENOMBRADO
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_BCV_Aplicada), 2) AS Dolares_BCV,
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_Paralelo_Aplicada), 2) AS Dolares_Paralelo
      FROM
          SaldosCalculados
      WHERE
          codcuenta IN (24)

      UNION ALL

      
      SELECT
          'Total Divisas Banco' AS Tipo_Cuenta,
          FORMAT(SUM(monto_moneda_cuenta_saldo), 2) AS Total_VES_USD, -- RENOMBRADO
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_BCV_Aplicada), 2) AS Dolares_BCV,
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_Paralelo_Aplicada), 2) AS Dolares_Paralelo
      FROM
          SaldosCalculados
      WHERE
          codcuenta IN (40, 46, 25, 44)
          
          UNION ALL

      
      SELECT
          'Total USDT' AS Tipo_Cuenta,
          FORMAT(SUM(monto_moneda_cuenta_saldo), 2) AS Total_VES_USD, -- RENOMBRADO
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_BCV_Aplicada), 2) AS Dolares_BCV,
          FORMAT(SUM(monto_moneda_cuenta_saldo / Tasa_Paralelo_Aplicada), 2) AS Dolares_Paralelo
      FROM
          SaldosCalculados
      WHERE
          codcuenta IN (13,43)`;
    const resultados = await ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL);
    resp.json(resultados);
  } catch (error) {
    console.log(error);
    resp.status(500).json({error: "Error al obtener el total de saldos de la empresa"});
  }
}
