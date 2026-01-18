const express = require("express");
const router = express.Router();
const controller = require("../controllers/patrolHoursController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect(["admin", "superadmin"]), controller.listAll);
router.post("/reset-week", protect(["admin", "superadmin"]), controller.resetWeekly);
router.post("/reset-month", protect(["admin", "superadmin"]), controller.resetMonthly);

module.exports = router;
