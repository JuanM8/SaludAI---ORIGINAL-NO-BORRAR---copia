const { Schema, model } = require("mongoose");

const ECGSchema = new Schema(
  {
    lectura_analogica: {  // Corrige el nombre del campo aquí
      type: Number,
      required: false
    },
  },
  {
    timestamps: false
  }
);

module.exports = model("ECG", ECGSchema);  // Usa ECGSchema en lugar de lectura_analogica
