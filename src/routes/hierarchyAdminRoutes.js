const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const controller = require("../controllers/hierarchyAdminController");

router.get("/", protect(["admin", "superadmin"]), controller.listPolice);
router.put("/:id", protect(["admin", "superadmin"]), controller.updateHierarchy);

module.exports = router;
