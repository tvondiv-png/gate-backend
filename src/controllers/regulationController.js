const Regulation = require(
  "../models/Regulation"
);

/* =========================================================
   PÚBLICO
========================================================= */

exports.listPublic = async (
  req,
  res
) => {
  try {
    const regs =
      await Regulation.find({
        publicado: true
      }).sort({
        categoria: 1,
        createdAt: -1
      });

    return res.json(regs);
  } catch (err) {
    console.error(
      "Erro ao listar regulamentos públicos:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar regulamentos"
    });
  }
};

/* =========================================================
   SUPERADMIN – LISTAR TODOS
========================================================= */

exports.listAdmin = async (
  req,
  res
) => {
  try {
    const regs =
      await Regulation.find().sort({
        categoria: 1,
        createdAt: -1
      });

    return res.json(regs);
  } catch (err) {
    console.error(
      "Erro ao listar regulamentos:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar regulamentos"
    });
  }
};

/* =========================================================
   SUPERADMIN – CRIAR
========================================================= */

exports.create = async (
  req,
  res
) => {
  try {
    const {
      titulo,
      descricao,
      conteudo,
      categoria,
      publicado
    } = req.body;

    if (!titulo?.trim()) {
      return res.status(400).json({
        message:
          "Título é obrigatório"
      });
    }

    const categoriasPermitidas = [
      "GERAL",
      "ROCAM"
    ];

    const categoriaFinal =
      categoriasPermitidas.includes(
        categoria
      )
        ? categoria
        : "GERAL";

    const reg =
      await Regulation.create({
        titulo:
          titulo.trim(),

        descricao:
          descricao || "",

        conteudo:
          conteudo || "",

        categoria:
          categoriaFinal,

        publicado:
          publicado === true ||
          publicado === "true",

        criadoPor:
          req.user.id
      });

    return res.status(201).json(reg);
  } catch (err) {
    console.error(
      "Erro ao criar regulamento:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao criar regulamento"
    });
  }
};

/* =========================================================
   SUPERADMIN – EDITAR
========================================================= */

exports.update = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const reg =
      await Regulation.findById(id);

    if (!reg) {
      return res.status(404).json({
        message:
          "Regulamento não encontrado"
      });
    }

    if (
      req.body.titulo !== undefined
    ) {
      reg.titulo =
        String(
          req.body.titulo
        ).trim();
    }

    if (
      req.body.descricao !== undefined
    ) {
      reg.descricao =
        req.body.descricao;
    }

    if (
      req.body.conteudo !== undefined
    ) {
      reg.conteudo =
        req.body.conteudo;
    }

    if (
      req.body.categoria !== undefined
    ) {
      if (
        ![
          "GERAL",
          "ROCAM"
        ].includes(
          req.body.categoria
        )
      ) {
        return res.status(400).json({
          message:
            "Categoria inválida"
        });
      }

      reg.categoria =
        req.body.categoria;
    }

    if (
      req.body.publicado !== undefined
    ) {
      reg.publicado =
        req.body.publicado === true ||
        req.body.publicado === "true";
    }

    await reg.save();

    return res.json(reg);
  } catch (err) {
    console.error(
      "Erro ao editar regulamento:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao editar regulamento"
    });
  }
};

/* =========================================================
   SUPERADMIN – EXCLUIR
========================================================= */

exports.remove = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const reg =
      await Regulation.findById(id);

    if (!reg) {
      return res.status(404).json({
        message:
          "Regulamento não encontrado"
      });
    }

    await reg.deleteOne();

    return res.json({
      message:
        "Regulamento excluído"
    });
  } catch (err) {
    console.error(
      "Erro ao excluir regulamento:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao excluir regulamento"
    });
  }
};