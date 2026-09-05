const mongoose = require("mongoose");
const Action = require("../models/Action");
const User = require("../models/User");
const Hierarchy = require("../models/Hierarchy");
const { getActionRuleByCode } = require("../utils/actionRules");

const META_ACOES = 6;
const PROXIMO_META = 4;

function buildHistorico(tipo, req, observacao = "") {
  return {
    tipo,
    data: new Date(),
    autorId: req.user?._id || null,
    autorNome: req.user?.nome || "Sistema",
    observacao
  };
}

function diffInDays(a, b) {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function parseDateOnly(value) {
  if (!value || typeof value !== "string") return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

function isEligibleForMetrics(action, now = new Date()) {
  if (!action) return false;
  if (action.status !== "APROVADA") return false;
  if (action.excluidoHistorico) return false;
  if (action.contabilizarMeta === false) return false;
  if (!action.createdAt || !action.dataAcao) return false;

  const daysBetweenActionAndRegister = diffInDays(action.createdAt, action.dataAcao);
  if (daysBetweenActionAndRegister > 30) return false;

  const daysSinceRegister = diffInDays(now, action.createdAt);
  if (daysSinceRegister > 30) return false;

  return true;
}

async function montarParticipantesSnapshot(participantes = []) {
  const ids = [...new Set((participantes || []).map(String).filter(Boolean))];

  if (!ids.length) {
    return {
      erro: {
        status: 400,
        message: "Selecione ao menos 1 participante"
      }
    };
  }

  const invalidos = ids.filter((id) => !mongoose.Types.ObjectId.isValid(id));

  if (invalidos.length > 0) {
    return {
      erro: {
        status: 400,
        message: "Há participantes com identificador inválido"
      }
    };
  }

  const policiais = await Hierarchy.find({
    user: { $in: ids }
  }).lean();

  const encontrados = new Set(policiais.map((p) => String(p.user)));
  const faltantes = ids.filter((id) => !encontrados.has(String(id)));

  if (faltantes.length > 0) {
    return {
      erro: {
        status: 400,
        message: "Um ou mais participantes não foram encontrados na hierarquia"
      }
    };
  }

  return {
    participantesSnapshot: policiais.map((p) => ({
      userId: p.user,
      funcional: String(p.funcional || ""),
      patente: p.patente || "",
      nome: p.nome || ""
    }))
  };
}

exports.listPendingActions = async (req, res) => {
  try {
    const items = await Action.find({
      status: { $in: ["PENDENTE", "REENVIADA"] },
      excluidoHistorico: false
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(items);
  } catch (err) {
    console.error("Erro ao listar pendentes:", err);
    return res.status(500).json({ message: "Erro ao listar solicitações" });
  }
};

exports.getActionById = async (req, res) => {
  try {
    const item = await Action.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({ message: "Ação não encontrada" });
    }

    return res.json(item);
  } catch (err) {
    console.error("Erro ao buscar ação admin:", err);
    return res.status(500).json({ message: "Erro ao buscar ação" });
  }
};

exports.createActionByAdmin = async (req, res) => {
  try {
    const {
      tipoAcao,
      resultado,
      numeroAcao,
      dataAcao,
      horaAcao,
      observacoes,
      participantes,
      contabilizarMeta
    } = req.body;

    if (!tipoAcao || !resultado || !numeroAcao || !dataAcao) {
      return res.status(400).json({ message: "Preencha os campos obrigatórios" });
    }

    const rule = getActionRuleByCode(tipoAcao);

    if (!rule) {
      return res.status(400).json({ message: "Tipo de ação inválido" });
    }

    if (!["GANHA", "PERDIDA"].includes(String(resultado))) {
      return res.status(400).json({ message: "Resultado inválido" });
    }

    const dataAcaoNormalizada = parseDateOnly(dataAcao);

    if (!dataAcaoNormalizada) {
      return res.status(400).json({ message: "Data da ação inválida" });
    }

    const resultadoParticipantes = await montarParticipantesSnapshot(participantes);

    if (resultadoParticipantes.erro) {
      return res
        .status(resultadoParticipantes.erro.status)
        .json({ message: resultadoParticipantes.erro.message });
    }

    const item = await Action.create({
      tipoAcao: rule.codigo,
      nomeTipoAcao: rule.nome,
      categoriaAcao: rule.categoria,
      resultado: String(resultado),
      numeroAcao: String(numeroAcao).trim(),
      dataAcao: dataAcaoNormalizada,
      horaAcao: horaAcao || "",
      observacoes: observacoes || "",
      contabilizarMeta: contabilizarMeta !== false,
      registrante: {
        userId: req.user._id,
        funcional: String(req.user.funcional || ""),
        patente: req.user.patente || "",
        nome: req.user.nome || ""
      },
      participantes: resultadoParticipantes.participantesSnapshot,
      status: "APROVADA",
      aprovadoEm: new Date(),
      analisadoPor: {
        userId: req.user._id,
        nome: req.user.nome || "",
        role: req.user.role || ""
      },
      observacaoAdmin:
        contabilizarMeta === false
          ? "Ação criada pelo administrador somente para histórico"
          : "Ação criada pelo administrador e contabilizada na meta",
      historicoValidacao: [
        buildHistorico(
          "CRIADA",
          req,
          contabilizarMeta === false
            ? "Ação criada diretamente pelo administrador, somente histórico"
            : "Ação criada diretamente pelo administrador, contabilizada na meta"
        ),
        buildHistorico(
          "APROVADA",
          req,
          "Ação aprovada automaticamente por lançamento administrativo"
        )
      ]
    });

    return res.status(201).json({
      message: "Ação cadastrada com sucesso pelo administrador",
      item
    });
  } catch (err) {
    console.error("Erro ao criar ação pelo admin:", err);
    return res.status(500).json({ message: "Erro ao cadastrar ação pelo administrador" });
  }
};

exports.approveAction = async (req, res) => {
  try {
    const item = await Action.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Ação não encontrada" });
    }

    if (item.excluidoHistorico) {
      return res.status(400).json({ message: "Esta ação já foi excluída do histórico" });
    }

    item.status = "APROVADA";
    item.aprovadoEm = new Date();
    item.rejeitadoEm = null;
    item.motivoRejeicao = "";
    item.observacaoAdmin = req.body.observacaoAdmin || "";
    item.analisadoPor = {
      userId: req.user._id,
      nome: req.user.nome || "",
      role: req.user.role || ""
    };

    if (typeof req.body.contabilizarMeta === "boolean") {
      item.contabilizarMeta = req.body.contabilizarMeta;
    }

    item.historicoValidacao.push(
      buildHistorico(
        "APROVADA",
        req,
        item.contabilizarMeta === false
          ? "Ação aprovada, porém mantida somente no histórico e fora da contabilidade da meta"
          : req.body.observacaoAdmin || "Ação aprovada e contabilizada na meta"
      )
    );

    await item.save();

    return res.json({ message: "Ação aprovada com sucesso", item });
  } catch (err) {
    console.error("Erro ao aprovar ação:", err);
    return res.status(500).json({ message: "Erro ao aprovar ação" });
  }
};

exports.rejectAction = async (req, res) => {
  try {
    const { motivoRejeicao, observacaoAdmin } = req.body;

    if (!motivoRejeicao || !motivoRejeicao.trim()) {
      return res.status(400).json({ message: "Informe o motivo da rejeição" });
    }

    const item = await Action.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Ação não encontrada" });
    }

    if (item.excluidoHistorico) {
      return res.status(400).json({ message: "Esta ação já foi excluída do histórico" });
    }

    item.status = "REJEITADA";
    item.rejeitadoEm = new Date();
    item.aprovadoEm = null;
    item.motivoRejeicao = motivoRejeicao.trim();
    item.observacaoAdmin = observacaoAdmin || "";
    item.analisadoPor = {
      userId: req.user._id,
      nome: req.user.nome || "",
      role: req.user.role || ""
    };

    item.historicoValidacao.push(
      buildHistorico("REJEITADA", req, motivoRejeicao.trim())
    );

    await item.save();

    return res.json({ message: "Ação rejeitada com sucesso", item });
  } catch (err) {
    console.error("Erro ao rejeitar ação:", err);
    return res.status(500).json({ message: "Erro ao rejeitar ação" });
  }
};

exports.listApprovedHistory = async (req, res) => {
  try {
    const items = await Action.find({
      status: "APROVADA",
      excluidoHistorico: false
    })
      .sort({ dataAcao: -1 })
      .lean();

    return res.json(items);
  } catch (err) {
    console.error("Erro ao listar histórico:", err);
    return res.status(500).json({ message: "Erro ao listar histórico" });
  }
};

exports.excludeHistory = async (req, res) => {
  try {
    const { motivoExclusao } = req.body;

    const item = await Action.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Ação não encontrada" });
    }

    item.excluidoHistorico = true;
    item.contabilizarMeta = false;
    item.status = "EXCLUIDA_HISTORICO";
    item.excluidoEm = new Date();
    item.motivoExclusao = motivoExclusao || "";
    item.excluidoPor = {
      userId: req.user._id,
      nome: req.user.nome || ""
    };

    item.historicoValidacao.push(
      buildHistorico(
        "EXCLUIDA_HISTORICO",
        req,
        motivoExclusao || "Registro excluído do histórico"
      )
    );

    await item.save();

    return res.json({ message: "Registro excluído do histórico com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir histórico:", err);
    return res.status(500).json({ message: "Erro ao excluir histórico" });
  }
};

exports.toggleContabilizarMeta = async (req, res) => {
  try {
    const { contabilizarMeta } = req.body;

    if (typeof contabilizarMeta !== "boolean") {
      return res.status(400).json({
        message: "Informe se a ação deve contabilizar ou não na meta"
      });
    }

    const item = await Action.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Ação não encontrada" });
    }

    if (item.excluidoHistorico) {
      return res.status(400).json({
        message: "Não é possível alterar uma ação excluída do histórico"
      });
    }

    item.contabilizarMeta = contabilizarMeta;

    item.historicoValidacao.push(
      buildHistorico(
        "ALTERACAO_META",
        req,
        contabilizarMeta
          ? "Ação incluída na contabilidade da meta"
          : "Ação removida da contabilidade da meta, permanecendo apenas no histórico"
      )
    );

    await item.save();

    return res.json({
      message: contabilizarMeta
        ? "Ação incluída na contabilidade da meta"
        : "Ação removida da contabilidade da meta",
      item
    });
  } catch (err) {
    console.error("Erro ao alterar contabilidade da ação:", err);
    return res.status(500).json({ message: "Erro ao alterar contabilidade da ação" });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const now = new Date();

    const startMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    const endMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const allApproved = await Action.find({
      status: "APROVADA",
      excluidoHistorico: false,
      contabilizarMeta: { $ne: false }
    }).lean();

    const users = await User.find({ ativo: true })
  .select("_id nome funcional patente dataUltimaPromocao resetAcoesPorPromocao dataResetAcoesPorPromocao")
  .lean();

    const mapaPromocao = new Map();
const mapaUserAtual = new Map();

for (const user of users) {
  mapaPromocao.set(String(user._id), {
    dataUltimaPromocao: user.dataUltimaPromocao || null,
    resetAcoesPorPromocao: user.resetAcoesPorPromocao === true,
    dataResetAcoesPorPromocao: user.dataResetAcoesPorPromocao || null
  });

  mapaUserAtual.set(String(user._id), {
    nome: user.nome || "",
    funcional: user.funcional || "",
    patente: user.patente || ""
  });
}

    const validas30Dias = allApproved.filter((action) =>
      isEligibleForMetrics(action, now)
    );

    const validasMes = allApproved.filter((action) => {
      if (!isEligibleForMetrics(action, now)) return false;
      return action.dataAcao >= startMonth && action.dataAcao <= endMonth;
    });

    const mapaAcoesPorUser30 = new Map();
    const mapaAcoesPorUserMes = new Map();

    for (const action of validas30Dias) {
      for (const p of action.participantes || []) {
        const key = String(p.userId);

        if (!mapaAcoesPorUser30.has(key)) {
  const dadosAtuais = mapaUserAtual.get(key) || {};

  mapaAcoesPorUser30.set(key, {
    userId: p.userId,
    funcional: dadosAtuais.funcional || p.funcional,
    patente: dadosAtuais.patente || p.patente,
    nome: dadosAtuais.nome || p.nome,
    acoes: []
  });
}

        mapaAcoesPorUser30.get(key).acoes.push({
          _id: action._id,
          resultado: action.resultado,
          dataAcao: action.dataAcao,
          createdAt: action.createdAt
        });
      }
    }

    for (const action of validasMes) {
      for (const p of action.participantes || []) {
        const key = String(p.userId);

        if (!mapaAcoesPorUserMes.has(key)) {
          mapaAcoesPorUserMes.set(key, {
            totalMes: 0,
            ganhasMes: 0,
            perdidasMes: 0
          });
        }

        const item = mapaAcoesPorUserMes.get(key);

        item.totalMes += 1;

        if (action.resultado === "GANHA") item.ganhasMes += 1;
        if (action.resultado === "PERDIDA") item.perdidasMes += 1;
      }
    }

    const resumo = Array.from(mapaAcoesPorUser30.values()).map((item) => {
      const dadosPromocao = mapaPromocao.get(String(item.userId));

      const dataPromocao = dadosPromocao?.dataUltimaPromocao || null;
      const deveSubtrairPromocao =
        dadosPromocao?.resetAcoesPorPromocao === true;

      let acoesValidas = [...item.acoes];

      acoesValidas.sort((a, b) => {
        const dataB = new Date(a.dataAcao || a.createdAt).getTime();
        const dataA = new Date(b.dataAcao || b.createdAt).getTime();
        return dataA - dataB;
      });

      let promocaoAplicada = false;
      let acoesSubtraidasPromocao = 0;

      if (dataPromocao && deveSubtrairPromocao) {
        const ordenadasMaisAntigas = [...acoesValidas].sort((a, b) => {
          const dataA = new Date(a.dataAcao || a.createdAt).getTime();
          const dataB = new Date(b.dataAcao || b.createdAt).getTime();
          return dataA - dataB;
        });

        const acoesParaRemover = ordenadasMaisAntigas.slice(0, META_ACOES);

        const idsRemover = new Set(
          acoesParaRemover.map((a) => String(a._id))
        );

        acoesValidas = acoesValidas.filter(
          (a) => !idsRemover.has(String(a._id))
        );

        promocaoAplicada = acoesParaRemover.length > 0;
        acoesSubtraidasPromocao = acoesParaRemover.length;
      }

      const totalValidas30Dias = acoesValidas.length;

      const totalGanhas30Dias = acoesValidas.filter(
        (a) => a.resultado === "GANHA"
      ).length;

      const totalPerdidas30Dias = acoesValidas.filter(
        (a) => a.resultado === "PERDIDA"
      ).length;

      const ultimaAcao = acoesValidas[0]?.dataAcao || null;

      const dadosMes = mapaAcoesPorUserMes.get(String(item.userId)) || {
        totalMes: 0,
        ganhasMes: 0,
        perdidasMes: 0
      };

      const aproveitamento = totalValidas30Dias
        ? Math.round((totalGanhas30Dias / totalValidas30Dias) * 100)
        : 0;

      let statusMeta = "ABAIXO_DA_META";

      if (totalValidas30Dias >= META_ACOES) {
        statusMeta = "META_CONCLUIDA";
      } else if (totalValidas30Dias >= PROXIMO_META) {
        statusMeta = "PROXIMO_DA_META";
      }

      return {
        userId: item.userId,
        funcional: item.funcional,
        patente: item.patente,
        nome: item.nome,

        totalValidas30Dias,
        totalGanhas30Dias,
        totalPerdidas30Dias,
        ultimaAcao,

        ...dadosMes,

        aproveitamento,
        statusMeta,

        promocaoAplicada,
        acoesSubtraidasPromocao
      };
    });

    resumo.sort((a, b) => {
      if (b.totalValidas30Dias !== a.totalValidas30Dias) {
        return b.totalValidas30Dias - a.totalValidas30Dias;
      }

      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });

    const rankingMensal = [...resumo].sort((a, b) => {
      if (b.totalMes !== a.totalMes) return b.totalMes - a.totalMes;
      if (b.ganhasMes !== a.ganhasMes) return b.ganhasMes - a.ganhasMes;

      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });

    const alertasMetaConcluida = resumo.filter(
      (x) => x.statusMeta === "META_CONCLUIDA"
    );

    const alertasProximoMeta = resumo.filter(
      (x) => x.statusMeta === "PROXIMO_DA_META"
    );

    const totalValidas30DiasAposPromocao = resumo.reduce(
      (acc, item) => acc + Number(item.totalValidas30Dias || 0),
      0
    );

    const totalValidasMesAposPromocao = resumo.reduce(
      (acc, item) => acc + Number(item.totalMes || 0),
      0
    );

    return res.json({
      resumo,
      rankingMensal,
      totais: {
        acoesValidas30Dias: totalValidas30DiasAposPromocao,
        acoesValidasMes: totalValidasMesAposPromocao
      },
      alertas: {
        metaConcluida: alertasMetaConcluida,
        proximoDaMeta: alertasProximoMeta
      }
    });
  } catch (err) {
    console.error("Erro ao gerar métricas:", err);
    return res.status(500).json({ message: "Erro ao gerar métricas" });
  }
};

exports.clearMetricsData = async (req, res) => {
  try {
    const { userId, dataInicial, dataFinal, motivoExclusao } = req.body;

    const filtro = {
      status: "APROVADA",
      excluidoHistorico: false
    };

    if (userId) {
      filtro["participantes.userId"] = userId;
    }

    if (dataInicial || dataFinal) {
      filtro.dataAcao = {};

      if (dataInicial) {
        const inicio = new Date(dataInicial);
        inicio.setHours(0, 0, 0, 0);
        filtro.dataAcao.$gte = inicio;
      }

      if (dataFinal) {
        const fim = new Date(dataFinal);
        fim.setHours(23, 59, 59, 999);
        filtro.dataAcao.$lte = fim;
      }
    }

    const actions = await Action.find(filtro);

    if (!actions.length) {
      return res.status(404).json({
        message: "Nenhum registro encontrado para remover das métricas"
      });
    }

    for (const item of actions) {
      item.excluidoHistorico = true;
      item.contabilizarMeta = false;
      item.status = "EXCLUIDA_HISTORICO";
      item.excluidoEm = new Date();
      item.motivoExclusao =
        motivoExclusao || "Removido das métricas pelo administrador";
      item.excluidoPor = {
        userId: req.user._id,
        nome: req.user.nome || ""
      };

      item.historicoValidacao.push(
        buildHistorico(
          "EXCLUIDA_HISTORICO",
          req,
          motivoExclusao || "Registro removido das métricas"
        )
      );

      await item.save();
    }

    return res.json({
      message: "Dados removidos das métricas com sucesso",
      totalAfetado: actions.length
    });
  } catch (err) {
    console.error("Erro ao limpar métricas:", err);
    return res.status(500).json({ message: "Erro ao limpar métricas" });
  }
};

exports.getGeneralActionStats = async (req, res) => {
  try {
    const actions = await Action.find({
      status: "APROVADA",
      excluidoHistorico: false
    })
      .select("numeroAcao resultado dataAcao nomeTipoAcao categoriaAcao contabilizarMeta")
      .lean();

    const porNumero = new Map();
    const porDia = new Map();

    for (const action of actions) {
      const numero = action.numeroAcao || "SEM_NUMERO";

      if (!porNumero.has(numero)) {
        porNumero.set(numero, {
          numeroAcao: numero,
          tipo: action.nomeTipoAcao || "-",
          categoria: action.categoriaAcao || "-",
          total: 0,
          ganhas: 0,
          perdidas: 0,
          contaMeta: 0,
          somenteHistorico: 0
        });
      }

      const itemNumero = porNumero.get(numero);
      itemNumero.total += 1;

      if (action.contabilizarMeta === false) itemNumero.somenteHistorico += 1;
      else itemNumero.contaMeta += 1;

      if (action.resultado === "GANHA") itemNumero.ganhas += 1;
      if (action.resultado === "PERDIDA") itemNumero.perdidas += 1;

      const data = action.dataAcao
        ? new Date(action.dataAcao).toISOString().slice(0, 10)
        : "SEM_DATA";

      if (!porDia.has(data)) {
        porDia.set(data, {
          data,
          total: 0,
          ganhas: 0,
          perdidas: 0,
          contaMeta: 0,
          somenteHistorico: 0
        });
      }

      const itemDia = porDia.get(data);
      itemDia.total += 1;

      if (action.contabilizarMeta === false) itemDia.somenteHistorico += 1;
      else itemDia.contaMeta += 1;

      if (action.resultado === "GANHA") itemDia.ganhas += 1;
      if (action.resultado === "PERDIDA") itemDia.perdidas += 1;
    }

    return res.json({
      resumo: {
        total: actions.length,
        ganhas: actions.filter((a) => a.resultado === "GANHA").length,
        perdidas: actions.filter((a) => a.resultado === "PERDIDA").length,
        contaMeta: actions.filter((a) => a.contabilizarMeta !== false).length,
        somenteHistorico: actions.filter((a) => a.contabilizarMeta === false).length
      },
      porNumero: Array.from(porNumero.values()).sort((a, b) =>
        String(a.numeroAcao).localeCompare(String(b.numeroAcao), "pt-BR")
      ),
      porDia: Array.from(porDia.values()).sort(
        (a, b) => new Date(b.data) - new Date(a.data)
      )
    });
  } catch (err) {
    console.error("Erro ao gerar estatísticas gerais:", err);
    return res.status(500).json({
      message: "Erro ao gerar estatísticas gerais das ações"
    });
  }
};