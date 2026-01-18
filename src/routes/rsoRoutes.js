const express = require("express");
const router = express.Router();
const controller = require("../controllers/rsoController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/me", protect(["user", "admin", "superadmin"]), controller.meusRSOs);
router.post("/", protect(["user", "admin", "superadmin"]), controller.abrirRSO);

router.post("/:id/adicionar-policial", protect(["user","admin","superadmin"]), controller.adicionarPolicial);
router.post("/:id/apreensao", protect(["user","admin","superadmin"]), controller.adicionarApreensao);
router.put("/:id/observacoes", protect(["user","admin","superadmin"]), controller.atualizarObservacoes);

router.put("/:id/encerrar-policial/:cargo/:index", protect(["user","admin","superadmin"]), controller.encerrarPolicial);
router.put("/:id/encerrar", protect(["user","admin","superadmin"]), controller.encerrarRSO);

router.put("/:id/editar", protect(["user","admin","superadmin"]), controller.editarRSORejeitado);
router.put("/:id/reenviar", protect(["user","admin","superadmin"]), controller.reenviarRSO);

router.delete("/:id", protect(["user","admin","superadmin"]), controller.excluirMeuRSO);

router.put(
  "/:id/observacoes",
  protect(["user", "admin", "superadmin"]),
  controller.atualizarObservacoes
);


module.exports = router;
