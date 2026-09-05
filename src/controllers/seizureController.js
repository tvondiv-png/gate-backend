const Seizure = require("../models/Seizure");
const SeizureBalance = require("../models/SeizureBalance");

const transformarEmBalanco = (itens = []) => {
  const buscar = (tipo) =>
    Number(
      itens.find((item) => item.tipo === tipo)?.quantidade || 0
    );

  return {
    armas: buscar("Armas"),
    municoes: buscar("Munições"),
    entorpecentes: buscar("Entorpecentes"),
    ilicitos: buscar("Ilicitos"),
    valores: buscar("Valores")
  };
};

// =========================================================
// PÚBLICO
// =========================================================

exports.listPublic = async (req, res) => {
  try {
    const itens = await Seizure.find().sort({ tipo: 1 });

    return res.json(itens);
  } catch (err) {
    console.error("Erro listPublic apreensões:", err);

    return res.status(500).json({
      message: "Erro ao carregar apreensões"
    });
  }
};

// =========================================================
// ADMIN
// =========================================================

exports.listAdmin = async (req, res) => {
  try {
    const itens = await Seizure.find().sort({ tipo: 1 });

    return res.json(itens);
  } catch (err) {
    console.error("Erro listAdmin apreensões:", err);

    return res.status(500).json({
      message: "Erro ao carregar apreensões"
    });
  }
};

// =========================================================
// DADOS ATUAIS PARA PRÉVIA
// =========================================================

exports.previewBalance = async (req, res) => {
  try {
    const itens = await Seizure.find().lean();

    return res.json(transformarEmBalanco(itens));
  } catch (err) {
    console.error("Erro preview balanço:", err);

    return res.status(500).json({
      message: "Erro ao gerar prévia do balanço"
    });
  }
};

// =========================================================
// FECHAR MÊS
// =========================================================

exports.closeBalance = async (req, res) => {
  try {
    const ano = Number(req.body.ano);
    const mes = Number(req.body.mes);

    if (
      !Number.isInteger(ano) ||
      !Number.isInteger(mes) ||
      mes < 1 ||
      mes > 12
    ) {
      return res.status(400).json({
        message: "Mês ou ano inválido"
      });
    }

    const existente = await SeizureBalance.findOne({
      ano,
      mes
    });

    if (existente) {
      return res.status(409).json({
        message: "Já existe balanço fechado para esse período",
        balance: existente
      });
    }

    const itens = await Seizure.find().lean();

    const dados = transformarEmBalanco(itens);

    const balance = await SeizureBalance.create({
      ano,
      mes,
      ...dados,
      fechadoPor: req.user?.id || null
    });

    return res.status(201).json({
      message: "Balanço mensal fechado com sucesso",
      balance
    });
  } catch (err) {
    console.error("Erro ao fechar balanço:", err);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "Esse período já possui balanço"
      });
    }

    return res.status(500).json({
      message: "Erro ao fechar balanço mensal"
    });
  }
};

// =========================================================
// LISTAR BALANÇOS
// =========================================================

exports.listBalances = async (req, res) => {
  try {
    const balances = await SeizureBalance.find()
      .sort({
        ano: -1,
        mes: -1
      })
      .populate(
        "fechadoPor",
        "nome funcional"
      );

    return res.json(balances);
  } catch (err) {
    console.error("Erro ao listar balanços:", err);

    return res.status(500).json({
      message: "Erro ao listar balanços"
    });
  }
};

// =========================================================
// BUSCAR BALANÇO
// =========================================================

exports.getBalance = async (req, res) => {
  try {
    const ano = Number(req.params.ano);
    const mes = Number(req.params.mes);

    const balance = await SeizureBalance.findOne({
      ano,
      mes
    });

    if (!balance) {
      return res.status(404).json({
        message: "Balanço não encontrado"
      });
    }

    return res.json(balance);
  } catch (err) {
    console.error("Erro ao buscar balanço:", err);

    return res.status(500).json({
      message: "Erro ao buscar balanço"
    });
  }
};

// =========================================================
// ZERAR CONTADORES ATUAIS
// =========================================================

exports.reset = async (req, res) => {
  try {
    await Seizure.updateMany(
      {},
      {
        quantidade: 0
      }
    );

    return res.json({
      message: "Apreensões zeradas com sucesso"
    });
  } catch (err) {
    console.error("Erro ao zerar apreensões:", err);

    return res.status(500).json({
      message: "Erro ao zerar apreensões"
    });
  }
};

// =========================================================
// FUNÇÃO INTERNA
// =========================================================

exports.somarApreensoes = async (apreensoes = []) => {
  for (const ap of apreensoes) {
    await Seizure.findOneAndUpdate(
      {
        tipo: ap.tipo
      },
      {
        $inc: {
          quantidade: Number(ap.quantidade || 0)
        }
      },
      {
        upsert: true,
        new: true
      }
    );
  }
};