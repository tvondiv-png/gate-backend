const SignupRequest = require("../models/SignupRequest");
const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");
const bcrypt = require("bcryptjs");
const { syncFromHierarchy } = require("../services/patrolHoursSyncService");

// ===============================
// CRIAR SOLICITAÇÃO
// ===============================
exports.create = async (req, res) => {
  try {
    const { nome, funcional, email } = req.body;

    if (!nome || !funcional || !email) {
      return res.status(400).json({
        message: "Dados incompletos"
      });
    }

    const exists = await SignupRequest.findOne({
      funcional
    });

    if (exists) {
      return res.status(400).json({
        message: "Solicitação já existente"
      });
    }

    const request = await SignupRequest.create({
      nome,
      funcional,
      email,
      status: "Pendente"
    });

    return res.status(201).json({
      message: "Solicitação enviada com sucesso",
      request
    });
  } catch (err) {
    console.error("Erro create signup:", err);

    return res.status(500).json({
      message: "Erro interno"
    });
  }
};

// ===============================
// LISTAR SOLICITAÇÕES (ADMIN)
// ===============================
exports.list = async (req, res) => {
  try {
    const requests = await SignupRequest.find({
      status: "Pendente"
    }).sort({
      createdAt: 1
    });

    return res.json(requests);
  } catch (err) {
    console.error("Erro list signup:", err);

    return res.status(500).json({
      message: "Erro ao listar solicitações"
    });
  }
};

// ===============================
// APROVAR SOLICITAÇÃO (ADMIN)
// ===============================
exports.approve = async (req, res) => {
  try {
    const request = await SignupRequest.findById(
      req.params.id
    );

    if (!request) {
      return res.status(404).json({
        message: "Solicitação não encontrada"
      });
    }

    // ===============================
    // EVITA DUPLICIDADE
    // ===============================
    const userExists = await User.findOne({
      funcional: request.funcional
    });

    if (userExists) {
      await SignupRequest.findByIdAndDelete(
        request._id
      );

      return res.status(400).json({
        message:
          "Já existe usuário com essa funcional"
      });
    }

    const hierarchyExists =
      await Hierarchy.findOne({
        funcional: request.funcional
      });

    if (hierarchyExists) {
      await SignupRequest.findByIdAndDelete(
        request._id
      );

      return res.status(400).json({
        message:
          "Já existe registro de hierarquia com essa funcional"
      });
    }

    // ===============================
    // DATA DE ENTRADA
    // ===============================
    const dataEntrada = new Date();

    // ===============================
    // SENHA PADRÃO
    // ===============================
    const senhaHash = await bcrypt.hash(
      "123456",
      10
    );

    // ===============================
    // CRIA USUÁRIO
    // ===============================
    const user = await User.create({
      nome: request.nome,
      funcional: request.funcional,
      email: request.email,
      senha: senhaHash,

      role: "user",

      patente:
        "Soldado 2ª Classe PM",

      ativo: true,

      // opcional, caso seu User possua esse campo
      dataEntrada
    });

    // ===============================
    // CRIA HIERARQUIA
    // ===============================
    const hierarchy =
      await Hierarchy.create({
        user: user._id,

        funcional:
          request.funcional,

        nome:
          request.nome,

        patente:
          "Soldado 2ª Classe PM",

        categoria:
          "ESTAGIARIOS",

        funcao:
          "Operacional",

        status:
          "Ativo",

        cursos: [],

        medalhas: [],

        qualificacaoRocam:
          "NENHUM",

        // ✅ preenchido automaticamente
        dataEntrada,

        dataUltimaPromocao:
          null
      });

    // ===============================
    // SINCRONIZA COM HORAS
    // ===============================
    await syncFromHierarchy(
      hierarchy
    );

    // ===============================
    // REMOVE SOLICITAÇÃO
    // ===============================
    await SignupRequest.findByIdAndDelete(
      request._id
    );

    return res.json({
      message:
        "Solicitação aprovada com sucesso",

      user: {
        id: user._id,
        funcional:
          user.funcional,
        nome:
          user.nome
      },

      hierarchy: {
        id: hierarchy._id,
        funcional:
          hierarchy.funcional,
        dataEntrada:
          hierarchy.dataEntrada
      }
    });
  } catch (err) {
    console.error(
      "🔥 ERRO AO APROVAR SOLICITAÇÃO"
    );

    console.error(err);

    return res.status(500).json({
      message:
        "Erro ao aprovar solicitação"
    });
  }
};

// ===============================
// REJEITAR SOLICITAÇÃO (ADMIN)
// ===============================
exports.reject = async (req, res) => {
  try {
    const request =
      await SignupRequest.findById(
        req.params.id
      );

    if (!request) {
      return res.status(404).json({
        message:
          "Solicitação não encontrada"
      });
    }

    request.status =
      "Rejeitada";

    await request.save();

    return res.json({
      message:
        "Solicitação rejeitada"
    });
  } catch (err) {
    console.error(
      "Erro ao rejeitar:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao rejeitar solicitação"
    });
  }
};