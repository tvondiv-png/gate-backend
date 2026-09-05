const express = require("express");
const router = express.Router();
const controller = require("../controllers/profileUpdateRequestController");
const { protect } = require("../middlewares/authMiddleware");

router.get(
  "/metadata",
  protect(["user", "admin", "superadmin"]),
  controller.getMetadata
);

router.get(
  "/mine",
  protect(["user", "admin", "superadmin"]),
  controller.listMine
);

router.post(
  "/",
  protect(["user", "admin", "superadmin"]),
  controller.create
);

router.get(
  "/admin",
  protect(["admin", "superadmin"]),
  controller.listAdmin
);

router.put(
  "/admin/:id/approve",
  protect(["admin", "superadmin"]),
  controller.approve
);

router.put(
  "/admin/:id/reject",
  protect(["admin", "superadmin"]),
  controller.reject
);

module.exports = router;