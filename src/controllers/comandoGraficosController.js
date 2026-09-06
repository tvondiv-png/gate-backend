const PatrolHoursHistory = require("../models/PatrolHoursHistory");
const PatrolHours = require("../models/PatrolHours");
const Action = require("../models/Action");

const fmtDia = (d) => {
  const x = new Date(d);
  return `${String(x.getDate()).padStart(2, "0")}/${String(
    x.getMonth() + 1
  ).padStart(2, "0")}`;
};

/* Agrupa por "lote de reset" (createdAt arredondado ao minuto). */
function agruparResets(registros) {
  const grupos = new Map();
  for (const r of registros) {
    const chave = new Date(r.createdAt);
    chave.setSeconds(0, 0);
    const k = chave.getTime();
    if (!grupos.has(k)) grupos.set(k, { data: chave, min: 0, n: 0 });
    const g = grupos.get(k);
    g.min += r.horasSemanaMin || r.horasMesMin || 0;
    g.n += 1;
  }
  return [...grupos.values()].sort((a, b) => a.data - b.data);
}

/* =========================================================
   COMANDO — DADOS PARA OS GRÁFICOS
========================================================= */
exports.getGraficos = async (req, res) => {
  try {
    /* ---- horas por semana (histórico de reset_week) ---- */
    const hist = await PatrolHoursHistory.find({ tipoRegistro: "reset_week" })
      .sort({ createdAt: -1 })
      .limit(1200)
      .select("horasSemanaMin createdAt")
      .lean();

    const grupos = agruparResets(hist).slice(-8);
    const horasPorSemana = grupos.map((g) => ({
      rotulo: fmtDia(g.data),
      horas: Math.round(g.min / 60),
      media: g.n > 0 ? Math.round((g.min / 60 / g.n) * 10) / 10 : 0,
      policiais: g.n
    }));

    /* ---- ações aprovadas por semana (últimas 8) ---- */
    const desde = new Date();
    desde.setDate(desde.getDate() - 8 * 7);

    const acoes = await Action.find({
      status: "APROVADA",
      excluidoHistorico: false,
      dataAcao: { $gte: desde }
    })
      .select("dataAcao")
      .lean();

    const semanas = [];
    for (let i = 7; i >= 0; i--) {
      const fim = new Date();
      fim.setDate(fim.getDate() - i * 7);
      fim.setHours(23, 59, 59, 999);
      const ini = new Date(fim);
      ini.setDate(fim.getDate() - 6);
      ini.setHours(0, 0, 0, 0);
      semanas.push({
        rotulo: fmtDia(ini),
        ini,
        fim,
        aprovadas: 0
      });
    }
    for (const a of acoes) {
      const d = new Date(a.dataAcao);
      const s = semanas.find((w) => d >= w.ini && d <= w.fim);
      if (s) s.aprovadas++;
    }
    const acoesPorSemana = semanas.map((w) => ({
      rotulo: w.rotulo,
      aprovadas: w.aprovadas
    }));

    /* ---- ranking de horas no mês (top 8) ---- */
    const ph = await PatrolHours.find({ status: "Ativo" })
      .sort({ horasMesMin: -1 })
      .limit(8)
      .select("nome patente horasMesMin")
      .lean();
    const rankingHoras = ph.map((p) => ({
      nome: p.nome,
      patente: p.patente,
      horas: Math.round(((p.horasMesMin || 0) / 60) * 10) / 10
    }));

    return res.json({ horasPorSemana, acoesPorSemana, rankingHoras });
  } catch (err) {
    console.error("Erro getGraficos:", err);
    return res.status(500).json({ message: "Erro ao carregar os gráficos" });
  }
};
