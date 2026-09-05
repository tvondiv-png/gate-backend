const express = require("express");
const router = express.Router();
const controller = require("../controllers/advertenciaController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect(["admin", "superadmin"]), controller.listarAdvertencias);
router.get("/minha", protect(["user", "admin", "superadmin"]), controller.minhaAdvertencia);

router.post("/", protect(["admin", "superadmin"]), controller.criarOuAtualizarAdvertencia);
router.post("/delete-many", protect(["admin", "superadmin"]), controller.excluirAdvertenciasEmLote);

router.delete("/:id", protect(["admin", "superadmin"]), controller.excluirAdvertencia);

module.exports = router;