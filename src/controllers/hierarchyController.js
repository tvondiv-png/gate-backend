const Hierarchy = require("../models/Hierarchy");
const User = require("../models/User");
const hierarchyRules = require("../utils/hierarchyRules");
const logAction = require("../utils/logAction");

/* ==========================
   NORMALIZA CATEGORIA
========================== */
const normalizarCategoria = (categoria) => {
  if (!categoria) return categoria;

  return categoria
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, "_");
};

/* ==========================
   NORMALIZA QUALIFICAÇÃO ROCAM
========================== */
const normalizarQualificacaoRocam = (valor) => {
  if (!valor) return "NENHUM";

  const normalizado = String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "_");

  if (
    normalizado === "BRACAL_ROCAM" ||
    normalizado === "BRACAL" ||
    normalizado === "BRACALROCAM"
  ) {
    return "BRACAL_ROCAM";
  }

  if (
    normalizado === "ESTAGIARIO_ROCAM" ||
    normalizado === "ESTAGIARIO" ||
    normalizado === "ESTAGIARIOROCAM"
  ) {
    return "ESTAGIARIO_ROCAM";
  }

  return "NENHUM";
};

/* ==========================
   CONVERTE DATA YYYY-MM-DD
========================== */
const parseDateOnly = (valor) => {
  if (!valor) return null;

  const [ano, mes, dia] = String(valor)
    .split("-")
    .map(Number);

  if (!ano || !mes || !dia) return null;

  return new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia,
      12,
      0,
      0
    )
  );
};

/* ==========================
   ORDEM DAS PATENTES
========================== */
const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

/* ==========================
   ORDENA POLICIAIS
========================== */
const ordenarPoliciais = (lista) => {
  return [...lista].sort((a, b) => {
    const ordemA =
      ORDEM_PATENTES[a.patente] || 999;

    const ordemB =
      ORDEM_PATENTES[b.patente] || 999;

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    return String(a.nome || "")
      .localeCompare(
        String(b.nome || ""),
        "pt-BR"
      );
  });
};

/* ==========================
   ADM – LISTAR USUÁRIOS/POLICIAIS

   Mantém os dados do User e acrescenta
   qualificacaoRocam vinda da Hierarchy.
========================== */
exports.listPolice = async (req, res) => {
  try {
    const users = await User.find({
      ativo: true
    })
      .sort({ funcional: 1 })
      .lean();

    const funcionais = users
      .map((u) => Number(u.funcional))
      .filter(Boolean);

    const registrosHierarquia =
      await Hierarchy.find({
        funcional: { $in: funcionais }
      })
        .select(
          "funcional qualificacaoRocam"
        )
        .lean();

    const mapaRocam = new Map();

    registrosHierarquia.forEach((h) => {
      mapaRocam.set(
        Number(h.funcional),
        h.qualificacaoRocam || "NENHUM"
      );
    });

    const resultado = users.map((u) => ({
      ...u,

      qualificacaoRocam:
        mapaRocam.get(
          Number(u.funcional)
        ) || "NENHUM"
    }));

    return res.json(resultado);
  } catch (err) {
    console.error(
      "Erro ao listar policiais:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao listar policiais"
    });
  }
};

/* ==========================
   USUÁRIO – MINHA HIERARQUIA
========================== */
exports.getMinhaHierarquia = async (
  req,
  res
) => {
  try {
    const hierarchy =
      await Hierarchy.findOne({
        funcional: req.user.funcional,
        status: "Ativo"
      });

    if (!hierarchy) {
      return res.status(404).json({
        message:
          "Hierarquia não encontrada"
      });
    }

    return res.json(hierarchy);
  } catch (err) {
    console.error(
      "Erro ao buscar minha hierarquia:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao buscar hierarquia"
    });
  }
};

/* ==========================
   PÚBLICO – HIERARQUIA AGRUPADA
========================== */
exports.getHierarchyPublic = async (
  req,
  res
) => {
  try {
    const hierarchy =
      await Hierarchy.find({
        status: "Ativo"
      })
        .select(
          [
            "user",
            "funcional",
            "nome",
            "patente",
            "categoria",
            "funcao",
            "qualificacaoRocam",
            "status",
            "cursos",
            "medalhas",
            "dataEntrada",
            "dataUltimaPromocao",
            "cor"
          ].join(" ")
        )
        .lean();

    const agrupado = {};

    hierarchy.forEach((h) => {
      const categoria =
        normalizarCategoria(
          h.categoria
        );

      if (!agrupado[categoria]) {
        agrupado[categoria] = {
          categoria,
          cor: h.cor || "",
          total: 0,
          membros: []
        };
      }

      agrupado[categoria].total++;

      agrupado[categoria].membros.push({
        _id: h._id,

        user:
          h.user || null,

        funcional:
          h.funcional,

        nome:
          h.nome,

        patente:
          h.patente,

        categoria:
          h.categoria,

        funcao:
          h.funcao || "",

        qualificacaoRocam:
          h.qualificacaoRocam ||
          "NENHUM",

        status:
          h.status,

        cursos:
          h.cursos || [],

        medalhas:
          h.medalhas || [],

        dataEntrada:
          h.dataEntrada || null,

        dataUltimaPromocao:
          h.dataUltimaPromocao ||
          null,

        cor:
          h.cor || ""
      });
    });

    Object.values(agrupado).forEach(
      (grupo) => {
        grupo.membros =
          ordenarPoliciais(
            grupo.membros
          );
      }
    );

    return res.json(agrupado);
  } catch (err) {
    console.error(
      "Erro hierarquia pública:",
      err
    );

    return res.status(500).json({
      message:
        "Erro hierarquia pública"
    });
  }
};

/* ==========================
   PÚBLICO – HIERARQUIA
   EM LISTA
========================== */
exports.getHierarchyPublicList =
  async (req, res) => {
    try {
      const hierarchy =
        await Hierarchy.find({
          status: "Ativo",
          user: { $ne: null }
        })
          .select(
            [
              "user",
              "funcional",
              "nome",
              "patente",
              "categoria",
              "funcao",
              "qualificacaoRocam",
              "status",
              "dataEntrada",
              "dataUltimaPromocao",
              "cursos",
              "medalhas"
            ].join(" ")
          )
          .lean();

      const lista = hierarchy
        .filter(
          (item) => item.user
        )
        .map((item) => ({
          _id:
            item._id,

          user:
            item.user,

          funcional:
            item.funcional,

          nome:
            item.nome,

          patente:
            item.patente,

          categoria:
            item.categoria,

          funcao:
            item.funcao || "",

          qualificacaoRocam:
            item.qualificacaoRocam ||
            "NENHUM",

          status:
            item.status,

          dataEntrada:
            item.dataEntrada || null,

          dataUltimaPromocao:
            item.dataUltimaPromocao ||
            null,

          cursos:
            item.cursos || [],

          medalhas:
            item.medalhas || []
        }));

      return res.json(
        ordenarPoliciais(lista)
      );
    } catch (err) {
      console.error(
        "Erro ao carregar lista pública da hierarquia:",
        err
      );

      return res.status(500).json({
        message:
          "Erro ao carregar lista pública da hierarquia"
      });
    }
  };

/* ==========================
   ROCAM – HIERARQUIA PÚBLICA

   Retorna SOMENTE:
   - BRAÇAL ROCAM
   - ESTAGIÁRIO ROCAM
========================== */
exports.getHierarchyRocam =
  async (req, res) => {
    try {
      const hierarchy =
        await Hierarchy.find({
          status: "Ativo",

          qualificacaoRocam: {
            $in: [
              "BRACAL_ROCAM",
              "ESTAGIARIO_ROCAM"
            ]
          }
        })
          .select(
            [
              "user",
              "funcional",
              "nome",
              "patente",
              "categoria",
              "funcao",
              "qualificacaoRocam",
              "status"
            ].join(" ")
          )
          .lean();

      const bracais =
        ordenarPoliciais(
          hierarchy.filter(
            (h) =>
              h.qualificacaoRocam ===
              "BRACAL_ROCAM"
          )
        );

      const estagiarios =
        ordenarPoliciais(
          hierarchy.filter(
            (h) =>
              h.qualificacaoRocam ===
              "ESTAGIARIO_ROCAM"
          )
        );

      return res.json({
        total:
          hierarchy.length,

        bracais: {
          titulo:
            "Braçal ROCAM",

          total:
            bracais.length,

          membros:
            bracais
        },

        estagiarios: {
          titulo:
            "Estagiário ROCAM",

          total:
            estagiarios.length,

          membros:
            estagiarios
        }
      });
    } catch (err) {
      console.error(
        "Erro ao carregar Hierarquia ROCAM:",
        err
      );

      return res.status(500).json({
        message:
          "Erro ao carregar Hierarquia ROCAM"
      });
    }
  };

/* ==========================
   ROCAM – LISTA PLANA

   Esta rota será muito útil
   para o RSO ROCAM.
========================== */
exports.getHierarchyRocamList =
  async (req, res) => {
    try {
      const hierarchy =
        await Hierarchy.find({
          status: "Ativo",

          qualificacaoRocam: {
            $in: [
              "BRACAL_ROCAM",
              "ESTAGIARIO_ROCAM"
            ]
          }
        })
          .select(
            [
              "user",
              "funcional",
              "nome",
              "patente",
              "categoria",
              "funcao",
              "qualificacaoRocam",
              "status"
            ].join(" ")
          )
          .lean();

      const lista =
        ordenarPoliciais(
          hierarchy.map((h) => ({
            _id:
              h._id,

            user:
              h.user || null,

            funcional:
              h.funcional,

            nome:
              h.nome,

            patente:
              h.patente,

            categoria:
              h.categoria,

            funcao:
              h.funcao || "",

            qualificacaoRocam:
              h.qualificacaoRocam,

            status:
              h.status
          }))
        );

      return res.json(lista);
    } catch (err) {
      console.error(
        "Erro ao carregar lista ROCAM:",
        err
      );

      return res.status(500).json({
        message:
          "Erro ao carregar lista ROCAM"
      });
    }
  };

/* ==========================
   ADM – LISTAR TODA
   HIERARQUIA
========================== */
exports.listHierarchy = async (
  req,
  res
) => {
  try {
    const hierarchy =
      await Hierarchy.find()
        .select(
          [
            "user",
            "funcional",
            "nome",
            "patente",
            "categoria",
            "funcao",
            "qualificacaoRocam",
            "status",
            "cursos",
            "medalhas",
            "dataEntrada",
            "dataUltimaPromocao",
            "cor"
          ].join(" ")
        )
        .sort({
          funcional: 1
        })
        .lean();

    return res.json(hierarchy);
  } catch (err) {
    console.error(
      "Erro ao listar hierarquia:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao listar hierarquia"
    });
  }
};

/* ==========================
   ADM – ATUALIZAR HIERARQUIA
========================== */
exports.updateHierarchy = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      nome,
      funcional,
      categoriaHierarquia,
      patente,
      funcao,

      // NOVO
      qualificacaoRocam,

      status,
      dataEntrada,
      dataUltimaPromocao,
      cursos,
      medalhas,
      houvePromocao
    } = req.body;

    const user =
      await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message:
          "Usuário não encontrado"
      });
    }

    /*
     * Buscamos a Hierarchy atual
     * antes de atualizar.
     *
     * Isso é importante para
     * preservar qualificacaoRocam
     * caso o frontend ADM antigo
     * ainda não envie esse campo.
     */
    const hierarchyAtual =
      await Hierarchy.findOne({
        user: user._id
      });

    const qualificacaoAtual =
      hierarchyAtual
        ?.qualificacaoRocam ||
      "NENHUM";

    const qualificacaoFinal =
      qualificacaoRocam === undefined ||
      qualificacaoRocam === null ||
      qualificacaoRocam === ""
        ? qualificacaoAtual
        : normalizarQualificacaoRocam(
            qualificacaoRocam
          );

    const dataPromocaoAnterior =
      user.dataUltimaPromocao
        ? user.dataUltimaPromocao
            .toISOString()
            .slice(0, 10)
        : null;

    const novaDataPromocao =
      dataUltimaPromocao || null;

    /* ==========================
       ATUALIZA USER

       Mantemos exatamente os
       campos que já existiam.
    ========================== */

    user.nome = nome;

    user.funcional =
      funcional;

    user.categoriaHierarquia =
      normalizarCategoria(
        categoriaHierarquia
      );

    user.patente =
      patente;

    user.funcao =
      funcao;

    user.status =
      status;

    user.dataEntrada =
      parseDateOnly(
        dataEntrada
      );

    user.cursos =
      Array.isArray(cursos)
        ? cursos
        : [];

    user.medalhas =
      Array.isArray(medalhas)
        ? medalhas
        : [];

    /* ==========================
       PROMOÇÃO
    ========================== */

    if (houvePromocao === true) {
      user.dataUltimaPromocao =
        new Date();

      user.resetAcoesPorPromocao =
        true;

      user.dataResetAcoesPorPromocao =
        new Date();
    } else {
      user.dataUltimaPromocao =
        parseDateOnly(
          dataUltimaPromocao
        );

      if (
        novaDataPromocao &&
        novaDataPromocao !==
          dataPromocaoAnterior
      ) {
        user.resetAcoesPorPromocao =
          true;

        user.dataResetAcoesPorPromocao =
          new Date();
      }
    }

    await user.save();

    /* ==========================
       ATUALIZA HIERARQUIA

       É aqui que a ROCAM fica
       armazenada.
    ========================== */

    const hierarchyAtualizada =
      await Hierarchy.findOneAndUpdate(
        {
          user: user._id
        },
        {
          user:
            user._id,

          funcional:
            user.funcional,

          nome:
            user.nome,

          patente:
            user.patente,

          categoria:
            user.categoriaHierarquia,

          funcao:
            user.funcao,

          qualificacaoRocam:
            qualificacaoFinal,

          status:
            user.status,

          cursos:
            user.cursos || [],

          medalhas:
            user.medalhas || [],

          dataEntrada:
            user.dataEntrada || null,

          dataUltimaPromocao:
            user.dataUltimaPromocao ||
            null
        },
        {
          new: true,
          upsert: true
        }
      );

    await logAction({
      action:
        "ATUALIZAÇÃO DE HIERARQUIA",

      performedBy:
        req.user.id,

      targetUser:
        user._id,

      details:
        `Qualificação ROCAM: ${qualificacaoFinal}`
    });

    /*
     * Retornamos os dados do User
     * + a qualificação ROCAM.
     *
     * Assim o frontend ADM poderá
     * enxergar o novo campo mesmo
     * sem ele existir no User.js.
     */
    return res.json({
      ...user.toObject(),

      qualificacaoRocam:
        hierarchyAtualizada
          ?.qualificacaoRocam ||
        qualificacaoFinal
    });
  } catch (err) {
    console.error(
      "Erro ao atualizar hierarquia:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao atualizar hierarquia"
    });
  }
};

/* ==========================
   ADM – DELETAR HIERARQUIA
========================== */
exports.deleteHierarchy = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const hierarchy =
      await Hierarchy.findOne({
        user: id
      });

    if (!hierarchy) {
      return res.status(404).json({
        message:
          "Hierarquia não encontrada"
      });
    }

    await hierarchy.deleteOne();

    return res.json({
      message:
        "Registro removido da hierarquia"
    });
  } catch (err) {
    console.error(
      "Erro ao deletar hierarquia:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao deletar hierarquia"
    });
  }
};