import { pool } from "../../config/database.js";

export const ObtenerEntidades = async (req, res) => {
  try {
    const [entidades] = await pool.query("SELECT * FROM entidades");
    res.status(200).json(entidades);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las entidades", error: error.message });
  }
};