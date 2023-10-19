const { Schema, model } = require("mongoose");

// Definimos el esquema para el modelo del sensor ultrasónico
const SensoresSchema = new Schema(
  {
    altura: {
      type: String,
      required: false // Es obligatorio tener un valor de altura para cada registro (true)
    },
    // Campo para registrar la fecha y hora en que se registraron los datos (se generará automáticamente)
    timestamp: {
      type: Date,
      default: Date.now // Se establece automáticamente al momento de crear un nuevo registro
    }
  },
  {
    timestamps: false // Esto añade automáticamente los campos createdAt y updatedAt al registro (true)
  }
);

// Creamos el modelo 'Sensores' basado en el esquema 'SensoresSchema'
module.exports = model("Sensores", SensoresSchema);