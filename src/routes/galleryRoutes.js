const express = require("express");
const router = express.Router();

const upload = require("../middlewares/uploadGallery");
const {
  listPublic,
  listAdmin,
  create,
  update,
  remove
} = require("../controllers/galleryController");

const { protect } = require("../middlewares/authMiddleware");

// Público
router.get("/public", listPublic);

// Admin
router.get("/admin", protect(["admin", "superadmin"]), listAdmin);

router.post(
  "/",
  protect(["admin", "superadmin"]),
  upload.single("imagem"),
  create
);

router.put(
  "/:id",
  protect(["admin", "superadmin"]),
  update
);

// ❌ Excluir imagem (admin)
router.delete(
  "/:id",
  protect(["admin", "superadmin"]),
  remove
);

module.exports = router;
