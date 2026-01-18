const express = require("express");
const router = express.Router();

const {
  listPublic,
  listAdmin,
  create,
  update,
  remove
} = require("../controllers/regulationController");

const { protect } = require("../middlewares/authMiddleware");

// 🔓 Público
router.get("/public", listPublic);

// 🔐 SuperAdmin
router.get("/admin", protect(["superadmin"]), listAdmin);
router.post("/", protect(["superadmin"]), create);
router.put("/:id", protect(["superadmin"]), update);
router.delete("/:id", protect(["superadmin"]), remove);

module.exports = router;
