const mongoose = require("mongoose");

/* =========================================================
   INSCRIÇÃO DE NOTIFICAÇÃO PUSH (Web Push / PWA)

   Um usuário pode ter mais de uma inscrição (celular +
   computador, por exemplo). O endpoint é a chave natural.
========================================================= */

const PushSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    endpoint: {
      type: String,
      required: true,
      unique: true
    },

    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },

    userAgent: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PushSubscription", PushSubscriptionSchema);
