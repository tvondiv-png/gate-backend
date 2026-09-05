const ApresentacaoEstagiario = require("../models/ApresentacaoEstagiario");
const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");
const logAction = require("../utils/logAction");

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

// =========================
// USER - LISTA ESTAGIÁRIOS DA HIERARQUIA
// =========================
exports.listarEstagiariosDisponiveis = async (req, res) => {
  try {
    let lista = await Hierarchy.find({
      status: "Ativo",
      categoria: "ESTAGIARIOS"
    }).select("user funcional nome patente status categoria");

    if (!lista.length) {
      lista = await Hierarchy.find({
        status: "Ativo"
      }).select("user funcional nome patente status categoria");
    }

    const ordenada = [...lista].sort((a, b) => {
      const ordemA = ORDEM_PATENTES[a.patente] || 999;
      const ordemB = ORDEM_PATENTES[b.patente] || 999;

      if (ordemA !== ordemB) return ordemA - ordemB;
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });

    res.json(ordenada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar estagiários" });
  }
};

// =========================
// USER - REGISTRAR APRESENTAÇÃO
// =========================
exports.criarApresentacao = async (req, res) => {
  try {
    const { funcionalEstagiario, observacao } = req.body;

    if (!funcionalEstagiario) {
      return res.status(400).json({
        message: "Selecione o estagiário"
      });
    }

    const estagiarioHierarchy = await Hierarchy.findOne({
      funcional: Number(funcionalEstagiario),
      status: "Ativo"
    });

    if (!estagiarioHierarchy) {
      return res.status(404).json({
        message: "Estagiário não encontrado na hierarquia"
      });
    }

    const estagiarioUser = await User.findOne({
      funcional: Number(funcionalEstagiario)
    });

    const jaExiste = await ApresentacaoEstagiario.findOne({
      apresentadoPor: req.user.id,
      funcionalEstagiario: Number(funcionalEstagiario),
      status: "Enviado"
    });

    if (jaExiste) {
      return res.status(400).json({
        message: "Já existe uma apresentação pendente para este estagiário"
      });
    }

    const registro = await ApresentacaoEstagiario.create({
      apresentadoPor: req.user.id,
      funcionalApresentador: req.user.funcional,
      nomeApresentador: req.user.nome,
      patenteApresentador: req.user.patente || "-",

      policialApresentado: estagiarioUser?._id || null,
      funcionalEstagiario: estagiarioHierarchy.funcional,
      nomeEstagiario: estagiarioHierarchy.nome,
      patenteEstagiario: estagiarioHierarchy.patente,

      observacao: observacao || "",
      comentarioAdmin: "",
      status: "Enviado",
      dataApresentacao: new Date()
    });

    await logAction({
      action: "APRESENTAÇÃO DE ESTAGIÁRIO REGISTRADA",
      performedBy: req.user.id,
      targetUser: estagiarioUser?._id || null,
      details: `Apresentador: ${req.user.nome} | Estagiário: ${estagiarioHierarchy.nome}`
    });

    res.status(201).json(registro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao registrar apresentação" });
  }
};

// =========================
// USER - MINHAS APRESENTAÇÕES
// =========================
exports.minhasApresentacoes = async (req, res) => {
  try {
    const lista = await ApresentacaoEstagiario.find({
      apresentadoPor: req.user.id
    }).sort({ createdAt: -1 });

    res.json(lista);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar minhas apresentações" });
  }
};

// =========================
// ADM - LISTAR TODAS
// =========================
exports.listarTodas = async (req, res) => {
  try {
    const lista = await ApresentacaoEstagiario.find().sort({ createdAt: -1 });
    res.json(lista);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao listar apresentações" });
  }
};

// =========================
// ADM - VALIDAR
// =========================
exports.validar = async (req, res) => {
  try {
    const registro = await ApresentacaoEstagiario.findById(req.params.id);

    if (!registro) {
      return res.status(404).json({ message: "Registro não encontrado" });
    }

    if (registro.status === "Validado") {
      return res.status(400).json({ message: "Esta apresentação já foi validada" });
    }

    registro.status = "Validado";
    registro.validadoPor = req.user.id;
    registro.nomeValidador = req.user.nome;
    registro.dataValidacao = new Date();
    registro.comentarioAdmin = "";

    await registro.save();

    await logAction({
      action: "APRESENTAÇÃO DE ESTAGIÁRIO VALIDADA",
      performedBy: req.user.id,
      targetUser: registro.apresentadoPor,
      details: `Estagiário validado: ${registro.nomeEstagiario}`
    });

    res.json(registro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao validar apresentação" });
  }
};

// =========================
// ADM - REJEITAR
// =========================
exports.rejeitar = async (req, res) => {
  try {
    const { comentario } = req.body;

    const registro = await ApresentacaoEstagiario.findById(req.params.id);

    if (!registro) {
      return res.status(404).json({ message: "Registro não encontrado" });
    }

    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ message: "Informe o motivo da rejeição" });
    }

    registro.status = "Rejeitado";
    registro.validadoPor = req.user.id;
    registro.nomeValidador = req.user.nome;
    registro.dataValidacao = new Date();
    registro.comentarioAdmin = comentario.trim();

    await registro.save();

    await logAction({
      action: "APRESENTAÇÃO DE ESTAGIÁRIO REJEITADA",
      performedBy: req.user.id,
      targetUser: registro.apresentadoPor,
      details: `Estagiário rejeitado: ${registro.nomeEstagiario} | Motivo: ${comentario.trim()}`
    });

    res.json(registro);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao rejeitar apresentação" });
  }
};

// =========================
// ADM - EXCLUIR
// =========================
exports.excluir = async (req, res) => {
  try {
    const registro = await ApresentacaoEstagiario.findById(req.params.id);

    if (!registro) {
      return res.status(404).json({ message: "Registro não encontrado" });
    }

    await ApresentacaoEstagiario.findByIdAndDelete(req.params.id);

    await logAction({
      action: "APRESENTAÇÃO DE ESTAGIÁRIO EXCLUÍDA",
      performedBy: req.user.id,
      targetUser: registro.apresentadoPor,
      details: `Estagiário excluído: ${registro.nomeEstagiario}`
    });

    res.json({ message: "Apresentação excluída com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao excluir apresentação" });
  }
};