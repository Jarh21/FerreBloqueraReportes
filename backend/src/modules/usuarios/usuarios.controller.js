import bcrypt from "bcrypt"
import {pool} from "../../config/database.js"

export const obtenerUsuarios = async (req, res) => {
  try {
    
    const [usuarios] = await pool.query(
      `SELECT
        u.id,
        u.nombre,
        u.email,
        u.role_id,
        r.nombre AS role_nombre,
        u.estado,
        IF (empresa.nombres_empresas IS NULL,'',empresa.nombres_empresas)empresas
      FROM
        usuarios u        
        JOIN role_usuarios ru
          ON ru.usuario_id = u.id
        JOIN roles r
          ON ru.role_id = r.id    
        LEFT JOIN 
        (SELECT ue.usuario_id, GROUP_CONCAT(e.nombre SEPARATOR ', ') AS nombres_empresas FROM usuarios_empresas ue LEFT JOIN empresas e ON ue.empresa_id = e.id GROUP BY ue.usuario_id)AS empresa
        ON u.id = empresa.usuario_id  
      ORDER BY u.created_at DESC`,
    )
    
    res.json(usuarios)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener usuarios" })
  }
}

export const obtenerRoles = async (req, res) => {
  try {
    const [roles] = await pool.query("SELECT * FROM roles")
    res.json(roles)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al obtener roles" })
  }
}

export const crearUsuario = async (req, res) => {

  // Ahora esperamos 'empresas_ids' en el body
  const { nombre, email, contraseña, role_id, empresa_id } = req.body
  let connection; // Declaramos la conexión fuera del try para poder cerrarla en caso de error

  try {
    if (!nombre || !email || !contraseña || !role_id) {
      return res.status(400).json({ error: "Campos requeridos" })
    }
    
    // Validar que empresas_ids sea un array si está presente
    if (empresa_id && (!Array.isArray(empresa_id) || empresa_id.length === 0)) {
        return res.status(400).json({ error: "Debe seleccionar al menos una empresa o el formato es incorrecto." });
    }

    //const hashedPassword = await bcrypt.hash(contraseña, 10)
    const hashedPassword = contraseña
    connection = await pool.getConnection()
    
    // INICIO DE LA TRANSACCIÓN
    await connection.beginTransaction();

    // 1. Insertar el usuario principal
    // Usamos `connection.execute` y capturamos el resultado para obtener el insertId
    const [userInsertResult] = await pool.query(
      "INSERT INTO usuarios (nombre, email, contraseña,created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [nombre, email, hashedPassword]
    )

    // Obtenemos el ID del usuario recién insertado
    const nuevoUsuarioId = userInsertResult.insertId
    // 2. Insertar la relación en role_usuarios
    await pool.query(
      "INSERT INTO role_usuarios (usuario_id, role_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [nuevoUsuarioId, role_id]
    )
    
    // 3. Insertar las relaciones en usuarios_empresas (si hay empresas seleccionadas)
    if (empresa_id && empresa_id.length > 0) {
        // Preparamos los valores para la inserción múltiple
        const values = empresa_id.map(empresaId => [nuevoUsuarioId, empresaId]);
        
        // Creamos la consulta SQL para inserción múltiple
        // El driver mysql2 soporta la sintaxis de aplanar arrays para inserciones múltiples
        
        const query = "INSERT INTO usuarios_empresas (usuario_id, empresa_id) VALUES ?"
        
        await connection.query(query, [values])
    }

    // Si todo fue bien, confirmamos la transacción
    await connection.commit() 

    

    res.json({ mensaje: "Usuario y empresas asignadas exitosamente" })

  } catch (error) {
    console.error(error)
    
    // Si hubo un error en cualquier punto, revertimos la transacción
    if (connection) {
        await connection.rollback()
        
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El email ya está registrado" })
    }
    res.status(500).json({ error: "Error al crear usuario y asignar empresas" })
  }
}



export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params

    
    await pool.query("DELETE FROM usuarios WHERE id = ?", [id])
    

    res.json({ mensaje: "Usuario eliminado" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Error al eliminar usuario" })
  }
}

export const editarUsuarios = async (req, res) => {
  try {
    const { id } = req.params;

    ;
    const [usuarios] = await pool.query(
      `SELECT
        u.id,
        u.nombre,
        u.email,
        u.role_id,
        u.estado       
      FROM
        usuarios u
      WHERE u.id = ?`,
      [id]
    );

    const[empresasAsignadas]= await pool.query(`SELECT empresa_id FROM usuarios_empresas WHERE usuario_id = ?`,[id]);
    ;
    const[roles]= await pool.query(`SELECT * FROM roles`);
    if (usuarios.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const empresasAsignadasIds = empresasAsignadas.map(row => row.empresa_id);

    // Fusionar los datos: Añadir la nueva propiedad 'empresasAsignadas' al objeto 'usuario'
    const usuarioConEmpresas = {
      ...usuarios[0],
      empresasAsignadas: empresasAsignadasIds,
      roles: roles
    };

    // Enviar el objeto fusionado como respuesta JSON
    res.json(usuarioConEmpresas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
}

export const actualizarUsuario = async (req, res) => {
  let connection
  try {
    const { id } = req.params;
    const { nombre, email, role_id, estado, selectedEmpresas } = req.body;
    const empresaIds = Array.isArray(selectedEmpresas)
      ? selectedEmpresas.map(idStr => parseInt(idStr, 10)).filter(n => !Number.isNaN(n))
      : [];
    const hashedPassword = req.body.contraseña;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (hashedPassword) {
      await pool.query(
        "UPDATE usuarios SET nombre = ?, email = ?, contraseña = ?,  estado = ? WHERE id = ?",
        [nombre, email, hashedPassword, estado, id]
      );
      await pool.query("UPDATE role_usuarios SET role_id = ? WHERE usuario_id = ?", [role_id, id]);
    } else {
      await pool.query(
        "UPDATE usuarios SET nombre = ?, email = ?, role_id = ?, estado = ? WHERE id = ?",
        [nombre, email, role_id, estado, id]
      );
      await pool.query("UPDATE role_usuarios SET role_id = ? WHERE usuario_id = ?", [role_id, id]);
    }

    // Eliminar relaciones existentes
    await pool.query("DELETE FROM usuarios_empresas WHERE usuario_id = ?", [id]);

    // Insertar nuevas relaciones si hay empresas seleccionadas
    if (empresaIds.length > 0) {
      const userId = parseInt(id, 10);
      const values = empresaIds.map(empresaId => [userId, empresaId]);
      
      await connection.query("INSERT INTO usuarios_empresas (usuario_id, empresa_id) VALUES ?", [values]);
    }

    await connection.commit();
    ;

    res.json({ mensaje: "Usuario actualizado" });
  } catch (error) {
    console.error(error);
    if (connection) {
      try {
        await connection.rollback();
      } catch (e) {
        console.error("Error en rollback:", e);
      }
      ;
    }
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
}