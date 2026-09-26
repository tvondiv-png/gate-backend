/* =========================================================
   LIMPEZA DE DADOS — SÓ SUPERADMIN

   Apaga dados operacionais/RP por categoria, mantendo sempre
   intactos: usuários, hierarquia, quadro ROCAM (quem é o quê),
   conteúdo do site (regulamento, história, galeria, slides) e
   o Código Penal cadastrado — nenhum desses entra em nenhuma
   categoria abaixo de propósito.
========================================================= */

const RSO = require("../models/RSO");
const RSOHistory = require("../models/RSOHistory");
const Action = require("../models/Action");
const Advertencia = require("../models/Advertencia");
const DisciplinaryCase = require("../models/DisciplinaryCase");
const PatrolHours = require("../models/PatrolHours");
const PatrolHoursHistory = require("../models/PatrolHoursHistory");
const Notification = require("../models/Notification");
const BoletimOcorrencia = require("../models/BoletimOcorrencia");
const RocamHistory = require("../models/RocamHistory");
const RocamEvaluation = require("../models/RocamEvaluation");
const RocamStage = require("../models/RocamStage");
const RocamMessage = require("../models/RocamMessage");
const RocamNotice = require("../models/RocamNotice");
const Seizure = require("../models/Seizure");
const SeizureBalance = require("../models/SeizureBalance");
const Absence = require("../models/Absence");
const ProfileUpdateRequest = require("../models/ProfileUpdateRequest");
const SignupRequest = require("../models/SignupRequest");
const Indication = require("../models/Indication");
const ComandoComunicado = require("../models/ComandoComunicado");
const HighCommandNotice = require("../models/HighCommandNotice");
const Conquista = require("../models/Conquista");
const Log = require("../models/Log");
const AvaliacaoEstagio = require("../models/AvaliacaoEstagio");
const ApresentacaoEstagiario = require("../models/ApresentacaoEstagiario");
const ComandoMeta = require("../models/ComandoMeta");
const IPM = require("../models/IPM");

/* =========================================================
   CATEGORIAS

   Cada categoria vira um checkbox no painel. "horas" é
   especial: não apaga o registro (senão quebra o vínculo por
   funcional), só zera os valores e apaga o histórico.
========================================================= */

const CATEGORIAS = {
  rso: {
    label: "RSOs (ativos e histórico)",
    modelos: [RSO, RSOHistory]
  },
  acoes: {
    label: "Ações",
    modelos: [Action]
  },
  advertencias: {
    label: "Advertências",
    modelos: [Advertencia]
  },
  disciplina: {
    label: "Disciplina / SJD",
    modelos: [DisciplinaryCase]
  },
  horas: {
    label: "Horas de patrulha (zera os valores; histórico é apagado)",
    especial: "horas"
  },
  notificacoes: {
    label: "Notificações",
    modelos: [Notification]
  },
  boletins: {
    label: "Boletins de Ocorrência (BOPM)",
    modelos: [BoletimOcorrencia]
  },
  rocamOperacional: {
    label: "ROCAM — histórico operacional (estágios, avaliações, mensagens, avisos)",
    modelos: [RocamHistory, RocamEvaluation, RocamStage, RocamMessage, RocamNotice]
  },
  apreensoes: {
    label: "Apreensões",
    modelos: [Seizure, SeizureBalance]
  },
  solicitacoes: {
    label: "Solicitações (ausência, cadastro, indicação, requisição de perfil)",
    modelos: [Absence, ProfileUpdateRequest, SignupRequest, Indication]
  },
  comunicados: {
    label: "Comunicados (Comando e Alto Comando)",
    modelos: [ComandoComunicado, HighCommandNotice]
  },
  conquistas: {
    label: "Conquistas / Quadro de Honra",
    modelos: [Conquista]
  },
  logs: {
    label: "Logs administrativos",
    modelos: [Log]
  },
  estagio: {
    label: "Avaliações e apresentações de estágio (geral, não-ROCAM)",
    modelos: [AvaliacaoEstagio, ApresentacaoEstagiario]
  },
  metas: {
    label: "Metas do Comando",
    modelos: [ComandoMeta]
  },
  ipm: {
    label: "IPM",
    modelos: [IPM]
  }
};

async function contarCategoria(chave, def) {
  if (def.especial === "horas") {
    const [comHoras, historico] = await Promise.all([
      PatrolHours.countDocuments({
        $or: [
          { horasSemanaMin: { $gt: 0 } },
          { horasMesMin: { $gt: 0 } },
          { horasRocamSemanaMin: { $gt: 0 } },
          { horasRocamMesMin: { $gt: 0 } }
        ]
      }),
      PatrolHoursHistory.countDocuments()
    ]);

    return comHoras + historico;
  }

  const contagens = await Promise.all(
    def.modelos.map((Model) => Model.countDocuments())
  );

  return contagens.reduce((a, b) => a + b, 0);
}

/* =========================================================
   CONTAGENS ATUAIS (pra mostrar no painel antes de apagar)
========================================================= */

exports.getContagens = async (req, res) => {
  try {
    const chaves = Object.keys(CATEGORIAS);

    const totais = await Promise.all(
      chaves.map((chave) => contarCategoria(chave, CATEGORIAS[chave]))
    );

    const categorias = chaves.map((chave, i) => ({
      chave,
      label: CATEGORIAS[chave].label,
      total: totais[i]
    }));

    return res.json({ categorias });
  } catch (err) {
    console.error("Erro ao contar dados pra limpeza:", err);
    return res.status(500).json({ message: "Erro ao carregar contagens" });
  }
};

/* =========================================================
   APAGAR AS CATEGORIAS SELECIONADAS
========================================================= */

exports.limpar = async (req, res) => {
  try {
    const { categorias, confirmacao } = req.body;

    if (confirmacao !== "LIMPAR") {
      return res.status(400).json({
        message: 'Confirmação inválida. Envie confirmacao: "LIMPAR".'
      });
    }

    if (!Array.isArray(categorias) || categorias.length === 0) {
      return res.status(400).json({
        message: "Selecione ao menos uma categoria"
      });
    }

    const invalida = categorias.find((c) => !CATEGORIAS[c]);
    if (invalida) {
      return res.status(400).json({
        message: `Categoria desconhecida: ${invalida}`
      });
    }

    const resultado = {};

    for (const chave of categorias) {
      const def = CATEGORIAS[chave];

      if (def.especial === "horas") {
        const zerados = await PatrolHours.updateMany(
          {},
          {
            $set: {
              horasSemanaMin: 0,
              horasMesMin: 0,
              horasRocamSemanaMin: 0,
              horasRocamMesMin: 0,
              ausenciaPatrulhamento: "normal",
              observacaoAusencia: ""
            }
          }
        );

        const historicoApagado = await PatrolHoursHistory.deleteMany({});

        resultado[chave] = {
          zerados: zerados.modifiedCount || 0,
          historicoApagado: historicoApagado.deletedCount || 0
        };

        continue;
      }

      const apagados = await Promise.all(
        def.modelos.map(async (Model) => {
          const r = await Model.deleteMany({});
          return { modelo: Model.modelName, apagados: r.deletedCount || 0 };
        })
      );

      resultado[chave] = apagados;
    }

    // Registro da limpeza — criado DEPOIS de apagar, mesmo que
    // "logs" tenha sido uma das categorias selecionadas.
    await Log.create({
      action: "LIMPEZA DE DADOS (SUPERADMIN)",
      performedBy: req.user.id,
      details: `Categorias apagadas: ${categorias.join(", ")}`
    });

    return res.json({
      message: "Limpeza concluída",
      resultado
    });
  } catch (err) {
    console.error("Erro na limpeza de dados:", err);
    return res.status(500).json({ message: "Erro ao limpar dados" });
  }
};
