import { verifyToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    // Leer token de la cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido',
      });
    }  

    const decoded = verifyToken(token);

    // Verificar que el usuario existe y está activo
    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo',
      });
    }

    req.user = usuario;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido',
    });
  }
};
