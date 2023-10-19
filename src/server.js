const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const morgan = require('morgan');
const body_parser = require('body-parser'); // Importa body-parser
const Handlebars = require('handlebars');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

const app = express();
require('./config/passport');


app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  layoutsDir: path.join(app.get('views'), 'layouts'),
  partialsDir: path.join(app.get('views'), 'partials'),
  extname: '.hbs'
}));
app.set('view engine', '.hbs');

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

app.use(require('./routes/index.routes'));
app.use(require('./routes/users.routes'));
app.use(require('./routes/interfaz.routes'));

app.use(express.static(path.join(__dirname, 'public')));

// Configura middleware para analizar JSON
app.use(body_parser.json());

/*
app.post('/sensor', (req, res) => {
  try {
    const datos = req.body;
    console.log('Datos recibidos desde el ESP32:', datos);
    console.log('Datos guardados en MongoDB:', Sensores);
    res.status(200).json({ mensaje: 'Datos recibidos con éxito', altura: datos.Sensores[0].altura});
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
*/

//////////////////// Manejar los datos recibidos desde el esp32 usando POST y guardarlos en mongoDB //////////////////////

// 1. Importar el modelo que se encuentra en src\models\sensores.js

const SensoresModel = require('./models/sensores'); // Importa el modelo de la base de datos

// 2. Crear el controlador el cual va a definir que se realizará con el modelo

//const sensoresCtrl = {}; - Aunque funciona sin esto tengo dudas XD

// En el metodo CRUD (Create, Read, Update & Delete)
// Dado que solo queremos enviar y recibir los datos de mongoDB no será necesario Update y Delete

// Endpoint POST para guardar datos en MongoDB:
// Segun esto, empezará a enviar los datos a la direccion /sensor
app.post('/sensor', async (req, res) => {
//sensoresCtrl.createSensor = async (req, res) => {
  try {
    const { altura, temperatura, genero, edad } = req.body.sensores[0]; 
    console.log('Datos recibidos del cliente:');
    console.log('Altura: ', altura);
    console.log('Temperatura: ', temperatura);
    console.log('Genero: ', genero);
    console.log('Edad: ', edad);
    const sensor = new SensoresModel({ temperatura, altura, genero, edad });
    await sensor.save();

    console.log("Sensor guardado en MongoDB:", sensor);
    res.status(201).json(sensor);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});
// Error interno del servidor
// Maneja la solicitud GET a la URL /sensores y renderiza la página "sensor.hbs" con los datos de la base de datos
// Ruta para manejar solicitudes GET a '/sensores'
app.get('/sensores', async (req, res) => {
  try {
    const sensores = await SensoresModel.find();
    res.render('/sensor', { sensores });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor');
  }
});


/*¨En este código, he eliminado la necesidad de un controlador adicional para las solicitudes GET. Cuando se hace una solicitud 
GET a la URL /sensores, se obtienen los datos de la base de datos MongoDB y se renderizan en la página "sensor.hbs" utilizando 
el motor de plantillas Handlebars. Esto se hace dentro de la misma función de enrutamiento, evitando así la necesidad de manejar 
dos solicitudes al mismo tiempo. -ChatGPT*/

/*PD: No he borrado el controlador y las rutas por si es necesario o se puede usar desde diferentes archivos */

//3. (opcional) usar rutas para controlar en que momento se enviarán los archivos
// Supongo que es mas funcional cuando se tienen diferentes archivos

//app.post('/sensor', sensoresCtrl.createSensor); // Enviar los datos a mongoDB
//router.get('/sensores', sensoresCtrl.getSensores); // Extraer de mongoDB

module.exports = app;
