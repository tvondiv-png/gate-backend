const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const xss = require("xss-clean");

const app = express();

// 🔥 CONFIAR NO NGINX / PROXY
app.set("trust proxy", true);

// ================= MIDDLEWARES BÁSICOS =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= CORS =================
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://gatebcrp.lat",
      "https://www.gatebcrp.lat"
    ],
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ================= SEGURANÇA =================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

app.use(xss());

// ✅ RATE LIMIT CORRETO (SEM keyGenerator)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false
  })
);

// ================= ROTAS =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/signup", require("./routes/signupRoutes"));
app.use("/api/hierarchy", require("./routes/hierarchyRoutes"));
app.use("/api/hierarchy/public", require("./routes/hierarchyPublicRoutes"));
app.use("/api/regulations", require("./routes/regulationRoutes"));
app.use("/api/gallery", require("./routes/galleryRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/absences", require("./routes/absenceRoutes"));
app.use("/api/superadmin", require("./routes/superAdminRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/ipm", require("./routes/ipmRoutes"));
app.use("/api/rso", require("./routes/rsoRoutes"));
app.use("/api/patrol-hours", require("./routes/patrolHoursRoutes"));
app.use("/api/admin/rso", require("./routes/rsoAdminRoutes"));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));
app.use("/api/discipline", require("./routes/disciplineRoutes"));
app.use("/api/indications", require("./routes/indicationRoutes"));
app.use("/api/admin/indications", require("./routes/indicationAdminRoutes"));
app.use("/api/apreensoes", require("./routes/seizureRoutes"));
app.use("/api/slideshow", require("./routes/homeSlideRoutes"));

// ================= UPLOADS =================
app.use("/uploads", express.static("uploads"));

// ================= TESTE =================
app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

module.exports = app;
