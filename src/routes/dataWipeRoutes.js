const express = require("express");
const router = express.Router();

const controller = require("../controllers/dataWipeController");
const { protect } = require("../middlewares/authMiddleware");

router.use(protect(["superadmin"]));

router.get("/", controller.getContagens);
router.post("/", controller.limpar);

module.exports = router;
