const express = require("express");
const router = express.Router();
const controller = require("../controllers/disciplinaryRulesController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect(["admin", "superadmin", "user"]), controller.listRules);

module.exports = router;