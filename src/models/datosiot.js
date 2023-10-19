const { Schema, model } = require("mongoose");

const DatosIoTSchema = new Schema(
  {
    name: {
      type: String,
      required: false
    },
    ubicacion: {
      type: String,
      required: false
    },
    temperatura: {
      type: String,
      required: false
    },
    humedad: {
      type: String,
      required: false
    },
    token: {
      type: String,
      required: false
    },
    sensor_1: {
      type: String,
      required: false
    },
    sensor_2: {
      type: String,
      required: false
    },
    sensor_3: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = model("datosiot", DatosIoTSchema);


