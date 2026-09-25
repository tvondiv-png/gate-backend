const PushSubscription = require("../models/PushSubscription");
const { VAPID_PUBLIC_KEY } = require("../services/pushService");

exports.getPublicKey = (req, res) => {
  return res.json({ publicKey: VAPID_PUBLIC_KEY });
};

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys, userAgent } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: "Inscrição inválida" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        user: req.user._id,
        endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent: userAgent || ""
      },
      { upsert: true }
    );

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Erro ao salvar inscrição push:", err);
    return res.status(500).json({ message: "Erro ao ativar notificações" });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ message: "Informe o endpoint" });
    }
    await PushSubscription.deleteOne({ endpoint, user: req.user._id });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao remover inscrição push:", err);
    return res.status(500).json({ message: "Erro ao desativar notificações" });
  }
};
