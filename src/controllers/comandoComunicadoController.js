const ComandoComunicado = require("../models/ComandoComunicado");
const Hierarchy = require("../models/Hierarchy");
const User = require("../models/User");

function comunicaComUsuario(item, hierarchy, funcionalUsuario) {
  if (!item?.ativo) return false;

  if (item.destinoTipo === "todos") return true;

  if (item.destinoTipo === "categoria") {
    if (!hierarchy) return false;
    return item.categoria && item.categoria === hierarchy.categoria;
  }

  if (item.destinoTipo === "funcionais") {
    return Array.isArray(item.funcionais) &&
      item.funcionais.includes(Number(funcionalUsuario));
  }

  return false;
}

function formatarDestino(item) {
  if (item.destinoTipo === "todos") {
    return "Todos";
  }

  if (item.destinoTipo === "categoria") {
    return `Categoria: ${item.categoria || "-"}`;
  }

  if (item.destinoTipo === "funcionais") {
    if (Array.isArray(item.destinatarios) && item.destinatarios.length) {
      return item.destinatarios
        .map((d) => `${d.nome || "Sem nome"} (${d.funcional})`)
        .join(", ");
    }

    if (Array.isArray(item.funcionais) && item.funcionais.length) {
      return item.funcionais.join(", ");
    }

    return "Funcionais específicos";
  }

  return "-";
}

async function calcularDestinatarios(item) {
  if (!item) return [];

  if (item.destinoTipo === "todos") {
    const users = await User.find({
      ativo: true,
      status: { $ne: "Afastado" }
    })
      .select("funcional nome patente funcao status")
      .lean();

    return users.map((u) => ({
      userId: u._id,
      funcional: Number(u.funcional),
      nome: u.nome || "",
      patente: u.patente || "",
      funcao: u.funcao || "",
      status: u.status || ""
    }));
  }

  if (item.destinoTipo === "categoria") {
    const hierarquias = await Hierarchy.find({ categoria: item.categoria }).lean();

    return hierarquias.map((h) => ({
      userId: h.user,
      funcional: Number(h.funcional),
      nome: h.nome || "",
      patente: h.patente || "",
      funcao: h.funcao || "",
      status: h.status || ""
    }));
  }

  if (item.destinoTipo === "funcionais") {
    const users = await User.find({
      funcional: { $in: item.funcionais || [] }
    })
      .select("funcional nome patente funcao status")
      .lean();

    return users.map((u) => ({
      userId: u._id,
      funcional: Number(u.funcional),
      nome: u.nome || "",
      patente: u.patente || "",
      funcao: u.funcao || "",
      status: u.status || ""
    }));
  }

  return [];
}

exports.criar = async (req, res) => {
  try {
    const { titulo, mensagem, destino, categoria, funcionais, prioridade, exigeCiencia } = req.body;

    if (!titulo || !mensagem) {
      return res.status(400).json({ message: "Título e mensagem são obrigatórios" });
    }

    if (destino === "categoria" && !categoria) {
      return res.status(400).json({ message: "Informe a categoria" });
    }

    if (destino === "funcionais" && (!Array.isArray(funcionais) || !funcionais.length)) {
      return res.status(400).json({ message: "Informe ao menos um funcional" });
    }

    let destinatarios = [];

    if (destino === "funcionais") {
      const users = await User.find({
        funcional: { $in: funcionais.map(Number) }
      }).lean();

      destinatarios = users.map((u) => ({
        funcional: Number(u.funcional),
        nome: u.nome || ""
      }));
    }

    const item = await ComandoComunicado.create({
      titulo: titulo.trim(),
      mensagem: mensagem.trim(),
      prioridade: prioridade || "MEDIA",
      destinoTipo: destino || "todos",
      categoria: categoria || "",
      funcionais: Array.isArray(funcionais) ? funcionais.map(Number) : [],
      destinatarios,
      criadoPor: req.user._id,
      nomeCriador: req.user.nome || "",
      ativo: true,
      exigeCiencia: exigeCiencia !== false
    });

    return res.status(201).json({
      message: "Comunicado enviado com sucesso",
      item
    });
  } catch (err) {
    console.error("Erro ao criar comunicado comum:", err);
    return res.status(500).json({ message: "Erro ao criar comunicado" });
  }
};

exports.listar = async (req, res) => {
  try {
    const items = await ComandoComunicado.find()
      .sort({ createdAt: -1 })
      .lean();

    const enriquecidos = await Promise.all(
      items.map(async (item) => {
        const destinatarios = await calcularDestinatarios(item);
        const totalDestino = destinatarios.length;
        const totalCientes = Array.isArray(item.cientes) ? item.cientes.length : 0;

        return {
          ...item,
          destinoLabel: formatarDestino(item),
          totalDestino,
          totalCientes,
          totalPendentes: Math.max(0, totalDestino - totalCientes)
        };
      })
    );

    return res.json(enriquecidos);
  } catch (err) {
    console.error("Erro ao listar comunicados:", err);
    return res.status(500).json({ message: "Erro ao listar comunicados" });
  }
};

exports.detalhe = async (req, res) => {
  try {
    const item = await ComandoComunicado.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({ message: "Comunicado não encontrado" });
    }

    const destinatarios = await calcularDestinatarios(item);

    const cientesMap = new Map(
      (item.cientes || []).map((c) => [Number(c.funcional), c])
    );

    const lista = destinatarios.map((d) => {
      const ciente = cientesMap.get(Number(d.funcional));

      return {
        ...d,
        deuCiencia: !!ciente,
        dataCiencia: ciente?.data || null
      };
    });

    const jaDeramCiencia = lista.filter((x) => x.deuCiencia);
    const pendentes = lista.filter((x) => !x.deuCiencia);

    return res.json({
      comunicado: {
        ...item,
        destinoLabel: formatarDestino(item)
      },
      totais: {
        totalDestino: lista.length,
        totalCientes: jaDeramCiencia.length,
        totalPendentes: pendentes.length
      },
      jaDeramCiencia,
      pendentes
    });
  } catch (err) {
    console.error("Erro ao detalhar comunicado:", err);
    return res.status(500).json({ message: "Erro ao detalhar comunicado" });
  }
};

exports.buscarParaUsuario = async (req, res) => {
  try {
    const funcionalUsuario = Number(req.user.funcional);

    const hierarchy = await Hierarchy.findOne({
      funcional: funcionalUsuario
    }).lean();

    const items = await ComandoComunicado.find({ ativo: true })
      .sort({ createdAt: -1 })
      .lean();

    const filtrados = items
      .filter((item) => comunicaComUsuario(item, hierarchy, funcionalUsuario))
      .map((item) => {
        const ciente = (item.cientes || []).some(
          (x) => String(x.userId) === String(req.user._id)
        );

        return {
          ...item,
          ciente
        };
      });

    return res.json(filtrados);
  } catch (err) {
    console.error("Erro ao buscar comunicados do usuário:", err);
    return res.status(500).json({ message: "Erro ao buscar comunicados" });
  }
};

exports.marcarCiente = async (req, res) => {
  try {
    const item = await ComandoComunicado.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Comunicado não encontrado" });
    }

    const jaCiente = item.cientes.some(
      (c) => String(c.userId) === String(req.user._id)
    );

    if (!jaCiente) {
      item.cientes.push({
        userId: req.user._id,
        funcional: Number(req.user.funcional),
        nome: req.user.nome || "",
        data: new Date()
      });

      await item.save();
    }

    return res.json({ message: "Ciência registrada com sucesso" });
  } catch (err) {
    console.error("Erro ao registrar ciência:", err);
    return res.status(500).json({ message: "Erro ao registrar ciência" });
  }
};

exports.encerrar = async (req, res) => {
  try {
    const item = await ComandoComunicado.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Comunicado não encontrado" });
    }

    item.ativo = false;
    await item.save();

    return res.json({ message: "Comunicado encerrado com sucesso" });
  } catch (err) {
    console.error("Erro ao encerrar comunicado:", err);
    return res.status(500).json({ message: "Erro ao encerrar comunicado" });
  }
};