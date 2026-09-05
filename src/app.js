const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");

const app = express();

/* =========================================================
   PROXY
========================================================= */

app.set("trust proxy", 1);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true
  })
);

/* =========================================================
   CORS
========================================================= */

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",

    // Domínio atual em produção.
    // Depois podemos trocar quando mudar
    // definitivamente a identidade/domínio.
    "https://gatebcrp.lat",
    "https://www.gatebcrp.lat"
  ],

  credentials: false,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS"
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization"
  ],

  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.options(
  "*",
  cors(corsOptions)
);

/* =========================================================
   SEGURANÇA
========================================================= */

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

app.use(xss());

/* =========================================================
   RATE LIMIT
========================================================= */

app.use(
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    max: 1000,

    standardHeaders: true,

    legacyHeaders: false
  })
);

/* =========================================================
   AUTENTICAÇÃO / CADASTRO
========================================================= */

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/signup",
  require("./routes/signupRoutes")
);

/* =========================================================
   HIERARQUIA

   ÚNICA FONTE DA HIERARQUIA.

   Dentro de hierarchyRoutes.js ficam:

   GET /api/hierarchy
   GET /api/hierarchy/me

   GET /api/hierarchy/public
   GET /api/hierarchy/public/list

   GET /api/hierarchy/rocam
   GET /api/hierarchy/rocam/list

   PUT /api/hierarchy/:id
   DELETE /api/hierarchy/:id

   NÃO usamos mais hierarchyPublicRoutes.js.
========================================================= */

app.use(
  "/api/hierarchy",
  require("./routes/hierarchyRoutes")
);

/* =========================================================
   DISCIPLINA / ADVERTÊNCIAS / AUSÊNCIAS
========================================================= */

app.use(
  "/api/advertencias",
  require("./routes/advertenciaRoutes")
);

app.use(
  "/api/absences",
  require("./routes/absenceRoutes")
);

app.use(
  "/api/discipline",
  require("./routes/disciplineRoutes")
);

app.use(
  "/api/disciplinary-rules",
  require("./routes/disciplinaryRulesRoutes")
);

app.use(
  "/api/ipm",
  require("./routes/ipmRoutes")
);

/* =========================================================
   REGULAMENTOS / CÓDIGO PENAL
========================================================= */

app.use(
  "/api/regulations",
  require("./routes/regulationRoutes")
);

app.use(
  "/api/penal-code",
  require("./routes/penalCodeRoutes")
);

/* =========================================================
   GALERIA / SLIDESHOW
========================================================= */

app.use(
  "/api/gallery",
  require("./routes/galleryRoutes")
);

app.use(
  "/api/slideshow",
  require("./routes/homeSlideRoutes")
);

/* =========================================================
   NOTIFICAÇÕES
========================================================= */

app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);

/* =========================================================
   SUPERADMIN
========================================================= */

app.use(
  "/api/superadmin",
  require("./routes/superAdminRoutes")
);

/* =========================================================
   LOGS
========================================================= */

app.use(
  "/api/logs",
  require("./routes/logRoutes")
);

/* =========================================================
   RSO
========================================================= */

app.use(
  "/api/rso",
  require("./routes/rsoRoutes")
);

app.use(
  "/api/admin/rso",
  require("./routes/rsoAdminRoutes")
);

/* =========================================================
   HORAS DE PATRULHAMENTO
========================================================= */

app.use(
  "/api/patrol-hours",
  require("./routes/patrolHoursRoutes")
);

/* =========================================================
   DASHBOARD ADMIN
========================================================= */

app.use(
  "/api/admin/dashboard",
  require("./routes/adminDashboardRoutes")
);

/* =========================================================
   CONSULTA POLICIAL
========================================================= */

app.use(
  "/api/admin/consulta",
  require("./routes/consultaPolicialRoutes")
);

/* =========================================================
   INDICAÇÕES
========================================================= */

app.use(
  "/api/indications",
  require("./routes/indicationRoutes")
);

app.use(
  "/api/admin/indications",
  require("./routes/indicationAdminRoutes")
);

/* =========================================================
   APREENSÕES
========================================================= */

app.use(
  "/api/apreensoes",
  require("./routes/seizureRoutes")
);

/* =========================================================
   ESTÁGIOS / APRESENTAÇÕES
========================================================= */

app.use(
  "/api/apresentacoes-estagiarios",
  require("./routes/apresentacaoEstagiarioRoutes")
);

app.use(
  "/api/avaliacoes-estagio",
  require("./routes/avaliacaoEstagioRoutes")
);

/* =========================================================
   REQUISIÇÕES CADASTRAIS
========================================================= */

app.use(
  "/api/profile-update-requests",
  require("./routes/profileUpdateRequestRoutes")
);

/* =========================================================
   AÇÕES
========================================================= */

app.use(
  "/api/actions",
  require("./routes/actionRoutes")
);

app.use(
  "/api/admin/actions",
  require("./routes/actionAdminRoutes")
);

/* =========================================================
   CENTRO DE COMANDO
========================================================= */

app.use(
  "/api/comando",
  require("./routes/comandoRoutes")
);

app.use(
  "/api/rocam",
  require("./routes/rocamRoutes")
  );

app.use(
  "/api/comando/comunicado",
  require("./routes/comandoComunicadoRoutes")
);

app.use(
  "/api/high-command-notices",
  require("./routes/highCommandNoticeRoutes")
);

/* =========================================================
   DASHBOARD DO USUÁRIO
========================================================= */

app.use(
  "/api/user/dashboard",
  require("./routes/userDashboardRoutes")
);

/* =========================================================
   UPLOADS
========================================================= */

app.use(
  "/uploads",
  express.static("uploads")
);

/* =========================================================
   TESTE DA API
========================================================= */

app.get(
  "/api/test",
  (req, res) => {
    res.json({
      ok: true,
      sistema:
        "2º BPChq Anchieta"
    });
  }
);

module.exports = app;