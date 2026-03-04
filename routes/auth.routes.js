import express from "express";
import { body } from "express-validator";
import { login, register, logout, me } from "../controllers/auth.controllers.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router()

router.post("/login", [
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isString().withMessage("Password debe ser un string"),
  body("password").isLength({ min: 6 }).withMessage("Password debe tener al menos 6 caracteres"),
], login)


router.post("/register", [
  body("name").notEmpty().withMessage("El nombre es requerido"),
  body("email").isEmail().withMessage("Email inválido"),
  body("password").isString().withMessage("Password debe ser un string"),
  body("password").isLength({ min: 6 }).withMessage("Password debe tener al menos 6 caracteres"),
  body("role").optional().isIn(["ADMIN", "USER"]).withMessage("Rol inválido"),
], register)

router.post("/logout", logout)

router.get("/me", authenticate, me)

export default router
