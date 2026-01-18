const express = require("express");
const router = express.Router();
const controller = require("../controllers/hierarchyPublicController");

router.get("/", controller.publicHierarchy);

module.exports = router;
