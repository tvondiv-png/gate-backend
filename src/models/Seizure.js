const mongoose = require("mongoose");

const SeizureSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["Armas", "Munições", "Entorpecentes", "Ilicitos", "Valores"],
      required: true,
      unique: true
    },

    quantidade: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seizure", SeizureSchema);
