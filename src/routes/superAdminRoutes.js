const express = require("express");
const router = express.Router();
const controller = require("../controllers/superAdminController");
const { protect } = require("../middlewares/authMiddleware");

// 🔒 todas as rotas exigem SUPERADMIN
router.use(protect(["superadmin"]));

router.get("/users", controller.listUsers);
router.put("/users/:id/role", controller.updateRole);
router.delete("/users/:id", controller.deleteUser);

// 🔐 RESETAR SENHA (SUPERADMIN)
router.put("/users/:id/reset-password", controller.resetarSenha);

module.exports = router;
