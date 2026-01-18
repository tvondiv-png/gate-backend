const express = require("express");
const router = express.Router();

console.log("✅ signupRoutes carregadas");

const signupController = require("../controllers/signupController");

// criar solicitação
router.post("/", signupController.create);

// listar solicitações
router.get("/", signupController.list);

// aprovar solicitação
router.put("/approve/:id", signupController.approve);

// rejeitar solicitação
router.put("/reject/:id", signupController.reject);

module.exports = router;
