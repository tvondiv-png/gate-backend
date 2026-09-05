const Advertencia = require("../models/Advertencia");
const User = require("../models/User");
const logAction = require("../utils/logAction");

// =========================
// ADM - LISTAR TODAS ATIVAS
// =========================
exports.listarAdvertencias = async (req, res) => {
  try {
    const advertencias = await Advertencia.find({ ativa: true }).sort({ createdAt: -1 });

    return res.json(advertencias);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao listar advertências" });
  }
};

// =========================
// USER - MINHA ADVERTÊNCIA
// =========================
exports.minhaAdvertencia = async (req, res) => {
  try {
    const advertencia = await Advertencia.findOne({
      policial: req.user.id,
      ativa: true
    }).sort({ createdAt: -1 });

    return res.json(advertencia || null);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao buscar advertência" });
  }
};

// =========================
// ADM - CRIAR OU ATUALIZAR (1 OU VÁRIOS)
// =========================
exports.criarOuAtualizarAdvertencia = async (req, res) => {
  try {
    const { funcional, funcionais, tipo, semanaReferencia } = req.body;

    const listaFuncionais = Array.isArray(funcionais)
      ? funcionais.map(Number).filter((n) => !Number.isNaN(n))
      : funcional
        ? [Number(funcional)].filter((n) => !Number.isNaN(n))
        : [];

    if (!listaFuncionais.length || !tipo || !semanaReferencia) {
      return res.status(400).json({
        message: "Funcional(ais), tipo e semana de referência são obrigatórios"
      });
    }

    const users = await User.find({
      funcional: { $in: listaFuncionais },
      ativo: true
    });

    if (!users.length) {
      return res.status(404).json({ message: "Nenhum policial encontrado" });
    }

    const resultados = [];

    for (const user of users) {
      let advertencia = await Advertencia.findOne({
        policial: user._id,
        ativa: true
      });

      if (advertencia) {
        advertencia.funcional = user.funcional;
        advertencia.nome = user.nome;
        advertencia.patente = user.patente || "-";
        advertencia.tipo = tipo;
        advertencia.semanaReferencia = semanaReferencia;
        advertencia.motivo =
          "Não cumprimento da carga mínima semanal de patrulhamento operacional.";

        await advertencia.save();

        await logAction({
          action: "ADVERTÊNCIA ATUALIZADA",
          performedBy: req.user.id,
          targetUser: user._id
        });

        resultados.push({
          _id: advertencia._id,
          policial: user._id,
          funcional: user.funcional,
          nome: user.nome,
          tipo: advertencia.tipo,
          semanaReferencia: advertencia.semanaReferencia,
          status: "atualizada"
        });

        continue;
      }

      advertencia = await Advertencia.create({
        policial: user._id,
        funcional: user.funcional,
        nome: user.nome,
        patente: user.patente || "-",
        tipo,
        semanaReferencia,
        motivo:
          "Não cumprimento da carga mínima semanal de patrulhamento operacional.",
        ativa: true,
        criadoPor: req.user.id
      });

      await logAction({
        action: "ADVERTÊNCIA CRIADA",
        performedBy: req.user.id,
        targetUser: user._id
      });

      resultados.push({
        _id: advertencia._id,
        policial: user._id,
        funcional: user.funcional,
        nome: user.nome,
        tipo: advertencia.tipo,
        semanaReferencia: advertencia.semanaReferencia,
        status: "criada"
      });
    }

    return res.status(201).json({
      message:
        resultados.length === 1
          ? "Advertência aplicada com sucesso"
          : `Advertências aplicadas com sucesso para ${resultados.length} policiais`,
      total: resultados.length,
      resultados
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao salvar advertência" });
  }
};

// =========================
// ADM - EXCLUIR / DESATIVAR (1)
// =========================
exports.excluirAdvertencia = async (req, res) => {
  try {
    const { id } = req.params;

    const advertencia = await Advertencia.findById(id);
    if (!advertencia) {
      return res.status(404).json({ message: "Advertência não encontrada" });
    }

    advertencia.ativa = false;
    await advertencia.save();

    await logAction({
      action: "ADVERTÊNCIA EXCLUÍDA",
      performedBy: req.user.id,
      targetUser: advertencia.policial
    });

    return res.json({ message: "Advertência removida com sucesso" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao excluir advertência" });
  }
};

// =========================
// ADM - EXCLUIR / DESATIVAR (EM LOTE)
// =========================
exports.excluirAdvertenciasEmLote = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({
        message: "Informe ao menos uma advertência para exclusão"
      });
    }

    const advertencias = await Advertencia.find({
      _id: { $in: ids },
      ativa: true
    });

    if (!advertencias.length) {
      return res.status(404).json({
        message: "Nenhuma advertência ativa encontrada"
      });
    }

    for (const advertencia of advertencias) {
      advertencia.ativa = false;
      await advertencia.save();

      await logAction({
        action: "ADVERTÊNCIA EXCLUÍDA",
        performedBy: req.user.id,
        targetUser: advertencia.policial
      });
    }

    return res.json({
      message: `${advertencias.length} advertência(s) removida(s) com sucesso`,
      total: advertencias.length
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erro ao excluir advertências em lote" });
  }
};