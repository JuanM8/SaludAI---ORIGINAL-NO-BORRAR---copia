// Importa el modelo de Sensores desde el archivo "sensores.js"
/*const Sensores = require('../models/sensores'); 

const sensoresCtrl = {};

sensoresCtrl.createSensor = async (req, res) => {
  try {
    // Extrae la altura del cuerpo de la solicitud
    const { altura } = req.body.Sensores[0]; 

    // Agrega un log para verificar que recibiste la altura correctamente
    console.log('Altura recibida del cliente:', altura);

    // Crea una nueva instancia del modelo Sensores
    const sensor = new Sensores({ altura });

    // Guarda el sensor en la base de datos
    await sensor.save();

    // Imprimir en la consola un mensaje que incluye la altura recibida y la unidad 'cm'
    const alturaNumerica = datos.Sensores[0].altura;
    console.log('Altura recibida desde el ESP32:', `${alturaNumerica} cm`);

    console.log("Sensor guardado en MongoDB:", sensor);

    // Log para confirmar que los datos se han guardado correctamente en MongoDB
    /*console.log('Datos guardados en MongoDB:', nuevoSensor);
    res.status(201).json(sensor);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
};
module.exports = sensoresCtrl;
*/