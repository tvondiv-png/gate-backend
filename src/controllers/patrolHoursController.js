const PatrolHours = require("../models/PatrolHours");
const PatrolHoursHistory = require("../models/PatrolHoursHistory");

const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante-a-Oficial PM": 7,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

const AUSENCIAS_PERMITIDAS = ["normal", "justificada", "nao_justificada", "iniciante"];

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const normalizeOfficer = (p) => ({
  _id: p._id,
  funcional: p.funcional ?? 0,
  nome: p.nome || "",
  patente: p.patente || "",
  status: p.status || "Ativo",
  horasSemanaMin: p.horasSemanaMin || 0,
  horasMesMin: p.horasMesMin || 0,
  ausenciaPatrulhamento: p.ausenciaPatrulhamento || "normal",
  observacaoAusencia: p.observacaoAusencia || ""
});

const normalizeHistoryOfficer = (p) => ({
  _id: p._id,
  funcional: p.funcional ?? 0,
  nome: p.nome || "",
  patente: p.patente || "",
  status: p.status || "Ativo",
  horasSemanaMin: p.horasSemanaMin || 0,
  horasMesMin: p.horasMesMin || 0,
  ausenciaPatrulhamento: p.ausenciaPatrulhamento || "normal",
  observacaoAusencia: p.observacaoAusencia || "",
  tipoRegistro: p.tipoRegistro || "",
  periodoInicio: p.periodoInicio || null,
  periodoFim: p.periodoFim || null,
  createdAt: p.createdAt || null,
  updatedAt: p.updatedAt || null
});

const sortWeekDesc = (a, b) => {
  if ((b.horasSemanaMin || 0) !== (a.horasSemanaMin || 0)) {
    return (b.horasSemanaMin || 0) - (a.horasSemanaMin || 0);
  }

  const ordemA = ORDEM_PATENTES[a.patente] || 999;
  const ordemB = ORDEM_PATENTES[b.patente] || 999;

  if (ordemA !== ordemB) return ordemA - ordemB;
  return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
};

const sortMonthDesc = (a, b) => {
  if ((b.horasMesMin || 0) !== (a.horasMesMin || 0)) {
    return (b.horasMesMin || 0) - (a.horasMesMin || 0);
  }

  const ordemA = ORDEM_PATENTES[a.patente] || 999;
  const ordemB = ORDEM_PATENTES[b.patente] || 999;

  if (ordemA !== ordemB) return ordemA - ordemB;
  return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
};

const sortHierarchyAsc = (a, b) => {
  const ordemA = ORDEM_PATENTES[a.patente] || 999;
  const ordemB = ORDEM_PATENTES[b.patente] || 999;

  if (ordemA !== ordemB) return ordemA - ordemB;
  return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
};

const buildQueryFromRequest = (req) => {
  const query = {};

  if (req.query.status && req.query.status !== "todos") {
    query.status = req.query.status;
  }

  if (req.query.patente && req.query.patente !== "todas") {
    query.patente = req.query.patente;
  }

  if (req.query.funcional) {
    const funcional = Number(req.query.funcional);
    if (!Number.isNaN(funcional)) {
      query.funcional = funcional;
    }
  }

  if (req.query.ausencia && req.query.ausencia !== "todas") {
    query.ausenciaPatrulhamento = req.query.ausencia;
  }

  if (req.query.search) {
    const raw = req.query.search.trim();
    if (raw) {
      const numberValue = Number(raw);
      const isNumeric = !Number.isNaN(numberValue);

      const conditions = [
        { nome: { $regex: raw, $options: "i" } },
        { patente: { $regex: raw, $options: "i" } },
        { status: { $regex: raw, $options: "i" } }
      ];

      if (isNumeric) {
        conditions.push({ funcional: numberValue });
      }

      query.$or = conditions;
    }
  }

  return query;
};

const buildHistoryQueryFromRequest = (req) => {
  const query = {};

  if (req.query.status && req.query.status !== "todos") {
    query.status = req.query.status;
  }

  if (req.query.patente && req.query.patente !== "todas") {
    query.patente = req.query.patente;
  }

  if (req.query.funcional) {
    const funcional = Number(req.query.funcional);
    if (!Number.isNaN(funcional)) {
      query.funcional = funcional;
    }
  }

  if (req.query.ausencia && req.query.ausencia !== "todas") {
    query.ausenciaPatrulhamento = req.query.ausencia;
  }

  if (req.query.dataInicio || req.query.dataFim) {
    query.periodoFim = {};

    if (req.query.dataInicio) {
      query.periodoFim.$gte = new Date(`${req.query.dataInicio}T00:00:00.000Z`);
    }

    if (req.query.dataFim) {
      query.periodoFim.$lte = new Date(`${req.query.dataFim}T23:59:59.999Z`);
    }
  }

  if (req.query.search) {
    const raw = req.query.search.trim();
    if (raw) {
      const numberValue = Number(raw);
      const isNumeric = !Number.isNaN(numberValue);

      const conditions = [
        { nome: { $regex: raw, $options: "i" } },
        { patente: { $regex: raw, $options: "i" } },
        { status: { $regex: raw, $options: "i" } }
      ];

      if (isNumeric) {
        conditions.push({ funcional: numberValue });
      }

      query.$or = conditions;
    }
  }

  return query;
};

const isRegistroValidoParaHistorico = (item) => {
  return (
    item &&
    item.funcional !== null &&
    item.funcional !== undefined &&
    !Number.isNaN(Number(item.funcional)) &&
    String(item.nome || "").trim() &&
    String(item.patente || "").trim()
  );
};

const buildWeeklyHistoryPayload = (registros = []) => {
  const agora = new Date();

  return registros
    .filter(isRegistroValidoParaHistorico)
    .map((item) => ({
      funcional: Number(item.funcional),
      nome: String(item.nome || "").trim(),
      patente: String(item.patente || "").trim(),
      status: item.status || "Ativo",
      ausenciaPatrulhamento: AUSENCIAS_PERMITIDAS.includes(item.ausenciaPatrulhamento)
        ? item.ausenciaPatrulhamento
        : "normal",
      observacaoAusencia: item.observacaoAusencia || "",
      horasSemanaMin: Number(item.horasSemanaMin || 0),
      horasMesMin: Number(item.horasMesMin || 0),
      tipoRegistro: "reset_week",
      periodoInicio: item.updatedAt || item.createdAt || agora,
      periodoFim: agora
    }));
};

const buildMonthlyHistoryPayload = (registros = []) => {
  const agora = new Date();

  return registros
    .filter(isRegistroValidoParaHistorico)
    .map((item) => ({
      funcional: Number(item.funcional),
      nome: String(item.nome || "").trim(),
      patente: String(item.patente || "").trim(),
      status: item.status || "Ativo",
      ausenciaPatrulhamento: "normal",
      observacaoAusencia: "",
      horasSemanaMin: Number(item.horasSemanaMin || 0),
      horasMesMin: Number(item.horasMesMin || 0),
      tipoRegistro: "reset_month",
      periodoInicio: item.updatedAt || item.createdAt || agora,
      periodoFim: agora
    }));
};

exports.listAll = async (req, res) => {
  try {
    const query = buildQueryFromRequest(req);

    const horas = await PatrolHours.find(query).lean();
    const final = horas.map(normalizeOfficer).sort(sortHierarchyAsc);

    return res.json(final);
  } catch (error) {
    console.error("Erro ao listar horas de patrulha:", error);
    return res.status(500).json({
      message: "Erro ao listar horas de patrulha",
      error: error.message
    });
  }
};

exports.getFilters = async (req, res) => {
  try {
    const [statuses, patentes, funcionais, ausencias] = await Promise.all([
      PatrolHours.distinct("status"),
      PatrolHours.distinct("patente"),
      PatrolHours.distinct("funcional"),
      PatrolHours.distinct("ausenciaPatrulhamento")
    ]);

    return res.json({
      statuses: statuses.filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR")),
      patentes: patentes
        .filter(Boolean)
        .sort((a, b) => (ORDEM_PATENTES[a] || 999) - (ORDEM_PATENTES[b] || 999)),
      funcionais: funcionais
        .filter((v) => v !== null && v !== undefined)
        .sort((a, b) => a - b),
      ausencias: ["normal", "justificada", "nao_justificada", "iniciante"].filter((item) =>
        (ausencias || []).includes(item)
      )
    });
  } catch (error) {
    console.error("Erro ao carregar filtros:", error);
    return res.status(500).json({
      message: "Erro ao carregar filtros",
      error: error.message
    });
  }
};

exports.getReport = async (req, res) => {
  try {
    const query = buildQueryFromRequest(req);

    const period = req.query.period || "both";
    const topMonthLimit = toInt(req.query.topMonthLimit, 10);
    const weeklyThresholdHours = toInt(req.query.weeklyThresholdHours, 6);

    const weeklyThresholdMin = weeklyThresholdHours * 60;
    const intermediateMin = 1;
    const intermediateMax = weeklyThresholdMin - 1;

    const lista = (await PatrolHours.find(query).lean()).map(normalizeOfficer);

    const totalSemanaMin = lista.reduce((acc, item) => acc + (item.horasSemanaMin || 0), 0);
    const totalMesMin = lista.reduce((acc, item) => acc + (item.horasMesMin || 0), 0);

    const ativos = lista.filter((item) => item.status === "Ativo").length;
    const ausentes = lista.filter((item) => item.status === "Ausente").length;
    const afastados = lista.filter((item) => item.status === "Afastado").length;

    const topMonth = [...lista].sort(sortMonthDesc).slice(0, topMonthLimit);
    const topWeek = [...lista].sort(sortWeekDesc).slice(0, topMonthLimit);

    const weekAboveThreshold = [...lista]
      .filter((item) => (item.horasSemanaMin || 0) >= weeklyThresholdMin)
      .sort(sortWeekDesc);

    const weekBetween1mAnd5h59 = [...lista]
      .filter((item) => {
        const value = item.horasSemanaMin || 0;
        return value >= intermediateMin && value <= intermediateMax;
      })
      .sort(sortWeekDesc);

    const weekZero = [...lista]
      .filter((item) => (item.horasSemanaMin || 0) === 0)
      .sort(sortHierarchyAsc);

    const averageWeekMin = lista.length ? Math.round(totalSemanaMin / lista.length) : 0;
    const averageMonthMin = lista.length ? Math.round(totalMesMin / lista.length) : 0;

    return res.json({
      period,
      generatedAt: new Date(),
      filtersApplied: {
        status: req.query.status || "todos",
        patente: req.query.patente || "todas",
        search: req.query.search || "",
        funcional: req.query.funcional || "",
        ausencia: req.query.ausencia || "todas",
        topMonthLimit,
        weeklyThresholdHours
      },
      summary: {
        totalPoliciais: lista.length,
        ativos,
        ausentes,
        afastados,
        totalSemanaMin,
        totalMesMin,
        mediaSemanaMin: averageWeekMin,
        mediaMesMin: averageMonthMin,
        totalTopMes: topMonth.length,
        totalTopSemana: topWeek.length,
        totalAcimaThresholdSemana: weekAboveThreshold.length,
        totalEntre1MinEAbaixoDoLimite: weekBetween1mAnd5h59.length,
        totalZeroSemana: weekZero.length
      },
      sections: {
        topMonth,
        topWeek,
        weekAboveThreshold,
        weekBetween1mAnd5h59,
        weekZero
      }
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return res.status(500).json({
      message: "Erro ao gerar relatório",
      error: error.message
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const query = buildHistoryQueryFromRequest(req);

    const lista = await PatrolHoursHistory.find(query).lean();

    const final = lista
      .map(normalizeHistoryOfficer)
      .sort((a, b) => {
        const dataA = new Date(a.periodoFim || 0).getTime();
        const dataB = new Date(b.periodoFim || 0).getTime();

        if (dataB !== dataA) return dataB - dataA;
        return sortHierarchyAsc(a, b);
      });

    return res.json(final);
  } catch (error) {
    console.error("Erro ao listar histórico:", error);
    return res.status(500).json({
      message: "Erro ao listar histórico",
      error: error.message
    });
  }
};

exports.getHistoryReport = async (req, res) => {
  try {
    const query = buildHistoryQueryFromRequest(req);

    const topMonthLimit = toInt(req.query.topMonthLimit, 10);
    const weeklyThresholdHours = toInt(req.query.weeklyThresholdHours, 6);

    const weeklyThresholdMin = weeklyThresholdHours * 60;
    const intermediateMin = 1;
    const intermediateMax = weeklyThresholdMin - 1;

    const lista = (await PatrolHoursHistory.find(query).lean()).map(normalizeHistoryOfficer);

    const totalSemanaMin = lista.reduce((acc, item) => acc + (item.horasSemanaMin || 0), 0);
    const totalMesMin = lista.reduce((acc, item) => acc + (item.horasMesMin || 0), 0);

    const ativos = lista.filter((item) => item.status === "Ativo").length;
    const ausentes = lista.filter((item) => item.status === "Ausente").length;
    const afastados = lista.filter((item) => item.status === "Afastado").length;

    const topMonth = [...lista].sort(sortMonthDesc).slice(0, topMonthLimit);
    const topWeek = [...lista].sort(sortWeekDesc).slice(0, topMonthLimit);

    const weekAboveThreshold = [...lista]
      .filter((item) => (item.horasSemanaMin || 0) >= weeklyThresholdMin)
      .sort(sortWeekDesc);

    const weekBetween1mAnd5h59 = [...lista]
      .filter((item) => {
        const value = item.horasSemanaMin || 0;
        return value >= intermediateMin && value <= intermediateMax;
      })
      .sort(sortWeekDesc);

    const weekZero = [...lista]
      .filter((item) => (item.horasSemanaMin || 0) === 0)
      .sort(sortHierarchyAsc);

    const averageWeekMin = lista.length ? Math.round(totalSemanaMin / lista.length) : 0;
    const averageMonthMin = lista.length ? Math.round(totalMesMin / lista.length) : 0;

    return res.json({
      period: "history",
      generatedAt: new Date(),
      filtersApplied: {
        status: req.query.status || "todos",
        patente: req.query.patente || "todas",
        search: req.query.search || "",
        funcional: req.query.funcional || "",
        ausencia: req.query.ausencia || "todas",
        dataInicio: req.query.dataInicio || "",
        dataFim: req.query.dataFim || "",
        topMonthLimit,
        weeklyThresholdHours
      },
      summary: {
        totalPoliciais: lista.length,
        ativos,
        ausentes,
        afastados,
        totalSemanaMin,
        totalMesMin,
        mediaSemanaMin: averageWeekMin,
        mediaMesMin: averageMonthMin,
        totalTopMes: topMonth.length,
        totalTopSemana: topWeek.length,
        totalAcimaThresholdSemana: weekAboveThreshold.length,
        totalEntre1MinEAbaixoDoLimite: weekBetween1mAnd5h59.length,
        totalZeroSemana: weekZero.length
      },
      sections: {
        topMonth,
        topWeek,
        weekAboveThreshold,
        weekBetween1mAnd5h59,
        weekZero
      }
    });
  } catch (error) {
    console.error("Erro ao gerar relatório histórico:", error);
    return res.status(500).json({
      message: "Erro ao gerar relatório histórico",
      error: error.message
    });
  }
};

exports.updateAbsenceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { ausenciaPatrulhamento, observacaoAusencia } = req.body;

    if (!AUSENCIAS_PERMITIDAS.includes(ausenciaPatrulhamento)) {
      return res.status(400).json({
        message: "Status de ausência inválido"
      });
    }

    const item = await PatrolHours.findByIdAndUpdate(
      id,
      {
        ausenciaPatrulhamento,
        observacaoAusencia: observacaoAusencia || ""
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({
        message: "Policial não encontrado"
      });
    }

    return res.json({
      message: "Ausência atualizada com sucesso",
      item
    });
  } catch (error) {
    console.error("Erro ao atualizar ausência:", error);
    return res.status(500).json({
      message: "Erro ao atualizar ausência",
      error: error.message
    });
  }
};

exports.resetWeekly = async (req, res) => {
  try {
    const registros = await PatrolHours.find().lean();

    const historico = buildWeeklyHistoryPayload(registros);
    const invalidos = registros.filter((item) => !isRegistroValidoParaHistorico(item));

    let historyInsertedCount = 0;
    let historyErrors = [];

    if (historico.length > 0) {
      try {
        const inserted = await PatrolHoursHistory.insertMany(historico, {
          ordered: false
        });
        historyInsertedCount = inserted.length;
      } catch (err) {
        historyInsertedCount = err?.insertedDocs?.length || 0;
        historyErrors =
          err?.writeErrors?.map((e) => e?.errmsg || e?.message).filter(Boolean) || [err.message];

        console.error("Erro parcial ao salvar histórico semanal:", err);
      }
    }

    const result = await PatrolHours.updateMany(
      {},
      {
        $set: {
          horasSemanaMin: 0,
          ausenciaPatrulhamento: "normal",
          observacaoAusencia: ""
        }
      }
    );

    return res.json({
      message: "Horas semanais zeradas com sucesso",
      modifiedCount: result.modifiedCount || 0,
      historyInsertedCount,
      skippedInvalidCount: invalidos.length,
      historyErrors
    });
  } catch (error) {
    console.error("Erro ao zerar horas semanais:", error);
    return res.status(500).json({
      message: "Erro ao zerar horas semanais",
      error: error.message
    });
  }
};

exports.resetMonthly = async (req, res) => {
  try {
    const registros = await PatrolHours.find().lean();

    const historico = buildMonthlyHistoryPayload(registros);
    const invalidos = registros.filter((item) => !isRegistroValidoParaHistorico(item));

    let historyInsertedCount = 0;
    let historyErrors = [];

    if (historico.length > 0) {
      try {
        const inserted = await PatrolHoursHistory.insertMany(historico, {
          ordered: false
        });
        historyInsertedCount = inserted.length;
      } catch (err) {
        historyInsertedCount = err?.insertedDocs?.length || 0;
        historyErrors =
          err?.writeErrors?.map((e) => e?.errmsg || e?.message).filter(Boolean) || [err.message];

        console.error("Erro parcial ao salvar histórico mensal:", err);
      }
    }

    const result = await PatrolHours.updateMany(
      {},
      {
        $set: {
          horasMesMin: 0
        }
      }
    );

    return res.json({
      message: "Horas mensais zeradas com sucesso",
      modifiedCount: result.modifiedCount || 0,
      historyInsertedCount,
      skippedInvalidCount: invalidos.length,
      historyErrors
    });
  } catch (error) {
    console.error("Erro ao zerar horas mensais:", error);
    return res.status(500).json({
      message: "Erro ao zerar horas mensais",
      error: error.message
    });
  }
};

exports.clearHistory = async (req, res) => {
  try {
    await PatrolHoursHistory.deleteMany({});

    return res.json({
      message: "Histórico apagado com sucesso"
    });
  } catch (error) {
    console.error("Erro ao apagar histórico:", error);
    return res.status(500).json({
      message: "Erro ao apagar histórico",
      error: error.message
    });
  }
};