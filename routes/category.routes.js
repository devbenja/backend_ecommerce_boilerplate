import express from "express";
import { body, param } from "express-validator";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getTreeCategories,
} from "../controllers/category.controllers.js";

const router = express.Router();

router.post(
  "/",
  [
    body("name").notEmpty().withMessage("El nombre es requerido"),
    body("slug").notEmpty().withMessage("El slug es requerido"),
    body("slug").isSlug().withMessage("Slug inválido"),
    body("description").optional(),
    body("parentId").optional().isInt().withMessage("El parentId debe ser un entero"),
  ],
  createCategory
);

router.get("/", getAllCategories);

router.get("/tree", getTreeCategories);

router.get(
  "/:id",
  [param("id").isInt().withMessage("El ID debe ser un entero")],
  getCategoryById
);

router.put(
  "/:id",
  [
    param("id").isInt().withMessage("El ID debe ser un entero"),
    body("name").optional().notEmpty().withMessage("El nombre no puede estar vacío"),
    body("slug").optional().isSlug().withMessage("Slug inválido"),
    body("description").optional(),
    body("parentId").optional().isInt().withMessage("El parentId debe ser un entero"),
    body("status").optional().isBoolean().withMessage("El status debe ser un booleano"),
  ],
  updateCategory
);

router.delete(
  "/:id",
  [param("id").isInt().withMessage("El ID debe ser un entero")],
  deleteCategory
);

export default router;