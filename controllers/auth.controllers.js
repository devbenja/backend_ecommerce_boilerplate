import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
});

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

    const { name, email, password, role } = req.body;

    if (typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: [{ msg: 'Password debe ser un string', path: 'password' }],
      });
    }

    const usuarioExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Validar que el rol sea válido
    if (role && !['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser ADMIN o USER',
      });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const nuevoUsuario = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        date_created: true,
      },
    });

    // Generar token
    const token = generateToken({
      userId: nuevoUsuario.id,
      email: nuevoUsuario.email,
      role: nuevoUsuario.role,
    });

    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: nuevoUsuario,
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

    if (typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: [{ msg: 'Password debe ser un string', path: 'password' }],
      });
    }

    // Buscar usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    if (!usuario.status) {
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
      role: usuario.role,
    });

    res.cookie('token', token, getCookieOptions());

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          role: usuario.role,
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

export const logout = async (req, res) => {
  res.clearCookie('token', getCookieOptions());
  res.json({ success: true, message: 'Sesión cerrada' });
};

export const me = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};


