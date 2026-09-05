const Hierarchy = require("../models/Hierarchy");
const RocamProfile = require("../models/RocamProfile");

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const FUNCOES_COMANDO_BATALHAO = [
  "Comando do Batalhão",
  "Subcomando do Batalhão"
];

const PAPEIS_ROCAM = [
  "COMANDO_ROCAM",
  "SUBCOMANDO_ROCAM",
  "BRACAL_ROCAM",
  "ESTAGIARIO_ROCAM"
];

const PAPEIS_COMANDO_ROCAM = [
  "COMANDO_ROCAM",
  "SUBCOMANDO_ROCAM"
];

/* =========================================================
   BUSCAR CONTEXTO ROCAM
========================================================= */

async function buscarContextoRocam(req) {
  const funcional = Number(
    req.user?.funcional
  );

  let hierarchy = null;
  let profile = null;

  if (funcional) {
    hierarchy =
      await Hierarchy.findOne({
        funcional
      }).lean();

    profile =
      await RocamProfile.findOne({
        funcional,
        ativo: true
      }).lean();
  }

  return {
    hierarchy,
    profile
  };
}

/* =========================================================
   ACESSO AO PAINEL ROCAM

   AUTORIZADOS:
   - Superadmin
   - Comando do Batalhão
   - Subcomando do Batalhão
   - Comando ROCAM
   - Subcomando ROCAM
   - Braçal ROCAM
   - Estagiário ROCAM
========================================================= */

exports.onlyRocam = async (
  req,
  res,
  next
) => {
  try {
    /* -----------------------------------------------------
       USUÁRIO PRECISA ESTAR AUTENTICADO
    ----------------------------------------------------- */

    if (!req.user) {
      return res.status(401).json({
        message:
          "Usuário não autenticado"
      });
    }

    /* -----------------------------------------------------
       SUPERADMIN TEM ACESSO TOTAL

       Importante:
       Superadmin NÃO precisa possuir
       RocamProfile.
    ----------------------------------------------------- */

    if (
      req.user.role === "superadmin"
    ) {
      req.rocamProfile = null;
      req.rocamHierarchy = null;

      return next();
    }

    /* -----------------------------------------------------
       BUSCAR HIERARQUIA E PERFIL ROCAM
    ----------------------------------------------------- */

    const {
      hierarchy,
      profile
    } =
      await buscarContextoRocam(
        req
      );

    /* -----------------------------------------------------
       COMANDO DO BATALHÃO
    ----------------------------------------------------- */

    const comandoBatalhao =
      FUNCOES_COMANDO_BATALHAO.includes(
        hierarchy?.funcao
      );

    /* -----------------------------------------------------
       MEMBRO ROCAM
    ----------------------------------------------------- */

    const membroRocam =
      profile?.ativo === true &&
      PAPEIS_ROCAM.includes(
        profile?.papelRocam
      );

    /* -----------------------------------------------------
       NEGAR ACESSO
    ----------------------------------------------------- */

    if (
      !comandoBatalhao &&
      !membroRocam
    ) {
      return res.status(403).json({
        message:
          "Acesso restrito ao efetivo ROCAM"
      });
    }

    /* -----------------------------------------------------
       DISPONIBILIZA CONTEXTO
       PARA OS PRÓXIMOS MIDDLEWARES/CONTROLLERS
    ----------------------------------------------------- */

    req.rocamProfile =
      profile || null;

    req.rocamHierarchy =
      hierarchy || null;

    return next();
  } catch (err) {
    console.error(
      "Erro onlyRocam:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao validar acesso ROCAM"
    });
  }
};

/* =========================================================
   ACESSO AO COMANDO ROCAM

   AUTORIZADOS:
   - Superadmin
   - Comando do Batalhão
   - Subcomando do Batalhão
   - Comando ROCAM
   - Subcomando ROCAM
========================================================= */

exports.onlyRocamCommand = async (
  req,
  res,
  next
) => {
  try {
    /* -----------------------------------------------------
       AUTENTICAÇÃO
    ----------------------------------------------------- */

    if (!req.user) {
      return res.status(401).json({
        message:
          "Usuário não autenticado"
      });
    }

    /* -----------------------------------------------------
       SUPERADMIN
    ----------------------------------------------------- */

    if (
      req.user.role === "superadmin"
    ) {
      req.rocamProfile = null;
      req.rocamHierarchy = null;

      return next();
    }

    /* -----------------------------------------------------
       CONTEXTO
    ----------------------------------------------------- */

    const {
      hierarchy,
      profile
    } =
      await buscarContextoRocam(
        req
      );

    /* -----------------------------------------------------
       COMANDO DO BATALHÃO
    ----------------------------------------------------- */

    const comandoBatalhao =
      FUNCOES_COMANDO_BATALHAO.includes(
        hierarchy?.funcao
      );

    /* -----------------------------------------------------
       COMANDO ROCAM
    ----------------------------------------------------- */

    const comandoRocam =
      profile?.ativo === true &&
      PAPEIS_COMANDO_ROCAM.includes(
        profile?.papelRocam
      );

    /* -----------------------------------------------------
       NEGAR
    ----------------------------------------------------- */

    if (
      !comandoBatalhao &&
      !comandoRocam
    ) {
      return res.status(403).json({
        message:
          "Acesso restrito ao Comando ROCAM"
      });
    }

    /* -----------------------------------------------------
       CONTEXTO DA REQUISIÇÃO
    ----------------------------------------------------- */

    req.rocamProfile =
      profile || null;

    req.rocamHierarchy =
      hierarchy || null;

    return next();
  } catch (err) {
    console.error(
      "Erro onlyRocamCommand:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao validar acesso do Comando ROCAM"
    });
  }
};