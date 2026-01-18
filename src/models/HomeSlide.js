const mongoose = require("mongoose");

const HomeSlideSchema = new mongoose.Schema(
  {
    imagem: {
      type: String,
      required: true
    },

    titulo: {
      type: String,
      default: ""
    },

    ativo: {
      type: Boolean,
      default: true
    },

    ordem: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("HomeSlide", HomeSlideSchema);
