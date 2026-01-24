const RSO = require("../models/RSO");
const Hierarchy = require("../models/Hierarchy");
const { calcularMinutos } = require("../services/rsoTimeService");
const { policialEmRSOAtivo } = require("../services/rsoRulesService");

// ============================
// LISTAR MEUS RSOs
// ============================
exports.meusRSOs = async (req, res) => {
  const rsos = await RSO.find({ criadoPor: req.user.id }).sort({ createdAt: -1 });
  res.json(rsos);
};

// ============================
// ABRIR RSO
// ============================
exports.abrirRSO = async (req, res) => {
  try {
    const { viatura, equipeFixa } = req.body;

// 🔒 GARANTIA ABSOLUTA
const equipeRotativa = {
  motorista: Array.isArray(req.body.equipeRotativa?.motorista)
    ? req.body.equipeRotativa.motorista
    : [],
  quarto: Array.isArray(req.body.equipeRotativa?.quarto)
    ? req.body.equipeRotativa.quarto
    : [],
  quinto: Array.isArray(req.body.equipeRotativa?.quinto)
    ? req.body.equipeRotativa.quinto
    : [],
  terceiro: []
};


    if (!viatura) {
      return res.status(400).json({ message: "Viatura é obrigatória" });
    }

    if (
      !equipeFixa ||
      !equipeFixa.chefe ||
      !equipeFixa.auxiliar ||
      Number(equipeFixa.chefe.funcional) <= 0 ||
      Number(equipeFixa.auxiliar.funcional) <= 0
    ) {
      return res.status(400).json({
        message: "Chefe e Auxiliar são obrigatórios na abertura do RSO"
      });
    }

    if (
      !Array.isArray(equipeRotativa.motorista) ||
      !equipeRotativa.motorista[0]?.funcional
    ) {
      return res.status(400).json({
        message: "Motorista é obrigatório na abertura do RSO"
      });
    }

    const buscar = async (funcional, cargo) => {
      if (await policialEmRSOAtivo(funcional)) {
        throw new Error("Policial já possui ponto aberto");
      }

      const h = await Hierarchy.findOne({ funcional, status: "Ativo" });
      if (!h) throw new Error("Policial inválido");

      return {
        funcional: h.funcional,
        nome: h.nome,
        patente: h.patente,
        cargo,
        horaEntrada: new Date(),
        horaSaida: null,
        status: "Ativo",
        tempoMinutos: 0
      };
    };

    const rso = await RSO.create({
      viatura,
      equipeFixa: {
        chefe: await buscar(equipeFixa.chefe.funcional, "Chefe"),
        auxiliar: await buscar(equipeFixa.auxiliar.funcional, "Auxiliar")
      },
      equipeRotativa: {
        motorista: await Promise.all(
          equipeRotativa.motorista.map(p =>
            buscar(p.funcional, "Motorista")
          )
        ),
        quarto: await Promise.all(
          equipeRotativa.quarto.map(p =>
            buscar(p.funcional, "4º Homem")
          )
        ),
        quinto: await Promise.all(
          equipeRotativa.quinto.map(p =>
            buscar(p.funcional, "5º Homem")
          )
        )
      },
      observacoes: "",
      apreensoes: [],
      criadoPor: req.user.id
    });

    res.status(201).json(rso);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// ============================
// ADICIONAR POLICIAL
// ============================
exports.adicionarPolicial = async (req, res) => {
  const { id } = req.params;
  const { funcional, cargo } = req.body;

  const rso = await RSO.findById(id);
  if (!rso || rso.status !== "Ativo") {
    return res.status(400).json({ message: "RSO inválido" });
  }

  if (await policialEmRSOAtivo(funcional)) {
    return res.status(400).json({ message: "Policial já em outro RSO" });
  }

  const h = await Hierarchy.findOne({ funcional, status: "Ativo" });
  if (!h) return res.status(400).json({ message: "Policial inválido" });

  rso.equipeRotativa[cargo].push({
    funcional: h.funcional,
    nome: h.nome,
    patente: h.patente,
    cargo,
    horaEntrada: new Date(),
    horaSaida: null,
    status: "Ativo",
    tempoMinutos: 0
  });

  await rso.save();
  res.json(rso);
};

// ============================
// ADICIONAR APREENSÃO
// ============================
exports.adicionarApreensao = async (req, res) => {
  const { id } = req.params;
  const { tipo, quantidade } = req.body;

  const rso = await RSO.findById(id);
  if (!rso || rso.status !== "Ativo") {
    return res.status(400).json({ message: "RSO inválido" });
  }

  rso.apreensoes.push({ tipo, quantidade });
  await rso.save();

  res.json(rso);
};

// ============================
// ATUALIZAR OBSERVAÇÕES (ATIVO)
// ============================
exports.atualizarObservacoesAtivo = async (req, res) => {
  const { id } = req.params;
  const { observacoes } = req.body;

  const rso = await RSO.findById(id);
  if (!rso) return res.status(404).json({ message: "RSO não encontrado" });

  if (rso.status !== "Ativo") {
    return res.status(400).json({
      message: "Observações só podem ser alteradas com RSO ativo"
    });
  }

  rso.observacoes = observacoes || "";
  await rso.save();

  res.json(rso);
};

// ============================
// ENCERRAR POLICIAL
// ============================
exports.encerrarPolicial = async (req, res) => {
  const { id, cargo, index } = req.params;
  const rso = await RSO.findById(id);

  const p = rso?.equipeRotativa[cargo]?.[index];
  if (!p || p.status === "Encerrado") return res.json({});

  p.horaSaida = new Date();
  p.tempoMinutos = calcularMinutos(p.horaEntrada, p.horaSaida);
  p.status = "Encerrado";

  await rso.save();
  res.json({});
};

// ============================
// ENCERRAR RSO
// ============================
exports.encerrarRSO = async (req, res) => {
  const rso = await RSO.findById(req.params.id);
  const agora = new Date();

  const encerrar = p => {
    if (p.status === "Ativo") {
      p.horaSaida = agora;
      p.tempoMinutos = calcularMinutos(p.horaEntrada, agora);
      p.status = "Encerrado";
    }
  };

  encerrar(rso.equipeFixa.chefe);
  encerrar(rso.equipeFixa.auxiliar);
  Object.values(rso.equipeRotativa).flat().forEach(encerrar);

  rso.status = "Pendente";
  await rso.save();

  res.json({});
};

// ============================
// EDITAR RSO REJEITADO
// ============================
exports.editarRSORejeitado = async (req, res) => {
  const { id } = req.params;
  const { observacoes, apreensoes } = req.body;

  const rso = await RSO.findById(id);
  if (!rso) return res.status(404).json({ message: "RSO não encontrado" });

  if (rso.status !== "Rejeitado") {
    return res.status(400).json({ message: "Somente RSO rejeitado pode ser editado" });
  }

  rso.observacoes = observacoes;
  rso.apreensoes = apreensoes;

  await rso.save();
  res.json(rso);
};

// ============================
// REENVIAR RSO
// ============================
exports.reenviarRSO = async (req, res) => {
  const rso = await RSO.findById(req.params.id);

  if (!rso || rso.status !== "Rejeitado") {
    return res.status(400).json({ message: "RSO inválido" });
  }

  rso.status = "Pendente";
  rso.comentarioADM = "";
  await rso.save();

  res.json({});
};

// ============================
// EXCLUIR RSO
// ============================
exports.excluirMeuRSO = async (req, res) => {
  const rso = await RSO.findById(req.params.id);

  if (!rso || ["Ativo", "Pendente"].includes(rso.status)) {
    return res.status(400).json({ message: "Não pode excluir este RSO" });
  }

  await rso.deleteOne();
  res.json({});
};

// ============================
// ATUALIZAR OBSERVAÇÕES (FINAL)
// ============================
exports.atualizarObservacoes = async (req, res) => {
  const { id } = req.params;
  const { observacoes } = req.body;

  const rso = await RSO.findById(id);
  if (!rso) {
    return res.status(404).json({ message: "RSO não encontrado" });
  }

  if (rso.status !== "Ativo") {
    return res.status(400).json({
      message: "Observações só podem ser alteradas com RSO ativo"
    });
  }

  rso.observacoes = observacoes || "";
  await rso.save();

  res.json({ message: "Observações atualizadas" });
};
