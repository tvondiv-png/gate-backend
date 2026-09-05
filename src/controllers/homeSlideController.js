const HomeSlide = require("../models/HomeSlide");

/* =========================================================
   🌐 PÚBLICO – SLIDES ATIVOS
========================================================= */

exports.listPublic = async (req, res) => {
  try {
    const slides = await HomeSlide.find({
      ativo: true
    }).sort({
      ordem: 1,
      createdAt: -1
    });

    return res.json(slides);
  } catch (err) {
    console.error(
      "Erro ao listar slides públicos:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar slideshow público"
    });
  }
};

/* =========================================================
   🧑‍💼 ADM – LISTAR TODOS
========================================================= */

exports.listAdmin = async (req, res) => {
  try {
    const slides = await HomeSlide.find().sort({
      ordem: 1,
      createdAt: -1
    });

    return res.json(slides);
  } catch (err) {
    console.error(
      "Erro ao listar slides:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar slideshow"
    });
  }
};

/* =========================================================
   🧑‍💼 ADM – CRIAR SLIDE
========================================================= */

exports.create = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message:
          "Imagem obrigatória"
      });
    }

    const slide = await HomeSlide.create({
      imagem:
        `/uploads/${req.file.filename}`,

      titulo:
        req.body.titulo || "",

      ordem:
        Number(req.body.ordem) || 0,

      ativo:
        req.body.ativo === undefined
          ? true
          : req.body.ativo === true ||
            req.body.ativo === "true"
    });

    return res.status(201).json(slide);
  } catch (err) {
    console.error(
      "Erro ao criar slide:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao criar slide"
    });
  }
};

/* =========================================================
   🧑‍💼 ADM – ATUALIZAR SLIDE
========================================================= */

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    const slide =
      await HomeSlide.findById(id);

    if (!slide) {
      return res.status(404).json({
        message:
          "Slide não encontrado"
      });
    }

    if (
      req.body.titulo !== undefined
    ) {
      slide.titulo =
        String(
          req.body.titulo
        ).trim();
    }

    if (
      req.body.ordem !== undefined
    ) {
      const ordem =
        Number(req.body.ordem);

      if (
        Number.isNaN(ordem)
      ) {
        return res.status(400).json({
          message:
            "Ordem inválida"
        });
      }

      slide.ordem = ordem;
    }

    if (
      req.body.ativo !== undefined
    ) {
      slide.ativo =
        req.body.ativo === true ||
        req.body.ativo === "true";
    }

    await slide.save();

    return res.json({
      message:
        "Slide atualizado com sucesso",

      slide
    });
  } catch (err) {
    console.error(
      "Erro ao atualizar slide:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao atualizar slide"
    });
  }
};

/* =========================================================
   🧑‍💼 ADM – EXCLUIR SLIDE
========================================================= */

exports.remove = async (req, res) => {
  try {
    const slide =
      await HomeSlide.findById(
        req.params.id
      );

    if (!slide) {
      return res.status(404).json({
        message:
          "Slide não encontrado"
      });
    }

    await slide.deleteOne();

    return res.json({
      message:
        "Slide removido com sucesso"
    });
  } catch (err) {
    console.error(
      "Erro ao remover slide:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao remover slide"
    });
  }
};