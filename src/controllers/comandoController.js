const Hierarchy = require("../models/Hierarchy");
const PatrolHours = require("../models/PatrolHours");
const Action = require("../models/Action");
const DisciplinaryCase = require("../models/DisciplinaryCase");
const Notification = require("../models/Notification");
const HighCommandNotice = require("../models/HighCommandNotice");
const Advertencia = require("../models/Advertencia");
const RSO = require("../models/RSO");

function formatarMinutos(min) {
  if (!min) return "0h";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}min`;
  if (!m) return `${h}h`;
  return `${h}h ${m}min`;
}

function extrairParticipantesRSO(rso) {
  const participantes = [];

  if (rso?.equipeFixa?.chefe) {
    participantes.push(rso.equipeFixa.chefe);
  }

  if (rso?.equipeFixa?.auxiliar) {
    participantes.push(rso.equipeFixa.auxiliar);
  }

  const rotativa = rso?.equipeRotativa || {};

  ["motorista", "terceiro", "quarto", "quinto"].forEach((campo) => {
    if (Array.isArray(rotativa[campo])) {
      participantes.push(...rotativa[campo]);
    }
  });

  return participantes;
}

async function montarScorePoliciais() {
  const [hierarquia, patrulha, acoes, advertencias, casos, rsos] = await Promise.all([
    Hierarchy.find().lean(),
    PatrolHours.find().lean(),
    Action.find({ excluidoHistorico: { $ne: true } }).lean(),
    Advertencia.find().lean(),
    DisciplinaryCase.find().lean(),
    RSO.find().sort({ createdAt: -1 }).lean()
  ]);

  const mapaPatrulha = new Map(
    patrulha.map((p) => [Number(p.funcional), p])
  );

  const mapaAdvertencias = new Map();
  for (const adv of advertencias) {
    const funcional = Number(adv.funcional);
    mapaAdvertencias.set(funcional, (mapaAdvertencias.get(funcional) || 0) + 1);
  }

  const mapaCasos = new Map();
  for (const caso of casos) {
    const userId = String(caso.policial);
    mapaCasos.set(userId, (mapaCasos.get(userId) || 0) + 1);
  }

  const mapaRSOs = new Map();

  for (const rso of rsos) {
    const participantes = extrairParticipantesRSO(rso);

    for (const integrante of participantes) {
      const funcional = Number(integrante?.funcional);
      if (!funcional) continue;

      if (!mapaRSOs.has(funcional)) {
        mapaRSOs.set(funcional, {
          total: 0,
          ultima: null
        });
      }

      const atual = mapaRSOs.get(funcional);
      atual.total += 1;

      if (!atual.ultima) {
        atual.ultima = rso;
      }
    }
  }

  return hierarquia.map((h) => {
    const p = mapaPatrulha.get(Number(h.funcional));
    const dadosRSO = mapaRSOs.get(Number(h.funcional)) || { total: 0, ultima: null };

    const acoesPolicial = acoes.filter((a) =>
      (a.participantes || []).some(
        (part) => Number(part.funcional) === Number(h.funcional)
      )
    );

    const totalAcoes = acoesPolicial.filter(
      (a) => a.status === "APROVADA"
    ).length;

    const totalAdvertencias = mapaAdvertencias.get(Number(h.funcional)) || 0;
    const totalCasosDisciplinares = h.user
      ? mapaCasos.get(String(h.user)) || 0
      : 0;

    const horasSemanaMin = p?.horasSemanaMin || 0;
    const horasMesMin = p?.horasMesMin || 0;

    const scoreFinal =
      Math.max(0, 40 - totalAdvertencias * 5 - totalCasosDisciplinares * 6) +
      Math.min(30, Math.floor(horasSemanaMin / 20)) +
      Math.min(30, totalAcoes * 4);

    return {
      _id: h._id,
      user: h.user,
      funcional: h.funcional,
      nome: h.nome,
      patente: h.patente,
      categoria: h.categoria,
      funcao: h.funcao,
      status: h.status,
      cursos: h.cursos || [],
      medalhas: h.medalhas || [],
      dataEntrada: h.dataEntrada || null,
      dataUltimaPromocao: h.dataUltimaPromocao || null,

      horasSemanaMin,
      horasMesMin,
      horasSemanaTexto: formatarMinutos(horasSemanaMin),
      horasMesTexto: formatarMinutos(horasMesMin),
      ausenciaPatrulhamento: p?.ausenciaPatrulhamento || "normal",
      observacaoAusencia: p?.observacaoAusencia || "",

      totalAcoes,
      totalAdvertencias,
      totalCasosDisciplinares,
      totalRSOs: dadosRSO.total || 0,
      ultimaRSO: dadosRSO.ultima
        ? {
            _id: dadosRSO.ultima._id,
            viatura: dadosRSO.ultima.viatura,
            status: dadosRSO.ultima.status,
            createdAt: dadosRSO.ultima.createdAt,
            updatedAt: dadosRSO.ultima.updatedAt
          }
        : null,
      scoreFinal
    };
  });
}

exports.scoreDesempenho = async (req, res) => {
  try {
    const lista = await montarScorePoliciais();
    return res.json(lista);
  } catch (err) {
    console.error("Erro ao montar score do comando:", err);
    return res.status(500).json({ message: "Erro ao gerar score de desempenho" });
  }
};

exports.consultaRapida = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !String(q).trim()) {
      return res.status(400).json({ message: "Informe nome ou funcional" });
    }

    const termo = String(q).trim().toLowerCase();
    const funcionalNumero = Number(termo);

    const base = await montarScorePoliciais();

    const filtrados = base.filter((p) => {
      if (!Number.isNaN(funcionalNumero) && Number(p.funcional) === funcionalNumero) {
        return true;
      }

      return String(p.nome || "").toLowerCase().includes(termo);
    });

    const userIds = filtrados.map((p) => String(p.user)).filter(Boolean);

    const [acoes, casos, notices, rsos] = await Promise.all([
      Action.find({ excluidoHistorico: { $ne: true } })
        .sort({ dataAcao: -1, createdAt: -1 })
        .lean(),
      DisciplinaryCase.find({ policial: { $in: userIds } })
        .sort({ createdAt: -1 })
        .lean(),
      HighCommandNotice.find()
        .sort({ createdAt: -1 })
        .lean(),
      RSO.find().sort({ createdAt: -1 }).lean()
    ]);

    const resultado = filtrados.map((p) => {
      const acoesPolicial = acoes.filter((a) =>
        (a.participantes || []).some(
          (part) => Number(part.funcional) === Number(p.funcional)
        )
      );

      const acoesAprovadas = acoesPolicial.filter((a) => a.status === "APROVADA").length;
      const acoesPendentes = acoesPolicial.filter((a) => a.status === "PENDENTE").length;
      const acoesRejeitadas = acoesPolicial.filter((a) => a.status === "REJEITADA").length;
      const acoesReenviadas = acoesPolicial.filter((a) => a.status === "REENVIADA").length;

      const ultimaAcao = acoesPolicial[0] || null;

      const casosPolicial = casos.filter((c) => String(c.policial) === String(p.user));

      const rsosPolicial = rsos.filter((rso) =>
        extrairParticipantesRSO(rso).some(
          (integrante) => Number(integrante?.funcional) === Number(p.funcional)
        )
      );

      const ultimaRSO = rsosPolicial[0] || null;

      const noticesPolicial = notices.filter((n) =>
        (n.respostas || []).some((r) => Number(r.funcional) === Number(p.funcional))
      );

      return {
        ...p,
        totalAcoesGeral: acoesPolicial.length,
        acoesAprovadas,
        acoesPendentes,
        acoesRejeitadas,
        acoesReenviadas,
        ultimaAcao: ultimaAcao
          ? {
              numeroAcao: ultimaAcao.numeroAcao,
              tipoAcao: ultimaAcao.nomeTipoAcao || ultimaAcao.tipoAcao,
              dataAcao: ultimaAcao.dataAcao,
              status: ultimaAcao.status
            }
          : null,
        totalRSOs: rsosPolicial.length,
        ultimaRSO: ultimaRSO
          ? {
              _id: ultimaRSO._id,
              viatura: ultimaRSO.viatura,
              status: ultimaRSO.status,
              createdAt: ultimaRSO.createdAt
            }
          : null,
        ultimoComunicado: noticesPolicial[0]
          ? {
              titulo: noticesPolicial[0].titulo,
              createdAt: noticesPolicial[0].createdAt
            }
          : null,
        totalCasosDisciplinares: casosPolicial.length
      };
    });

    return res.json(resultado.slice(0, 20));
  } catch (err) {
    console.error("Erro na consulta rápida do comando:", err);
    return res.status(500).json({ message: "Erro na consulta policial" });
  }
};

exports.disciplinaResumo = async (req, res) => {
  try {
    const [advertencias, casos] = await Promise.all([
      Advertencia.find().sort({ createdAt: -1 }).lean(),
      DisciplinaryCase.find().sort({ createdAt: -1 }).lean()
    ]);

    return res.json({
      advertencias,
      casos
    });
  } catch (err) {
    console.error("Erro ao carregar disciplina do comando:", err);
    return res.status(500).json({ message: "Erro ao carregar disciplina" });
  }
};

exports.alertarZeroHoras = async (req, res) => {
  try {
    const [patrulha, hierarquia] = await Promise.all([
      PatrolHours.find({ horasSemanaMin: 0, status: "Ativo" }).lean(),
      Hierarchy.find().lean()
    ]);

    const mapaHierarchy = new Map(
      hierarquia.map((h) => [Number(h.funcional), h])
    );

    let total = 0;

    for (const p of patrulha) {
      const h = mapaHierarchy.get(Number(p.funcional));
      if (!h?.user) continue;

      await Notification.create({
        user: h.user,
        titulo: "🚨 Alerta do Comando",
        mensagem: "Você está com 0 horas de patrulha nesta semana.",
        tipo: "GERAL"
      });

      total += 1;
    }

    return res.json({ message: `Notificações enviadas: ${total}` });
  } catch (err) {
    console.error("Erro ao alertar 0h:", err);
    return res.status(500).json({ message: "Erro ao enviar alertas" });
  }
};