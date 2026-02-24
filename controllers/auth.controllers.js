import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
    }

    const { nombre, email, password, rol } = req.body;

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Validar que el rol sea válido
    if (rol && !['ADMIN', 'BARBERO'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser ADMIN o BARBERO',
      });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: hashedPassword,
        rol: rol || 'BARBERO', // Por defecto BARBERO si no se especifica
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true,
      },
    });

    // Generar token
    const token = generateToken({
      userId: nuevoUsuario.id,
      email: nuevoUsuario.email,
      rol: nuevoUsuario.rol,
    });

    // Configurar cookie con el token
    const cookieOptions = {
      httpOnly: true, // Previene acceso desde JavaScript del cliente
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Protección CSRF
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    };

    res.cookie('token', token, cookieOptions);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario: nuevoUsuario,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador',
      });
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Generar token
    const token = generateToken({
      userId: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    // Configurar cookie con el token
    const cookieOptions = {
      httpOnly: true, // Previene acceso desde JavaScript del cliente
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Protección CSRF
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    };

    res.cookie('token', token, cookieOptions);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message,
    });
  }
};


