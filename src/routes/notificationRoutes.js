const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/notificationController");

router.get("/", protect(), controller.listMyNotifications);
router.post("/:id/read", protect(), controller.markAsRead);

module.exports = router;
