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
    /*
      Todas as consultas abaixo são independentes entre si —
      rodam em paralelo numa única viagem de rede até o banco,
      em vez de uma esperando a outra terminar (o banco fica em
      são-paulo, a VPS na europa: cada round-trip custa ~200ms,
      então isso importa bastante).
    */
    const [
      horas,
      destaque,
      destaqueSemana,
      topHorasMes,
      topHorasSemana,
      rsos,
      cadastros,
      ausencias,
      apresentacoes,
      advertencias,
      avaliacoesEstagio,
      requisicoesCadastraisPendentes,
      ultimoRSO,
      ultimaAusencia,
      ultimoCadastro,
      ultimaApresentacao,
      ultimaAdvertencia,
      ultimaRequisicaoCadastral
    ] = await Promise.all([
      PatrolHours.find(),
      PatrolHours.findOne().sort({ horasMesMin: -1 }),
      PatrolHours.findOne().sort({ horasSemanaMin: -1 }),
      PatrolHours.find().sort({ horasMesMin: -1 }).limit(3),
      PatrolHours.find().sort({ horasSemanaMin: -1 }).limit(3),

      RSO.countDocuments({ status: "Pendente" }),
      SignupRequest.countDocuments({ status: "Pendente" }),
      Absence.countDocuments({ status: "Pendente" }),
      ApresentacaoEstagiario.countDocuments({ status: "Enviado" }),
      Advertencia.countDocuments({ ativa: true }),
      AvaliacaoEstagio.countDocuments({
        status: { $in: ["Pendente", "Revisao"] }
      }),
      ProfileUpdateRequest.countDocuments({ status: "PENDENTE" }),

      RSO.findOne().sort({ createdAt: -1 }),
      Absence.findOne().sort({ createdAt: -1 }),
      SignupRequest.findOne().sort({ createdAt: -1 }),
      ApresentacaoEstagiario.findOne().sort({ createdAt: -1 }),
      Advertencia.findOne().sort({ createdAt: -1 }),
      ProfileUpdateRequest.findOne().sort({ createdAt: -1 })
    ]);

    // =========================
    // HORAS (totais)
    // =========================
    const totalMinutosMes = horas.reduce((total, h) => {
      return total + (h.horasMesMin || 0);
    }, 0);

    const totalMinutosSemana = horas.reduce((total, h) => {
      return total + (h.horasSemanaMin || 0);
    }, 0);

    // =========================
    // PATENTES — uma única consulta pra todos os funcionais
    // que precisam de Hierarchy (destaques + tops)
    // =========================
    const funcionaisNecessarios = [
      ...new Set(
        [
          destaque?.funcional,
          destaqueSemana?.funcional,
          ...topHorasMes.map((item) => item.funcional),
          ...topHorasSemana.map((item) => item.funcional)
        ].filter((f) => f !== undefined && f !== null)
      )
    ];

    const hierarquias = funcionaisNecessarios.length
      ? await Hierarchy.find({ funcional: { $in: funcionaisNecessarios } })
      : [];

    const patentePorFuncional = new Map(
      hierarquias.map((h) => [h.funcional, h.patente])
    );

    // =========================
    // POLICIAL DESTAQUE DO MÊS / DA SEMANA
    // =========================
    const policialDestaque = destaque
      ? {
          funcional: destaque.funcional,
          nome: destaque.nome,
          patente: patentePorFuncional.get(destaque.funcional) || destaque.patente,
          horas: destaque.horasMesMin
        }
      : null;

    const policialDestaqueSemana = destaqueSemana
      ? {
          funcional: destaqueSemana.funcional,
          nome: destaqueSemana.nome,
          patente:
            patentePorFuncional.get(destaqueSemana.funcional) ||
            destaqueSemana.patente,
          horas: destaqueSemana.horasSemanaMin
        }
      : null;

    // =========================
    // TOP 3 DO MÊS / DA SEMANA
    // =========================
    const topPoliciais = topHorasMes.map((item) => ({
      funcional: item.funcional,
      nome: item.nome,
      patente: patentePorFuncional.get(item.funcional) || item.patente,
      horas: item.horasMesMin || 0
    }));

    const topPoliciaisSemana = topHorasSemana.map((item) => ({
      funcional: item.funcional,
      nome: item.nome,
      patente: patentePorFuncional.get(item.funcional) || item.patente,
      horas: item.horasSemanaMin || 0
    }));

    // =========================
    // PENDÊNCIAS
    // =========================
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
