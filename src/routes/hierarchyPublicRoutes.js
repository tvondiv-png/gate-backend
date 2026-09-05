const express = require("express");
const router = express.Router();

const {
  getHierarchyPublic,
  getHierarchyPublicList
} = require("../controllers/hierarchyController");

// 🌐 Público agrupado
router.get("/", getHierarchyPublic);

// 🌐 Público em lista plana
router.get("/list", getHierarchyPublicList);

module.exports = router;