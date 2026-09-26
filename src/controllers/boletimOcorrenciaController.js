const BoletimOcorrencia = require("../models/BoletimOcorrencia");
const RSO = require("../models/RSO");

const {
  gerarRelato,
  gerarTextoCompleto
} = require("../services/boletimOcorrenciaService");

/* =========================================================
   GERAR BOLETIM
========================================================= */

exports.criar = async (req, res) => {
  try {
    const {
      rso,
      viatura,
      equipe,
      naturezaFatos,
      local,
      abordagem,
      suspeito,
      veiculoSuspeito,
      ilicitos
    } = req.body;

    if (!viatura || !String(viatura).trim()) {
      return res.status(400).json({ message: "Informe a viatura" });
    }

    if (!Array.isArray(naturezaFatos) || naturezaFatos.length === 0) {
      return res.status(400).json({
        message: "Selecione ao menos um artigo na natureza dos fatos"
      });
    }

    if (!local?.rua?.trim() || !local?.bairro?.trim()) {
      return res.status(400).json({ message: "Informe rua e bairro do local" });
    }

    if (!abordagem?.tipo || !abordagem?.resultado || !abordagem?.ordemDadaPor?.trim()) {
      return res.status(400).json({
        message: "Preencha o tipo de abordagem, quem deu a ordem e o resultado"
      });
    }

    let rsoRef = null;

    if (rso) {
      const rsoDoc = await RSO.findOne({
        _id: rso,
        criadoPor: req.user.id
      })
        .select("_id")
        .lean();

      if (rsoDoc) {
        rsoRef = rsoDoc._id;
      }
    }

    const ilicitosFinal = Array.isArray(ilicitos) ? ilicitos : [];

    const relatoTexto = gerarRelato({
      viatura,
      abordagem,
      ilicitos: ilicitosFinal
    });

    const textoCompleto = gerarTextoCompleto({
      viatura,
      equipe: Array.isArray(equipe) ? equipe : [],
      naturezaFatos,
      local,
      relatoTexto,
      suspeito,
      veiculoSuspeito,
      ilicitos: ilicitosFinal
    });

    const boletim = await BoletimOcorrencia.create({
      criadoPor: req.user.id,
      funcionalCriador: req.user.funcional,
      nomeCriador: req.user.nome,
      patenteCriador: req.user.patente,

      rso: rsoRef,

      viatura: String(viatura).trim(),
      equipe: Array.isArray(equipe) ? equipe : [],
      naturezaFatos,
      local,
      abordagem,
      suspeito: suspeito || {},
      veiculoSuspeito: veiculoSuspeito || { possui: false },
      ilicitos: ilicitosFinal,

      relatoTexto,
      textoCompleto
    });

    return res.status(201).json({
      message: "Boletim gerado com sucesso",
      boletim
    });
  } catch (err) {
    console.error("Erro ao gerar boletim de ocorrência:", err);
    return res.status(500).json({
      message: "Erro ao gerar boletim de ocorrência"
    });
  }
};

/* =========================================================
   MEUS BOLETINS
========================================================= */

exports.listarMeus = async (req, res) => {
  try {
    const lista = await BoletimOcorrencia.find({ criadoPor: req.user.id })
      .sort({ createdAt: -1 })
      .select("viatura local naturezaFatos abordagem.resultado createdAt")
      .lean();

    return res.json(lista);
  } catch (err) {
    console.error("Erro ao listar boletins:", err);
    return res.status(500).json({ message: "Erro ao listar boletins" });
  }
};

/* =========================================================
   TODOS OS BOLETINS (COMANDO / ADM)
========================================================= */

exports.listarTodos = async (req, res) => {
  try {
    const lista = await BoletimOcorrencia.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .select(
        "viatura local naturezaFatos abordagem.resultado nomeCriador patenteCriador funcionalCriador createdAt"
      )
      .lean();

    return res.json(lista);
  } catch (err) {
    console.error("Erro ao listar todos os boletins:", err);
    return res.status(500).json({ message: "Erro ao listar boletins" });
  }
};

/* =========================================================
   BUSCAR UM BOLETIM

   Autor vê o próprio. Comando/ADM veem qualquer um (checado
   pelo mesmo critério do adminOuComando, sem exigir middleware
   pra não duplicar rota).
========================================================= */

exports.getById = async (req, res) => {
  try {
    const podeVerTodos =
      req.user.role === "admin" ||
      req.user.role === "superadmin" ||
      req.user.role === "comando" ||
      req.user.funcao === "Comando do Batalhão" ||
      req.user.funcao === "Subcomando do Batalhão";

    const filtro = podeVerTodos
      ? { _id: req.params.id }
      : { _id: req.params.id, criadoPor: req.user.id };

    const boletim = await BoletimOcorrencia.findOne(filtro).lean();

    if (!boletim) {
      return res.status(404).json({ message: "Boletim não encontrado" });
    }

    return res.json(boletim);
  } catch (err) {
    console.error("Erro ao buscar boletim:", err);
    return res.status(500).json({ message: "Erro ao buscar boletim" });
  }
};

/* =========================================================
   EXCLUIR BOLETIM (SÓ O PRÓPRIO AUTOR)
========================================================= */

exports.excluir = async (req, res) => {
  try {
    const boletim = await BoletimOcorrencia.findOneAndDelete({
      _id: req.params.id,
      criadoPor: req.user.id
    });

    if (!boletim) {
      return res.status(404).json({
        message: "Boletim não encontrado ou você não é o autor"
      });
    }

    return res.json({ message: "Boletim excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir boletim:", err);
    return res.status(500).json({ message: "Erro ao excluir boletim" });
  }
};
