const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/notificationController");

router.get(
  "/",
  protect(["user", "admin", "superadmin"]),
  controller.listMyNotifications
);

router.put(
  "/:id/read",
  protect(["user", "admin", "superadmin"]),
  controller.markAsRead
);

module.exports = router;