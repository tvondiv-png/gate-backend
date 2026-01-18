const RSO = require("../models/RSO");
const RSOHistory = require("../models/RSOHistory");
const { registrarHoras } = require("../services/patrolHoursService");
const logAction = require("../utils/logAction");
const { somarApreensoes } = require("./seizureController");

// ============================
// LISTAR RSOs PENDENTES
// ============================
exports.listPendentes = async (req, res) => {
  const rsos = await RSO.find({ status: "Pendente" }).sort({
    createdAt: -1
  });

  res.json(rsos);
};

// ============================
// APROVAR RSO
// ============================
exports.aprovarRSO = async (req, res) => {
  try {
    const rso = await RSO.findById(req.params.id);

    if (!rso || rso.status !== "Pendente") {
      return res.status(400).json({ message: "RSO inválido" });
    }

    // 🔥 SOMAR APREENSÕES
    if (rso.apreensoes && rso.apreensoes.length > 0) {
      await somarApreensoes(rso.apreensoes);
    }

    // 🔥 SOMAR HORAS
    const integrantes = [
      rso.equipeFixa.chefe,
      rso.equipeFixa.auxiliar,
      ...Object.values(rso.equipeRotativa).flat()
    ];

    let totalMinutos = 0;

    for (const p of integrantes) {
      if (p?.tempoMinutos > 0) {
        totalMinutos += p.tempoMinutos;
        await registrarHoras(p.funcional, p.tempoMinutos);
      }
    }

    // 🔥 CRIAR HISTÓRICO
    await RSOHistory.create({
      rsoId: rso._id,
      viatura: rso.viatura,
      equipeFixa: rso.equipeFixa,
      equipeRotativa: rso.equipeRotativa,
      apreensoes: rso.apreensoes,
      totalMinutos,
      aprovadoPor: req.user.id
    });

    // 🔥 ATUALIZAR STATUS
    rso.status = "Aprovado";
    await rso.save();

    // 🔥 LOG
    await logAction({
      action: "RSO APROVADO",
      performedBy: req.user.id,
      details: `RSO ${rso._id} aprovado`
    });

    res.json({ message: "RSO aprovado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// ============================
// REJEITAR RSO
// ============================
exports.rejeitar = async (req, res) => {
  try {
    const { motivo } = req.body;

    const rso = await RSO.findById(req.params.id);
    if (!rso) {
      return res.status(404).json({ message: "RSO não encontrado" });
    }

    rso.status = "Rejeitado";
    rso.comentarioADM = motivo || "";

    await rso.save();

    await logAction({
      action: "RSO REJEITADO",
      performedBy: req.user.id,
      details: `RSO ${rso._id} rejeitado`
    });

    res.json({ message: "RSO rejeitado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
