const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/absenceController");

router.post("/", protect(), controller.requestAbsence);

router.get("/", protect(["admin", "superadmin"]), controller.listAll);
router.post("/:id/approve", protect(["admin", "superadmin"]), controller.approve);
router.post("/:id/reject", protect(["admin", "superadmin"]), controller.reject);
router.delete("/:id", protect(["admin", "superadmin"]), controller.delete);

module.exports = router;
