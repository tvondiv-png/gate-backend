const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");

const app = express();

// ================= MIDDLEWARES BÁSICOS =================
app.use(express.json());

// 🔐 CORS CORRETO PARA DEV
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);
app.use(xss());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// ================= ROTAS =================
const authRoutes = require("./routes/authRoutes");
const signupRoutes = require("./routes/signupRoutes");
const hierarchyRoutes = require("./routes/hierarchyRoutes");
const hierarchyPublicRoutes = require("./routes/hierarchyPublicRoutes");
const regulationRoutes = require("./routes/regulationRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const absenceRoutes = require("./routes/absenceRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const logRoutes = require("./routes/logRoutes");
const ipmRoutes = require("./routes/ipmRoutes");
const rsoRoutes = require("./routes/rsoRoutes");
const patrolHoursRoutes = require("./routes/patrolHoursRoutes");
const rsoAdminRoutes = require("./routes/rsoAdminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const disciplineRoutes = require("./routes/disciplineRoutes");
const indicationRoutes = require("./routes/indicationRoutes");
const indicationAdminRoutes = require("./routes/indicationAdminRoutes");
const seizureRoutes = require("./routes/seizureRoutes");
const homeSlideRoutes = require("./routes/homeSlideRoutes");

// ================= REGISTRO =================
app.use("/api/auth", authRoutes);
app.use("/api/signup", signupRoutes);
app.use("/api/hierarchy", hierarchyRoutes);
app.use("/api/hierarchy/public", hierarchyPublicRoutes);
app.use("/api/regulations", regulationRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/absences", absenceRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ipm", ipmRoutes);
app.use("/api/rso", rsoRoutes);
app.use("/api/patrol-hours", patrolHoursRoutes);
app.use("/api/admin/rso", rsoAdminRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/discipline", disciplineRoutes);
app.use("/api/indications", indicationRoutes);
app.use("/api/admin/indications", indicationAdminRoutes);
app.use("/api/apreensoes", seizureRoutes);
app.use("/api/slideshow", homeSlideRoutes);

// ================= UPLOADS =================
app.use("/uploads", express.static("uploads"));

// ================= TESTE =================
app.get("/api/test", (req, res) => {
  res.json({ ok: true, origem: "app.js" });
});

module.exports = app;
