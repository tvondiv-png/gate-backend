const Notification = require("../models/Notification");

// LISTAR notificações do usuário logado
exports.listMyNotifications = async (req, res) => {
  const notifications = await Notification.find({
    user: req.user.id
  }).sort({ createdAt: -1 });

  res.json(notifications);
};

// MARCAR como lida
exports.markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res.status(404).json({ message: "Notificação não encontrada" });
  }

  if (notification.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Acesso negado" });
  }

  notification.read = true;
  await notification.save();

  res.json(notification);
};
