const express = require("express");
const router = express.Router();

const controller = require("../controllers/boletimOcorrenciaController");
const { protect } = require("../middlewares/authMiddleware");
const adminOuComando = require("../middlewares/adminOuComando");

router.use(protect(["user", "admin", "comando", "superadmin"]));

router.get("/", adminOuComando, controller.listarTodos);
router.get("/me", controller.listarMeus);
router.get("/:id", controller.getById);
router.post("/", controller.criar);
router.delete("/:id", controller.excluir);

module.exports = router;
