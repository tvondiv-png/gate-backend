const PatrolHours = require("../models/PatrolHours");
const RSO = require("../models/RSO");
const SignupRequest = require("../models/SignupRequest");
const Absence = require("../models/Absence");
const Hierarchy = require("../models/Hierarchy");
const ApresentacaoEstagiario = require("../models/ApresentacaoEstagiario");
const Advertencia = require("../models/Advertencia");
const AvaliacaoEstagio = require("../models/AvaliacaoEstagio");
const ProfileUpdateRequest = require("../models/ProfileUpdateRequest");

exports.getDashboardData = async (req, res) => {
  try {
    // =========================
    // HORAS
    // =========================
    const horas = await PatrolHours.find();

    const totalMinutosMes = horas.reduce((total, h) => {
      return total + (h.horasMesMin || 0);
    }, 0);

    const totalMinutosSemana = horas.reduce((total, h) => {
      return total + (h.horasSemanaMin || 0);
    }, 0);

    // =========================
    // POLICIAL DESTAQUE DO MÊS
    // =========================
    const destaque = await PatrolHours.findOne().sort({ horasMesMin: -1 });

    let policialDestaque = null;

    if (destaque) {
      const hier = await Hierarchy.findOne({
        funcional: destaque.funcional
      });

      policialDestaque = {
        funcional: destaque.funcional,
        nome: destaque.nome,
        patente: hier?.patente || destaque.patente,
        horas: destaque.horasMesMin
      };
    }

    // =========================
    // POLICIAL DESTAQUE DA SEMANA
    // =========================
    const destaqueSemana = await PatrolHours.findOne().sort({ horasSemanaMin: -1 });

    let policialDestaqueSemana = null;

    if (destaqueSemana) {
      const hier = await Hierarchy.findOne({
        funcional: destaqueSemana.funcional
      });

      policialDestaqueSemana = {
        funcional: destaqueSemana.funcional,
        nome: destaqueSemana.nome,
        patente: hier?.patente || destaqueSemana.patente,
        horas: destaqueSemana.horasSemanaMin
      };
    }

    // =========================
    // TOP 3 POLICIAIS DO MÊS
    // =========================
    const topHorasMes = await PatrolHours.find()
      .sort({ horasMesMin: -1 })
      .limit(3);

    const topPoliciais = await Promise.all(
      topHorasMes.map(async (item) => {
        const hier = await Hierarchy.findOne({
          funcional: item.funcional
        });

        return {
          funcional: item.funcional,
          nome: item.nome,
          patente: hier?.patente || item.patente,
          horas: item.horasMesMin || 0
        };
      })
    );

    // =========================
    // TOP 3 POLICIAIS DA SEMANA
    // =========================
    const topHorasSemana = await PatrolHours.find()
      .sort({ horasSemanaMin: -1 })
      .limit(3);

    const topPoliciaisSemana = await Promise.all(
      topHorasSemana.map(async (item) => {
        const hier = await Hierarchy.findOne({
          funcional: item.funcional
        });

        return {
          funcional: item.funcional,
          nome: item.nome,
          patente: hier?.patente || item.patente,
          horas: item.horasSemanaMin || 0
        };
      })
    );

    // =========================
    // PENDÊNCIAS
    // =========================
    const rsos = await RSO.countDocuments({ status: "Pendente" });
    const cadastros = await SignupRequest.countDocuments({ status: "Pendente" });
    const ausencias = await Absence.countDocuments({ status: "Pendente" });
    const apresentacoes = await ApresentacaoEstagiario.countDocuments({
      status: "Enviado"
    });
    const advertencias = await Advertencia.countDocuments({ ativa: true });
    const avaliacoesEstagio = await AvaliacaoEstagio.countDocuments({
      status: { $in: ["Pendente", "Revisao"] }
    });
    const requisicoesCadastraisPendentes = await ProfileUpdateRequest.countDocuments({
      status: "PENDENTE"
    });

    const pendencias = {
      rsos,
      cadastros,
      ausencias,
      apresentacoes,
      advertencias,
      avaliacoesEstagio,
      requisicoesCadastrais: requisicoesCadastraisPendentes
    };

    // =========================
    // ÚLTIMAS MOVIMENTAÇÕES
    // =========================
    const ultimoRSO = await RSO.findOne().sort({ createdAt: -1 });
    const ultimaAusencia = await Absence.findOne().sort({ createdAt: -1 });
    const ultimoCadastro = await SignupRequest.findOne().sort({ createdAt: -1 });
    const ultimaApresentacao = await ApresentacaoEstagiario.findOne().sort({
      createdAt: -1
    });
    const ultimaAdvertencia = await Advertencia.findOne().sort({ createdAt: -1 });
    const ultimaRequisicaoCadastral = await ProfileUpdateRequest.findOne().sort({
      createdAt: -1
    });

    const movimentacoes = [
      ultimoRSO
        ? {
            tipo: "RSO",
            titulo: `RSO registrado: ${ultimoRSO.viatura || "-"}`,
            data: ultimoRSO.createdAt
          }
        : null,

      ultimaAusencia
        ? {
            tipo: "Ausência",
            titulo: "Nova solicitação de ausência registrada",
            data: ultimaAusencia.createdAt
          }
        : null,

      ultimoCadastro
        ? {
            tipo: "Cadastro",
            titulo: "Nova solicitação de cadastro enviada",
            data: ultimoCadastro.createdAt
          }
        : null,

      ultimaApresentacao
        ? {
            tipo: "Apresentação",
            titulo: `Apresentação registrada: ${ultimaApresentacao.nomeEstagiario}`,
            data: ultimaApresentacao.createdAt
          }
        : null,

      ultimaAdvertencia
        ? {
            tipo: "Advertência",
            titulo: `Advertência aplicada: ${ultimaAdvertencia.nome}`,
            data: ultimaAdvertencia.createdAt
          }
        : null,

      ultimaRequisicaoCadastral
        ? {
            tipo: "Req. Cadastral",
            titulo: `Nova requisição cadastral: ${ultimaRequisicaoCadastral.tipo}`,
            data: ultimaRequisicaoCadastral.createdAt
          }
        : null
    ]
      .filter(Boolean)
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 5);

    return res.json({
      totalHorasMes: totalMinutosMes,
      totalHorasSemana: totalMinutosSemana,
      policialDestaque,
      policialDestaqueSemana,
      topPoliciais,
      topPoliciaisSemana,
      pendencias,
      movimentacoes
    });
  } catch (err) {
    console.error("Erro dashboard:", err);
    return res.status(500).json({ message: "Erro dashboard" });
  }
};