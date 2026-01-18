const express = require("express");
const router = express.Router();

const controller = require("../controllers/homeSlideController");
const { protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/upload");

/**
 * 🌐 PÚBLICO
 */
router.get("/public", controller.listPublic);

/**
 * 🧑‍💼 ADMIN
 */
router.get(
  "/admin",
  protect(["admin", "superadmin"]),
  controller.listAdmin
);

router.post(
  "/admin",
  protect(["admin", "superadmin"]),
  upload.single("imagem"),
  controller.create
);

router.delete(
  "/admin/:id",
  protect(["admin", "superadmin"]),
  controller.remove
);

module.exports = router;
