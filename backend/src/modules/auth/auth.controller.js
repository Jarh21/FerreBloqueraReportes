import bcrypt from "bcrypt"
import {pool } from "../../config/database.js"

export const registro = async (req, res) => {
  try { 
    const { nombre, email, contraseña, role_id = 2 } = req.body

    if (!nombre || !email || !contraseña) {
      return res.status(400).json({ error: "Campos requeridos" })
    }

    //const hashedPassword = await bcrypt.hash(contraseña, 10)
    const hashedPassword = contraseña
    const connection = await pool.getConnection()
    await connection.execute("INSERT INTO usuarios (nombre, email, contraseña, role_id) VALUES (?, ?, ?, ?)", [
      nombre,
      email,
      hashedPassword,
      role_id,
    ])
    connection.release()

    res.json({ mensaje: "Usuario registrado exitosamente" })
  } catch (error) {
    console.error(error)
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El email ya está registrado" })
    }
    res.status(500).json({ error: "Error al registrar usuario" })
  }
}

export const login = async (req, res) => {
  try {
    const { email, contraseña } = req.body

    if (!email || !contraseña) {
      return res.status(400).json({ error: "Email y contraseña requeridos" })
    }

    const connection = await pool.getConnection()
    const [usuarios] = await connection.execute(
      `SELECT u.*, r.nombre AS role_nombre,r.id AS role_id FROM usuarios u,role_usuarios ru,roles r       
      WHERE u.email = ?
      AND ru.usuario_id = u.id
      AND ru.role_id = r.id`,
      [email],
    )
    connection.release()

    if (usuarios.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    const usuario = usuarios[0]
    //const validPassword = await bcrypt.compare(contraseña, usuario.contraseña) 
    const validPassword = contraseña === usuario.contraseña
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" })
    }

    req.session.userId = usuario.id
    //se crea un objeto usuario en la sesión con los datos necesarios
    req.session.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      role_id: usuario.role_id,
      role_nombre: usuario.role_nombre,
    }

    res.json({
      mensaje: "Login exitoso",
      usuario: req.session.usuario,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al iniciar sesión" })
  }
}

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Error al cerrar sesión" })
    }
    res.json({ mensaje: "Sesión cerrada" })
  })
}

export const me = async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [usuarios] = await connection.execute(
      `SELECT u.id, u.nombre, u.email, r.id as role_id, r.nombre as role_nombre 
      FROM usuarios u,role_usuarios ru,roles r         
      WHERE u.id = ?
      AND ru.usuario_id = u.id
      AND ru.role_id = r.id`,
      [req.session.userId],
    )
    connection.release()

    if (usuarios.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    const usuario = usuarios[0]

    // Obtener empresas del usuario
    const conn = await pool.getConnection()
    const [empresas] = await conn.execute(
      `SELECT e.* FROM empresas e 
       JOIN usuarios_empresas ue ON e.id = ue.empresa_id 
       WHERE ue.usuario_id = ?`,
      [req.session.userId],
    )
    conn.release()

    // Obtener módulos permitidos
    const conn2 = await pool.getConnection()
    const [modulos] = await conn2.execute(
      `SELECT m.* FROM modulos m 
       JOIN rol_permisos rp ON m.id = rp.modulo_id 
       WHERE rp.role_id = ?`,
      [usuario.role_id],
    )
    conn2.release()

    res.json({
      usuario,
      empresas,
      modulos,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener datos del usuario" })
  }
}
