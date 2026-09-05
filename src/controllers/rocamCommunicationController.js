const User = require("../models/User");
const RocamProfile = require("../models/RocamProfile");
const RocamMessage = require("../models/RocamMessage");
const RocamNotice = require("../models/RocamNotice");

/* =========================================================
   LISTAR DESTINATÁRIOS ROCAM
========================================================= */

exports.listContacts = async (req, res) => {
  try {
    const profiles =
      await RocamProfile.find({
        ativo: true
      })
        .select(
          "user funcional nome patente papelRocam"
        )
        .sort({
          nome: 1
        })
        .lean();

    return res.json(
      profiles.filter(
        (item) =>
          String(item.user) !==
          String(req.user.id)
      )
    );
  } catch (err) {
    console.error(
      "Erro listContacts ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar contatos ROCAM"
    });
  }
};

/* =========================================================
   CAIXA DE ENTRADA
========================================================= */

exports.inbox = async (req, res) => {
  try {
    const mensagens =
      await RocamMessage.find({
        destinatario:
          req.user.id,

        apagadaDestinatario:
          false
      })
        .populate(
          "remetente",
          "nome funcional patente"
        )
        .sort({
          createdAt: -1
        })
        .lean();

    return res.json(mensagens);
  } catch (err) {
    console.error(
      "Erro inbox ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar mensagens"
    });
  }
};

/* =========================================================
   ENVIADAS
========================================================= */

exports.sent = async (req, res) => {
  try {
    const mensagens =
      await RocamMessage.find({
        remetente:
          req.user.id,

        apagadaRemetente:
          false
      })
        .populate(
          "destinatario",
          "nome funcional patente"
        )
        .sort({
          createdAt: -1
        })
        .lean();

    return res.json(mensagens);
  } catch (err) {
    console.error(
      "Erro sent ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar mensagens enviadas"
    });
  }
};

/* =========================================================
   ENVIAR
========================================================= */

exports.sendMessage = async (req, res) => {
  try {
    const {
      destinatario,
      assunto,
      mensagem
    } = req.body;

    if (
      !destinatario ||
      !assunto?.trim() ||
      !mensagem?.trim()
    ) {
      return res.status(400).json({
        message:
          "Preencha destinatário, assunto e mensagem"
      });
    }

    const perfil =
      await RocamProfile.findOne({
        user: destinatario,
        ativo: true
      }).lean();

    if (!perfil) {
      return res.status(404).json({
        message:
          "Destinatário ROCAM não encontrado"
      });
    }

    const criada =
      await RocamMessage.create({
        remetente:
          req.user.id,

        destinatario,

        assunto:
          assunto.trim(),

        mensagem:
          mensagem.trim()
      });

    return res.status(201).json({
      message:
        "Mensagem enviada com sucesso",

      mensagem:
        criada
    });
  } catch (err) {
    console.error(
      "Erro sendMessage ROCAM:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao enviar mensagem"
    });
  }
};

/* =========================================================
   MARCAR COMO LIDA
========================================================= */

exports.readMessage = async (req, res) => {
  try {
    const mensagem =
      await RocamMessage.findOne({
        _id:
          req.params.id,

        destinatario:
          req.user.id
      });

    if (!mensagem) {
      return res.status(404).json({
        message:
          "Mensagem não encontrada"
      });
    }

    mensagem.lida =
      true;

    mensagem.lidaEm =
      new Date();

    await mensagem.save();

    return res.json({
      message:
        "Mensagem marcada como lida"
    });
  } catch (err) {
    return res.status(500).json({
      message:
        "Erro ao atualizar mensagem"
    });
  }
};

/* =========================================================
   AVISOS VISÍVEIS
========================================================= */

exports.listNotices = async (req, res) => {
  try {
    const profile =
      await RocamProfile.findOne({
        user:
          req.user.id,
        ativo: true
      }).lean();

    const papel =
      profile?.papelRocam;

    const agora =
      new Date();

    const filtroPublico =
      papel
        ? {
            $or: [
              {
                publico: "TODOS"
              },
              {
                publico: papel
              }
            ]
          }
        : {
            publico: "TODOS"
          };

    const avisos =
      await RocamNotice.find({
        ativo: true,

        ...filtroPublico,

        $and: [
          {
            $or: [
              {
                expiraEm: null
              },
              {
                expiraEm: {
                  $gte: agora
                }
              }
            ]
          }
        ]
      })
        .populate(
          "publicadoPor",
          "nome funcional"
        )
        .sort({
          createdAt: -1
        })
        .lean();

    return res.json(avisos);
  } catch (err) {
    console.error(
      "Erro listNotices:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao carregar avisos ROCAM"
    });
  }
};

/* =========================================================
   CRIAR AVISO
========================================================= */

exports.createNotice = async (req, res) => {
  try {
    const {
      titulo,
      mensagem,
      prioridade,
      publico,
      expiraEm
    } = req.body;

    if (
      !titulo?.trim() ||
      !mensagem?.trim()
    ) {
      return res.status(400).json({
        message:
          "Informe título e mensagem"
      });
    }

    const aviso =
      await RocamNotice.create({
        titulo:
          titulo.trim(),

        mensagem:
          mensagem.trim(),

        prioridade:
          prioridade ||
          "NORMAL",

        publico:
          Array.isArray(publico) &&
          publico.length
            ? publico
            : ["TODOS"],

        expiraEm:
          expiraEm
            ? new Date(expiraEm)
            : null,

        publicadoPor:
          req.user.id
      });

    return res.status(201).json({
      message:
        "Aviso publicado com sucesso",

      aviso
    });
  } catch (err) {
    console.error(
      "Erro createNotice:",
      err
    );

    return res.status(500).json({
      message:
        "Erro ao publicar aviso ROCAM"
    });
  }
};

/* =========================================================
   DESATIVAR AVISO
========================================================= */

exports.disableNotice = async (req, res) => {
  try {
    const aviso =
      await RocamNotice.findById(
        req.params.id
      );

    if (!aviso) {
      return res.status(404).json({
        message:
          "Aviso não encontrado"
      });
    }

    aviso.ativo =
      false;

    await aviso.save();

    return res.json({
      message:
        "Aviso removido com sucesso"
    });
  } catch (err) {
    return res.status(500).json({
      message:
        "Erro ao remover aviso"
    });
  }
};