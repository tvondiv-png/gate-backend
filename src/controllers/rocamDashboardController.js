/* =========================================================
   DASHBOARD ROCAM

   Retorna dados conforme o papel do solicitante:
   - todos: perfil + histórico próprio
   - estagiário: estágio ativo (progresso x metas) + avaliações recebidas
   - braçal: fila de avaliação + avaliações no mês + devolvidas
   - comando: efetivo, estágios por status, avaliações pendentes, alertas

   Usa o middleware onlyRocam (que preenche req.rocamProfile /
   req.rocamHierarchy).
========================================================= */

const RocamProfile = require("../models/RocamProfile");
const RocamStage = require("../models/RocamStage");
const RocamHistory = require("../models/RocamHistory");
const RocamEvaluation = require("../models/RocamEvaluation");

const STATUS_ESTAGIO_ABERTO = [
  "EM_ANDAMENTO",
  "APTO_APROVACAO",
  "APROVACAO_SOLICITADA"
];

const FUNCOES_COMANDO_BATALHAO = [
  "Comando do Batalhão",
  "Subcomando do Batalhão"
];

function inicioDoMes() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function itemMeta(label, atual, meta, ehMaximo) {
  const a = Number(atual || 0);
  const m = Number(meta || 0);
  return {
    label,
    atual: a,
    meta: m,
    ok: ehMaximo ? a <= m : a >= m
  };
}

exports.getDashboard = async (req, res) => {
  try {
    const profile = req.rocamProfile || null;
    const hierarchy = req.rocamHierarchy || null;

    const papel = profile ? profile.papelRocam : null;
    const isEstagiario = papel === "ESTAGIARIO_ROCAM";
    const isBracal = papel === "BRACAL_ROCAM";

    const podeComando =
      req.user.role === "superadmin" ||
      papel === "COMANDO_ROCAM" ||
      papel === "SUBCOMANDO_ROCAM" ||
      (hierarchy && FUNCOES_COMANDO_BATALHAO.includes(hierarchy.funcao));

    const out = {
      papel,
      podeComando,
      perfil: profile
        ? {
            nome: profile.nome,
            patente: profile.patente,
            funcional: profile.funcional,
            papelRocam: profile.papelRocam,
            situacaoRocam: profile.situacaoRocam,
            dataIngressoRocam: profile.dataIngressoRocam
          }
        : null,
      historico: [],
      estagio: null,
      minhasAvaliacoes: [],
      bracal: null,
      comando: null
    };

    if (profile && profile.funcional) {
      out.historico = await RocamHistory.find({ funcional: profile.funcional })
        .sort({ dataEvento: -1 })
        .limit(8)
        .select("evento titulo descricao dataEvento papelAnterior papelNovo")
        .lean();
    }

    /* ============ ESTAGIÁRIO ============ */
    if (isEstagiario && profile.user) {
      const stage = await RocamStage.findOne({
        user: profile.user,
        status: { $in: STATUS_ESTAGIO_ABERTO }
      })
        .sort({ createdAt: -1 })
        .lean();

      if (stage) {
        const p = stage.progresso || {};
        const m = stage.metas || {};
        const diasDecorridos = stage.dataInicio
          ? Math.max(
              0,
              Math.floor(
                (Date.now() - new Date(stage.dataInicio).getTime()) / 86400000
              )
            )
          : 0;

        const checklist = [
          itemMeta(
            "Horas de patrulhamento",
            p.horasPatrulhamento || p.horasCumpridas || 0,
            m.horasPatrulhamento && m.horasPatrulhamento.valor
          ),
          itemMeta(
            "Patrulhas realizadas",
            p.patrulhasRealizadas,
            m.quantidadePatrulhas && m.quantidadePatrulhas.valor
          ),
          itemMeta(
            "Avaliacoes recebidas",
            p.avaliacoesRealizadas,
            m.quantidadeAvaliacoes && m.quantidadeAvaliacoes.valor
          ),
          itemMeta(
            "Media nas avaliacoes (%)",
            p.mediaAvaliacoes,
            m.mediaMinimaAvaliacoes && m.mediaMinimaAvaliacoes.valor
          ),
          itemMeta(
            "Questionarios concluidos",
            p.questionariosConcluidos,
            m.quantidadeQuestionarios && m.quantidadeQuestionarios.valor
          ),
          itemMeta(
            "Ausencias injustificadas",
            p.ausenciasInjustificadas,
            (m.ausenciasInjustificadas && m.ausenciasInjustificadas.maximo) || 0,
            true
          )
        ].filter((i) => i.meta > 0 || i.atual > 0);

        out.estagio = {
          status: stage.status,
          dataInicio: stage.dataInicio,
          diasDecorridos,
          percentualGeral: Number(p.percentualGeral || 0),
          checklist,
          pendencias: checklist.filter((i) => !i.ok).map((i) => i.label)
        };
      }

      out.minhasAvaliacoes = await RocamEvaluation.find({
        traineeUser: profile.user
      })
        .sort({ dataAvaliacao: -1 })
        .limit(6)
        .select(
          "nomeAvaliador notaPercentual status dataAvaliacao comentarioComando"
        )
        .lean();
    }

    /* ============ BRAÇAL ============ */
    if (isBracal && profile.user) {
      const [estagiariosAtivos, avaliacoesNoMes, devolvidas] = await Promise.all([
        RocamProfile.countDocuments({
          ativo: true,
          papelRocam: "ESTAGIARIO_ROCAM"
        }),
        RocamEvaluation.countDocuments({
          evaluatorUser: profile.user,
          dataAvaliacao: { $gte: inicioDoMes() }
        }),
        RocamEvaluation.countDocuments({
          evaluatorUser: profile.user,
          status: "DEVOLVIDA"
        })
      ]);

      out.bracal = { estagiariosAtivos, avaliacoesNoMes, devolvidas };
    }

    /* ============ COMANDO ============ */
    if (podeComando) {
      const [porPapel, stagesAbertos, avaliacoesPendentes] = await Promise.all([
        RocamProfile.aggregate([
          { $match: { ativo: true } },
          { $group: { _id: "$papelRocam", n: { $sum: 1 } } }
        ]),
        RocamStage.find({ status: { $in: STATUS_ESTAGIO_ABERTO } })
          .select("status dataInicio progresso funcional")
          .lean(),
        RocamEvaluation.countDocuments({ status: "PENDENTE_COMANDO" })
      ]);

      const efetivo = {
        comando: 0,
        subcomando: 0,
        bracal: 0,
        estagiario: 0,
        total: 0
      };
      porPapel.forEach((g) => {
        if (g._id === "COMANDO_ROCAM") efetivo.comando = g.n;
        if (g._id === "SUBCOMANDO_ROCAM") efetivo.subcomando = g.n;
        if (g._id === "BRACAL_ROCAM") efetivo.bracal = g.n;
        if (g._id === "ESTAGIARIO_ROCAM") efetivo.estagiario = g.n;
        efetivo.total += g.n;
      });

      const estagios = {
        emAndamento: 0,
        aptoAprovacao: 0,
        aguardandoAprovacao: 0
      };
      const alertas = [];

      stagesAbertos.forEach((s) => {
        if (s.status === "EM_ANDAMENTO") estagios.emAndamento++;
        if (s.status === "APTO_APROVACAO") estagios.aptoAprovacao++;
        if (s.status === "APROVACAO_SOLICITADA") estagios.aguardandoAprovacao++;

        const dias = s.dataInicio
          ? Math.floor(
              (Date.now() - new Date(s.dataInicio).getTime()) / 86400000
            )
          : 0;
        const pct = Number((s.progresso && s.progresso.percentualGeral) || 0);

        if (s.status === "EM_ANDAMENTO" && dias >= 25 && pct < 60) {
          alertas.push({
            tipo: "estagiario_parado",
            texto:
              "Estagiario funcional " +
              s.funcional +
              ": " +
              dias +
              " dias de estagio e apenas " +
              pct.toFixed(0) +
              "% de progresso."
          });
        }
      });

      if (avaliacoesPendentes > 0) {
        alertas.push({
          tipo: "avaliacoes",
          texto:
            avaliacoesPendentes +
            " avaliacao(oes) aguardando homologacao do comando."
        });
      }
      if (estagios.aguardandoAprovacao > 0) {
        alertas.push({
          tipo: "aprovacao",
          texto:
            estagios.aguardandoAprovacao +
            " estagiario(s) aguardando decisao de aprovacao."
        });
      }

      out.comando = { efetivo, estagios, avaliacoesPendentes, alertas };
    }

    return res.json(out);
  } catch (err) {
    console.error("Erro getDashboard ROCAM:", err);
    return res
      .status(500)
      .json({ message: "Erro ao carregar o dashboard ROCAM" });
  }
};
