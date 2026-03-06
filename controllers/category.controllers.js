import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
    }

    const { name, slug, description, parentId } = req.body;

    const slugExistente = await prisma.category.findUnique({
      where: { slug },
    });

    if (slugExistente) {
      return res.status(400).json({
        success: false,
        message: 'El slug ya está en uso',
      });
    }

    if (parentId) {
      const parentExistente = await prisma.category.findUnique({
        where: { id: parentId },
      });

      if (!parentExistente) {
        return res.status(400).json({
          success: false,
          message: 'La categoría padre no existe',
        });
      }
    }

    const categoria = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        parentId: parentId || null,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: categoria,
    });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message,
    });
  }
};

export const getAllCategories = async (req, res) => {
  try {
    const { parentId, includeSubcategories = 'true' } = req.query;

    const where = parentId !== undefined 
      ? { parentId: parentId === 'null' ? null : parseInt(parentId) }
      : {};

    const categorias = await prisma.category.findMany({
      where,
      include: {
        ...(includeSubcategories === 'true' && { children: true }),
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { children: true, products: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message,
    });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
        children: true,
        products: {
          select: { id: true, name: true, slug: true, price: true },
        },
      },
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    res.json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { name, slug, description, parentId, status } = req.body;

    const categoriaExistente = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!categoriaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    if (slug && slug !== categoriaExistente.slug) {
      const slugExistente = await prisma.category.findFirst({
        where: { slug, id: { not: parseInt(id) } },
      });

      if (slugExistente) {
        return res.status(400).json({
          success: false,
          message: 'El slug ya está en uso',
        });
      }
    }

    if (parentId !== undefined && parentId !== null) {
      if (parseInt(parentId) === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Una categoría no puede ser su propia padre',
        });
      }

      const parentExistente = await prisma.category.findUnique({
        where: { id: parseInt(parentId) },
      });

      if (!parentExistente) {
        return res.status(400).json({
          success: false,
          message: 'La categoría padre no existe',
        });
      }
    }

    const categoriaActualizada = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
        ...(parentId !== undefined && { parentId: parentId ? parseInt(parentId) : null }),
        ...(status !== undefined && { status }),
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: categoriaActualizada,
    });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const categoriaExistente = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: true,
        products: true,
      },
    });

    if (!categoriaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
    }

    if (categoriaExistente.children.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una categoría con subcategorías',
      });
    }

    if (categoriaExistente.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar una categoría con productos asociados',
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message,
    });
  }
};

export const getTreeCategories = async (req, res) => {
  try {
    const categorias = await prisma.category.findMany({
      where: { parentId: null, status: true },
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    console.error('Error al obtener árbol de categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener árbol de categorías',
      error: error.message,
    });
  }
};