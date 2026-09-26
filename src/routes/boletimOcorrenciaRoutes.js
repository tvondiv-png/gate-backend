const express = require("express");
const router = express.Router();

const controller = require("../controllers/boletimOcorrenciaController");
const { protect } = require("../middlewares/authMiddleware");

router.use(protect(["user", "admin", "comando", "superadmin"]));

router.get("/me", controller.listarMeus);
router.get("/:id", controller.getById);
router.post("/", controller.criar);

module.exports = router;
