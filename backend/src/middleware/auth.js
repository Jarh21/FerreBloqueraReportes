export const authMiddleware = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "No autenticado" })
  }
  next()
}

export const adminMiddleware = (req, res, next) => {
  if (req.session.usuario.role_id !== 1) {
    return res.status(403).json({ error: "Acceso denegado" })
  }
  next()
}
