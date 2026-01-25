const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

const {
  listMyNotifications,
  markAsRead
} = require("../controllers/notificationController");

// 🔔 Minhas notificações
router.get(
  "/me",
  protect(["user", "admin", "superadmin"]),
  listMyNotifications
);

// ✅ Marcar como lida
router.put(
  "/:id/read",
  protect(["user", "admin", "superadmin"]),
  markAsRead
);

module.exports = router;
