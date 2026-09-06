const ComandoMeta = require("../models/ComandoMeta");
const User = require("../models/User");
const PatrolHours = require("../models/PatrolHours");
const Action = require("../models/Action");
const Notification = require("../models/Notification");

/* =========================================================
   HELPERS
========================================================= */

function limitesPeriodo(periodo, base) {
  const d = base ? new Date(base) : new Date();

  if (periodo === "MENSAL") {
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    return { inicio, fim };
  }

  // SEMANAL — segunda 00:00 a domingo 23:59 (semana ISO)
  const dia = d.getDay(); // 0=domingo
  const diffSegunda = dia === 0 ? -6 : 1 - dia;
  const inicio = new Date(d);
  inicio.setDate(d.getDate() + diffSegunda);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  return { inicio, fim };
}

/* Marca como expirada toda meta cujo prazo passou. */
async function expirarVencidas() {
  await ComandoMeta.updateMany(
    { expirada: false, dataFim: { $lt: new Date() } },
    { $set: { expirada: true, ativa: false } }
  );
}

/* Filtro de User conforme o alvo da meta. */
function filtroUsuarios(meta) {
  const base = { ativo: true };
  if (meta.alvo === "CATEGORIAS" && meta.categorias.length > 0) {
    base.categoriaHierarquia = { $in: meta.categorias };
  }
  return base;
}

/* Progresso de UM usuário numa meta. */
async function progressoUsuario(meta, user) {
  const alvo = Number(meta.valorAlvo || 0);

  if (meta.tipo === "HORAS") {
    const ph = await PatrolHours.findOne({ funcional: user.funcional }).lean();
    const min =
      meta.periodo === "MENSAL"
        ? ph?.horasMesMin || 0
        : ph?.horasSemanaMin || 0;
    const atual = Math.round((min / 60) * 10) / 10;
    return montarProgresso(atual, alvo);
  }

  // ACOES
  const n = await Action.countDocuments({
    status: "APROVADA",
    excluidoHistorico: false,
    contabilizarMeta: true,
    dataAcao: { $gte: meta.dataInicio, $lte: meta.dataFim },
    "participantes.userId": user._id
  });
  return montarProgresso(n, alvo);
}

function montarProgresso(atual, alvo) {
  const pct = alvo > 0 ? Math.min(100, (atual / alvo) * 100) : 0;
  return {
    atual,
    alvo,
    percentual: Math.round(pct),
    atingiu: atual >= alvo
  };
}

/* Progresso de VÁRIOS usuários (batch) — evita N+1. */
async function progressoLote(meta, users) {
  const alvo = Number(meta.valorAlvo || 0);
  const mapa = new Map();

  if (meta.tipo === "HORAS") {
    const funcionais = users.map((u) => u.funcional).filter((f) => f != null);
    const phs = await PatrolHours.find({ funcional: { $in: funcionais } })
      .select("funcional horasSemanaMin horasMesMin")
      .lean();
    const phMap = new Map(phs.map((p) => [p.funcional, p]));

    for (const u of users) {
      const ph = phMap.get(u.funcional);
      const min =
        meta.periodo === "MENSAL"
          ? ph?.horasMesMin || 0
          : ph?.horasSemanaMin || 0;
      const atual = Math.round((min / 60) * 10) / 10;
      mapa.set(String(u._id), montarProgresso(atual, alvo));
    }
    return mapa;
  }

  // ACOES — uma agregação
  const ids = users.map((u) => u._id);
  const agg = await Action.aggregate([
    {
      $match: {
        status: "APROVADA",
        excluidoHistorico: false,
        contabilizarMeta: true,
        dataAcao: { $gte: meta.dataInicio, $lte: meta.dataFim }
      }
    },
    { $unwind: "$participantes" },
    { $match: { "participantes.userId": { $in: ids } } },
    { $group: { _id: "$participantes.userId", n: { $sum: 1 } } }
  ]);
  const aMap = new Map(agg.map((r) => [String(r._id), r.n]));

  for (const u of users) {
    mapa.set(String(u._id), montarProgresso(aMap.get(String(u._id)) || 0, alvo));
  }
  return mapa;
}

/* =========================================================
   COMANDO — CRIAR META
========================================================= */
exports.criarMeta = async (req, res) => {
  try {
    const { titulo, descricao, tipo, periodo, valorAlvo, alvo, categorias } =
      req.body;

    if (!titulo || !String(titulo).trim()) {
      return res.status(400).json({ message: "Informe o título da meta" });
    }
    if (!["HORAS", "ACOES"].includes(tipo)) {
      return res.status(400).json({ message: "Tipo inválido" });
    }
    if (!["SEMANAL", "MENSAL"].includes(periodo)) {
      return res.status(400).json({ message: "Período inválido" });
    }
    const valor = Number(valorAlvo);
    if (!valor || valor < 1) {
      return res.status(400).json({ message: "Valor da meta inválido" });
    }

    const alvoFinal = alvo === "CATEGORIAS" ? "CATEGORIAS" : "TODOS";
    const cats =
      alvoFinal === "CATEGORIAS"
        ? (Array.isArray(categorias) ? categorias : []).filter((c) =>
            ComandoMeta.CATEGORIAS.includes(c)
          )
        : [];

    if (alvoFinal === "CATEGORIAS" && cats.length === 0) {
      return res
        .status(400)
        .json({ message: "Selecione ao menos uma categoria" });
    }

    const { inicio, fim } = limitesPeriodo(periodo);

    const meta = await ComandoMeta.create({
      titulo: String(titulo).trim(),
      descricao: String(descricao || "").trim(),
      tipo,
      periodo,
      valorAlvo: valor,
      alvo: alvoFinal,
      categorias: cats,
      dataInicio: inicio,
      dataFim: fim,
      criadaPor: {
        userId: req.user._id,
        nome: req.user.nome || ""
      }
    });

    /* Notifica os policiais afetados */
    const afetados = await User.find(filtroUsuarios(meta))
      .select("_id")
      .lean();

    if (afetados.length > 0) {
      const unidade = meta.tipo === "HORAS" ? "horas" : "ação(ões)";
      const docs = afetados.map((u) => ({
        user: u._id,
        titulo: "Atenção: meta estabelecida pelo Comando",
        mensagem:
          `${meta.titulo} — ${meta.valorAlvo} ${unidade} ` +
          `(${meta.periodo === "MENSAL" ? "no mês" : "na semana"}). ` +
          `Acompanhe no seu painel.`,
        tipo: "META_COMANDO",
        referenciaId: meta._id,
        referenciaModelo: "ComandoMeta"
      }));
      await Notification.insertMany(docs);
    }

    return res.status(201).json(meta);
  } catch (err) {
    console.error("Erro criarMeta:", err);
    return res.status(500).json({ message: "Erro ao criar a meta" });
  }
};

/* =========================================================
   COMANDO — LISTAR METAS (com resumo de progresso)
========================================================= */
exports.listarMetas = async (req, res) => {
  try {
    await expirarVencidas();

    const metas = await ComandoMeta.find().sort({ createdAt: -1 }).lean();

    const resultado = [];
    for (const meta of metas) {
      const afetados = await User.find(filtroUsuarios(meta))
        .select("_id funcional")
        .lean();

      const prog = await progressoLote(meta, afetados);

      let atingiram = 0;
      let somaPct = 0;

      for (const u of afetados) {
        const p = prog.get(String(u._id));
        if (p?.atingiu) atingiram++;
        somaPct += p?.percentual || 0;
      }

      resultado.push({
        ...meta,
        resumo: {
          totalAfetados: afetados.length,
          atingiram,
          percentualMedio:
            afetados.length > 0 ? Math.round(somaPct / afetados.length) : 0
        }
      });
    }

    return res.json(resultado);
  } catch (err) {
    console.error("Erro listarMetas:", err);
    return res.status(500).json({ message: "Erro ao carregar as metas" });
  }
};

/* =========================================================
   COMANDO — DETALHE (progresso por policial)
========================================================= */
exports.detalharMeta = async (req, res) => {
  try {
    await expirarVencidas();

    const meta = await ComandoMeta.findById(req.params.id).lean();
    if (!meta) {
      return res.status(404).json({ message: "Meta não encontrada" });
    }

    const afetados = await User.find(filtroUsuarios(meta))
      .select("_id nome funcional patente categoriaHierarquia")
      .lean();

    const prog = await progressoLote(meta, afetados);

    const linhas = afetados.map((u) => ({
      funcional: u.funcional,
      nome: u.nome,
      patente: u.patente,
      categoria: u.categoriaHierarquia || "-",
      ...(prog.get(String(u._id)) || montarProgresso(0, meta.valorAlvo))
    }));

    linhas.sort((a, b) => b.percentual - a.percentual);

    return res.json({ meta, policiais: linhas });
  } catch (err) {
    console.error("Erro detalharMeta:", err);
    return res.status(500).json({ message: "Erro ao carregar o detalhe da meta" });
  }
};

/* =========================================================
   COMANDO — EXCLUIR
========================================================= */
exports.excluirMeta = async (req, res) => {
  try {
    const meta = await ComandoMeta.findById(req.params.id);
    if (!meta) {
      return res.status(404).json({ message: "Meta não encontrada" });
    }
    await meta.deleteOne();
    await Notification.deleteMany({
      referenciaId: meta._id,
      tipo: "META_COMANDO"
    });
    return res.json({ message: "Meta excluída" });
  } catch (err) {
    console.error("Erro excluirMeta:", err);
    return res.status(500).json({ message: "Erro ao excluir a meta" });
  }
};

/* =========================================================
   USUÁRIO — MINHAS METAS
========================================================= */
exports.minhasMetas = async (req, res) => {
  try {
    await expirarVencidas();

    const cat = req.user.categoriaHierarquia || null;

    const metas = await ComandoMeta.find({
      ativa: true,
      $or: [
        { alvo: "TODOS" },
        ...(cat ? [{ alvo: "CATEGORIAS", categorias: cat }] : [])
      ]
    })
      .sort({ createdAt: -1 })
      .lean();

    const uid = String(req.user._id);
    let temNaoVista = false;

    const lista = [];
    for (const meta of metas) {
      const p = await progressoUsuario(meta, req.user);
      const vista = (meta.vistoPor || []).map(String).includes(uid);
      if (!vista) temNaoVista = true;

      lista.push({
        _id: meta._id,
        titulo: meta.titulo,
        descricao: meta.descricao,
        tipo: meta.tipo,
        periodo: meta.periodo,
        valorAlvo: meta.valorAlvo,
        dataInicio: meta.dataInicio,
        dataFim: meta.dataFim,
        vista,
        ...p
      });
    }

    return res.json({ metas: lista, temNaoVista });
  } catch (err) {
    console.error("Erro minhasMetas:", err);
    return res.status(500).json({ message: "Erro ao carregar suas metas" });
  }
};

/* =========================================================
   USUÁRIO — MARCAR METAS COMO VISTAS
========================================================= */
exports.marcarVistas = async (req, res) => {
  try {
    await ComandoMeta.updateMany(
      { ativa: true, vistoPor: { $ne: req.user._id } },
      { $addToSet: { vistoPor: req.user._id } }
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error("Erro marcarVistas:", err);
    return res.status(500).json({ message: "Erro ao marcar metas" });
  }
};
