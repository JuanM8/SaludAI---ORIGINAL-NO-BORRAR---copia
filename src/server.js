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

//////////////////// Manejar los datos recibidos desde el esp32 usando POST, GET y guardarlos en mongoDB //////////////////////

// 1. Importar el modelo que se encuentra en src\models\sensores.js

const SensoresModel = require('./models/sensores'); // Importa el modelo de la base de datos

// 2. Crear el controlador el cual va a definir que se realizará con el modelo

// En el metodo CRUD (Create, Read, Update & Delete)
// Dado que solo queremos enviar y recibir los datos de mongoDB no será necesario Update y Delete

// Endpoint POST para guardar datos en MongoDB:
// Segun esto, empezará a enviar los datos a la direccion /sensor
app.post('/sensor', async (req, res) => {
  try {
    const { altura } = req.body.sensores[0]; 
    console.log('Altura recibida del cliente:', altura);
    const sensor = new SensoresModel({ altura });
    await sensor.save();

    console.log("Sensor guardado en MongoDB:", sensor);
    res.status(201).json(sensor);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});


// Maneja la solicitud GET a la URL /sensores y renderiza la página "sensor.hbs" con los datos de la base de datos
// Ruta para manejar solicitudes GET a '/sensores'
app.get('/sensores', async (req, res) => {
  try {
    const latestsensor = await SensoresModel.findOne({ 
      altura: { $ne: null },
      temperatura: { $ne: null },
      genero: { $ne: null },
      edad: { $ne: null }
    }, {}, { sort: { 'timestamp': -1 } });
    
    res.render('sensor', { latestsensor }); // Pasar las constantes a la plantilla
    console.log(latestsensor);
    console.log("Datos obtenidos con éxito 8D");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor :(');
  }
});

////////////////////4. Crear excel ////////////////////////////
const xl = require('excel4node'); // Para usar la función de excel
const fs = require('fs');

//FECHA
let date = new Date();
let fechaDia = date.getUTCDate();
let fechaMes = (date.getUTCMonth()) + 1; 
let fechaAño = date.getUTCFullYear();

app.get("/descargar-excel", async (req, res) => {
  try{
    const latestsensor1 = await SensoresModel.find({ 
      altura: { $ne: null },
      temperatura: { $ne: null },
      genero: { $ne: null },
      edad: { $ne: null }
    }, {}, { sort: { 'timestamp': -1 } });

    // Crear un nuevo libro de Excel (Workbook)
  var wb = new xl.Workbook();
  // Construir el nombre del archivo
  let nombreArchivo = "Nombre " + fechaDia + "_" + fechaMes + "_" + fechaAño + ".";
  // Añadir una nueva hoja al libro (Workbook) con el nombre del archivo
  var ws = wb.addWorksheet(nombreArchivo);

  // Estilo del titulo
  var EstiloColumna = wb.createStyle({
      font: {
          name: 'Arial',
          color: '#000000',
          size: 12,
          bold: true,
      }
  });

  //Estilo del contenido
  var EstiloContenido = wb.createStyle({
      font: {
          name: 'Arial',
          color: '#494949',
          size: 11,
      }
  });

  //Nombres de las columnas
  ws.cell(1, 1).string("Nombre").style(EstiloColumna);
  ws.cell(2, 1).string("Sexo").style(EstiloColumna);
  ws.cell(2, 2).string("Edad").style(EstiloColumna);
  ws.cell(2, 3).string("Altura").style(EstiloColumna);
  ws.cell(2, 4).string("Peso").style(EstiloColumna);
  ws.cell(2, 5).string("Temperatura corporal").style(EstiloColumna);
  ws.cell(2, 6).string("Promedio de ritmo cardiaco").style(EstiloColumna);
  ws.cell(2, 7).string("Promedio de oxigeno en sangre").style(EstiloColumna);

  // Nombre de la fila nombre
  ws.cell(1, 2).string("Nombre").style(EstiloContenido);

  //Integrar datos automaticamente usando un bucle
  // Escribir datos en el archivo Excel
  for (let i = 0; i < latestsensor1.length; i++) {
    const registro = latestsensor1[i];
    ws.cell(i + 3, 1).string(registro.genero).style(EstiloContenido);
    ws.cell(i + 3, 2).string(registro.edad).style(EstiloContenido);
    ws.cell(i + 3, 3).string(registro.altura).style(EstiloContenido);
    ws.cell(i + 3, 5).string(registro.temperatura).style(EstiloContenido);
  }


    //Ruta del archivo
    const pathExcel = path.join(__dirname, 'excel', nombreArchivo + '.xlsx');
    console.log("Nombre del archivo completo: ", pathExcel); // Imprime el nombre completo del archivo
    //Escribir o guardar
    wb.write(pathExcel, function(err, stats){
        if(err) console.log(err);
        else{

            // Crear función y descargar archivo
            function downloadFile(){res.download(pathExcel);}
            downloadFile();

            // Borrar archivo
            fs.rm(pathExcel, function(err){
                if(err) console.log(err);
                else  console.log("Archivo descargado y borrado del servidor correctamente");
            });
        }
    });
    console.log("Archivo", nombreArchivo,"descargado con exito");
    //res.status(201).json(latestsensor1);    
  }catch (error){
    console.error(error);
        res.status(500).send('Error del servidor :(');
  }
  
});
module.exports = app;
