const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:contato@gatebcrp.lat",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

/* =========================================================
   Envia push para um ou vários usuários (por ObjectId).
   Não lança erro para quem chamou — falhas de envio (ex.:
   inscrição expirada) só removem a inscrição inválida.
========================================================= */
async function enviarPush(userIds, payload) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const ids = (Array.isArray(userIds) ? userIds : [userIds]).map(String);
  if (ids.length === 0) return;

  const subs = await PushSubscription.find({ user: { $in: ids } }).lean();
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          body
        );
      } catch (err) {
        // 404/410 = inscrição não existe mais no navegador
        if (err.statusCode === 404 || err.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: sub._id });
        } else {
          console.error("Erro ao enviar push:", err.message);
        }
      }
    })
  );
}

module.exports = { enviarPush, VAPID_PUBLIC_KEY };
