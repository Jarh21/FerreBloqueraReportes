import {pool }from "../../config/database.js"

export const obtenerEmpresas = async (req, res) => {
  try {
    
    let query, params

    if (req.session.usuario.role_id === 1) {
      // Admin ve todas las empresas
      query = "SELECT * FROM empresas WHERE estado = ? ORDER BY nombre"
      params = ["activo"]
    } else {
      // Usuario solo ve sus empresas
      query = `SELECT DISTINCT e.id,nombre,rif,direccion,telefono,email,ciudad,estado FROM empresas e 
               JOIN usuarios_empresas ue ON e.id = ue.empresa_id 
               WHERE ue.usuario_id = ? AND e.estado = ? 
               ORDER BY e.nombre`
      params = [req.session.userId, "activo"]
    }

    const [empresas] = await pool.query(query, params)
    
    res.json(empresas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener empresas" })
  }
}

export const obtenerTodasEmpresas = async (req, res)=>{
  try {
    const [empresas] = await pool.query(
      `SELECT * FROM empresas ORDER BY nombre`
    )
    
    res.json(empresas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener empresas" })
  }
}

export const obtenerEmpresasPorUsuario = async (req, res) => {
  try {
    
    const [empresas] = await pool.query(
      `SELECT e.* FROM empresas e 
       JOIN usuarios_empresas ue ON e.id = ue.empresa_id 
       WHERE ue.usuario_id = ? AND e.estado = ? 
       ORDER BY e.nombre`,
      [req.session.userId, "activo"],
    )
    
    res.json(empresas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener empresas" })
  }
}

export const crearEmpresa = async (req, res) => {
  try {
    const { nombre, rif, direccion, telefono, email, ciudad,servidor, puerto, usuario_db, clave, basedatos } = req.body

    if (!nombre) {
      return res.status(400).json({ error: "El nombre es requerido" })
    }

    
    const result = await pool.query(
      "INSERT INTO empresas (nombre, rif, direccion, telefono, email, ciudad, servidor, puerto, usuario_db, clave, basedatos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [nombre, rif, direccion, telefono, email, ciudad, servidor, puerto, usuario_db, clave, basedatos],
    )
    

    res.json({
      mensaje: "Empresa creada exitosamente",
      id: result[0].insertId,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al crear empresa" })
  }
}

export const actualizarEmpresa = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, rif, direccion, telefono, email, ciudad, estado, servidor, puerto, usuario_db, clave, basedatos } = req.body

    
    await pool.query(
      "UPDATE empresas SET nombre = ?, rif = ?, direccion = ?, telefono = ?, email = ?, ciudad = ?, estado = ?, servidor = ?, puerto = ?, usuario_db = ?, clave = ?, basedatos = ? WHERE id = ?",
      [nombre, rif, direccion, telefono, email, ciudad, estado, servidor, puerto, usuario_db, clave, basedatos, id],
    )
    

    res.json({ mensaje: "Empresa actualizada" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al actualizar empresa" })
  }
}
