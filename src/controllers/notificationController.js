const Notification = require("../models/Notification");

exports.listMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user.id
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("Erro ao listar notificações:", err);
    res.status(500).json({ message: "Erro ao listar notificações" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notificação não encontrada" });
    }

    if (notification.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Acesso negado" });
    }

    notification.lida = true;
    await notification.save();

    res.json(notification);
  } catch (err) {
    console.error("Erro ao marcar notificação como lida:", err);
    res.status(500).json({ message: "Erro ao atualizar notificação" });
  }
};