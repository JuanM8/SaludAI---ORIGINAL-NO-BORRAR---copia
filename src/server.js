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
const PDFDocument = require('pdfkit');
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
const User = require('./models/User');

// 2. Crear el controlador el cual va a definir que se realizará con el modelo

// En el metodo CRUD (Create, Read, Update & Delete)
// Dado que solo queremos enviar y recibir los datos de mongoDB no será necesario Update y Delete



// Endpoint POST para guardar datos en MongoDB:

app.post('/sensor', async (req, res) => {
  try {
    const { altura, temperatura, genero, edad, codigo, peso } = req.body.sensores[0]; 
    console.log('Datos recibidos del cliente:');
    console.log('Altura: ', altura);
    console.log('Temperatura: ', temperatura);
    console.log('genero: ', genero);
    console.log('Edad: ', edad);
    console.log('Codigo: ', codigo);
    console.log('Peso: ', peso);
    const sensor = new SensoresModel({ temperatura, altura, genero, edad, codigo, peso });
    await sensor.save();


    console.log("Datos guardados en MongoDB:", sensor);
    res.status(201).json(sensor);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

app.post('/prueba', async (req, res) => {
  try{
    // Obtiene el mensaje enviado desde el ESP32
  const mensaje = req.body.mensaje;

  // Responde al ESP32
  res.json({ respuesta: `¿Cómo estás, ESP32? Recibí tu mensaje: ${mensaje}` });
  } catch(err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }
});

app.get('/resultados', async (req, res) => {
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


///////////////////////////Recibir frecuencia cardiaca/////////////////////////////////////////
const XLSX = require('xlsx');
const ECGModel = require('./models/ecg');

app.post('/enviar-datos', async (req, res) => {
  try {
    const datosRecibidos = req.body;
    const lecturaAnalogica = req.body.lectura_analogica;
    const ECG = new ECGModel({ lectura_analogica: lecturaAnalogica });
    await ECG.save();

    console.log("Datos guardados en MongoDB:", ECG);

    // Cargar el archivo Excel si ya existe o crear uno nuevo
    let workbook;
    try {
      workbook = XLSX.readFile('lecturas.xlsx');
    } catch (error) {
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), 'lecturas');
    }

    // Obtener la primera hoja del libro (si existe)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Obtener la última fila ocupada en la hoja
    const lastRow = XLSX.utils.sheet_to_json(worksheet).length + 2;

    // Convertir los datos de la hoja de trabajo a un arreglo de objetos
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    // Extraer solo los valores numéricos y almacenarlos en un nuevo arreglo
    const valores = data.map(objeto => objeto['0']);
    const valores2 = valores.filter(valor => valor !== null && valor !== undefined);
    const lecturaData = JSON.stringify(lecturaAnalogica);

    // Agregar nuevos datos a la hoja de cálculo
    XLSX.utils.sheet_add_json(worksheet, [{ 'lectura_analogica': lecturaAnalogica }], { skipHeader: true, origin: -1 });

    // Escribir el libro de trabajo en el archivo Excel
    XLSX.writeFile(workbook, 'lecturas.xlsx');
    //console.log('Datos escritos en el archivo Excel');
    console.log(lecturaAnalogica);
    //console.log(data);
    //console.log(valores2);
    //console.log(lecturaData);
    //console.log(typeof lecturaAnalogica);

    //console.log('Valores antes del filtro:', valores);
   // console.log('Valores después del filtro:', lecturaAnalogica);

    // Enviar una respuesta al ESP32 (opcional)
    //res.json({ mensaje: 'Datos recibidos correctamente ;D' });
    res.render('fc', { valores2: JSON.stringify(valores2), datosRecibidos, lecturaAnalogica, lecturaData});
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Error del servidor');
  }  
});

app.get('/graficas', async (req, res) => {
  try {
    // Obtén el código del usuario actual desde la colección 'users'
    const userId = req.user.id;
    const usuario = await User.findById(userId);
    const codigoUsuario = usuario.codigo; // Suponiendo que 'codigo' es el campo en la colección 'users'
    
    const temperatura = await SensoresModel.find( {temperatura: { $ne: null}, codigo: codigoUsuario}).select('temperatura');;
    const altura = await SensoresModel.find( {altura: { $ne: null}, codigo: codigoUsuario}).select('altura');
    const edad = await SensoresModel.find( {edad: { $ne: null}, codigo: codigoUsuario}).select('edad');
    const peso = await SensoresModel.find( {peso: { $ne: null}, codigo: codigoUsuario}).select('peso');

    const datos = await SensoresModel.find({ 
      altura: { $ne: null },
      temperatura: { $ne: null },
      genero: { $ne: null },  
      edad: { $ne: null },
      peso: {$ne: null},
      codigo: codigoUsuario
    }, {}, {});

     // Filtra las temperaturas, alturas, edades y pesos para evitar valores nulos
     //const temperaturaN = datos.map(dato => dato.temperatura);
     //const temperaturaArray = temperaturaN.filter(dato => dato !== null);
    
     const temperaturaN = datos.map(dato => dato.temperatura);
     const alturaN = datos.map(dato => dato.altura);
     const edadN = datos.map(dato => dato.edad);
     const pesoN = datos.map(dato => dato.peso);

    res.render('graficas', { alturaN: JSON.stringify(alturaN), datos, edadN, pesoN: JSON.stringify(pesoN), temperaturaN: JSON.stringify(temperaturaN)}); // Pasar las constantes a la plantilla
    console.log(temperaturaN);
    console.log(alturaN);
    console.log(edadN);
    console.log(datos);
    console.log("Datos obtenidos con éxito 8D");
  } catch (error) {
    console.error(error);
    res.status(500).send('Error del servidor :(');
  }


});

////////////////////Crear excel ////////////////////////////
const xl = require('excel4node'); // Para usar la función de excel
const fs = require('fs');

//FECHA
let date = new Date();
let fechaDia = date.getUTCDate();
let fechaMes = (date.getUTCMonth()) + 1; 
let fechaAño = date.getUTCFullYear();

app.get("/descargar-excel", async (req, res) => {
  try{

    //Leer los datos de lectura (m)
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile('lecturas.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const ultimos50Datos = data
    .flat()
    .filter(cell => cell !== null && cell !== undefined)
    .slice(-50);
  
  const sumaUltimos50Datos = ultimos50Datos.reduce((acc, valor) => acc + valor, 0);
  const promedioUltimos50Datos = sumaUltimos50Datos / ultimos50Datos.length;

    // Obtén el código del usuario actual desde la colección 'users'
    const userId = req.user.id;
    const usuario = await User.findById(userId);
    const codigoUsuario = usuario.codigo; // Suponiendo que 'codigo' es el campo en la colección 'users'
    const latestsensor1 = await SensoresModel.findOne({
      genero: {$ne: null},
      codigo: codigoUsuario,
    }, {}, { sort: { 'timestamp': -1 } });
    const actualsensor = await SensoresModel.find({ 
      altura: { $ne: null },
      temperatura: { $ne: null },
      genero: { $ne: null },
      edad: { $ne: null },
      peso: {$ne: null},
      codigo: codigoUsuario
    }, {}, {});

    if (actualsensor) {
      // Crear un nuevo libro de Excel (Workbook)
  var wb = new xl.Workbook();
  // Construir el nombre del archivo
  let nombreArchivo = usuario.name + " " + fechaDia + "_" + fechaMes + "_" + fechaAño + ".";
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

  //Nombres de las columnas principales (usuario)
  ws.cell(1, 1).string("Nombre").style(EstiloColumna);
  ws.cell(1, 4).string("Sexo").style(EstiloColumna);
  ws.cell(1, 7).string("Código").style(EstiloColumna);

  // Nombres de las columnas (lecturas)
  ws.cell(2, 1).string("Edad").style(EstiloColumna);
  ws.cell(2, 2).string("Altura").style(EstiloColumna);
  ws.cell(2, 3).string("Peso").style(EstiloColumna);
  ws.cell(2, 4).string("Temperatura corporal").style(EstiloColumna);
  ws.cell(2, 5).string("Ritmo cardiaco").style(EstiloColumna);
  ws.cell(2, 6).string("Promedio de oxigeno en sangre").style(EstiloColumna);

  // Nombre de la fila nombre y sexo
  ws.cell(1, 2).string(usuario.name).style(EstiloContenido);
  ws.cell(1, 5).string(latestsensor1.genero).style(EstiloContenido);
  ws.cell(1, 11).number(usuario.codigo).style(EstiloContenido);

  //Integrar datos automaticamente usando un bucle
  // Escribir datos en el archivo Excel
  for (let i = 0; i < actualsensor.length; i++) {
    const registro = actualsensor[i];
    ws.cell(i + 3, 1).number(registro.edad).style(EstiloContenido);
    ws.cell(i + 3, 2).number(registro.altura).style(EstiloContenido);
    ws.cell(i + 3, 3).number(registro.peso).style(EstiloContenido);
    ws.cell(i + 3, 4).number(registro.temperatura).style(EstiloContenido);

    // Escribir el promedio de los últimos 50 datos al lado de cada columna correspondiente
    ws.cell(i + 3, 5).number(promedioUltimos50Datos).style(EstiloContenido);  // Promedio de 'lecturas.xlsx'
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
                console.log(actualsensor);
            });
        }
    });
    console.log("Archivo", nombreArchivo,"descargado con exito");
    } else {
      console.log('No se encontraron datos del sensor para el usuario actual');
      res.status(404).send('No se encontraron datos del sensor para el usuario actual');
    }
  }catch (error){
    console.error(error);
        res.status(500).send('Error del servidor :(');
  }
});

app.get('/generar-pdf', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Consulta la base de datos para obtener las últimas variables almacenadas
    const ultimosDatos = await SensoresModel.find().sort({ timestamp: -1 }).limit(1);
    const usuario = await User.findById(userId);

    if (ultimosDatos.length > 0) {
      const ultimoDato = ultimosDatos[0];

      const alturaEnCentimetros = ultimoDato.altura;
      const alturaEnMetros = alturaEnCentimetros/100;
      const peso = ultimoDato.peso;
      const imc = (peso / (alturaEnMetros * alturaEnMetros)); // Ajustar para centímetros

      // Crear un nuevo documento PDF
      const doc = new PDFDocument();

      // Definir el nombre del archivo de salida
      const filename = 'examen_clinico.pdf';

      // Configurar encabezado HTTP para la descarga del PDF
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/pdf');

      // Pipe el PDF a la respuesta HTTP
      doc.pipe(res);

      // Agregar contenido al PDF con las últimas variables almacenadas
      doc.font('Helvetica-Bold').fontSize(20).text('Examen Clínico', { align: 'center' });
      doc.moveDown();
      doc.font('Helvetica').fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(14).text(`Nombre del Paciente: ${usuario.name}`);
      doc.font('Helvetica').fontSize(12).text(`Email: ${usuario.email}`);
       doc.font('Helvetica').fontSize(12).text(`Codigo: ${usuario.codigo}`)
      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(14).text('Resultados del Examen:', { underline: true });
      doc.moveDown();
      doc.font('Helvetica').fontSize(12).text(`Altura: ${ultimoDato.altura} cm`);
      doc.font('Helvetica').fontSize(12).text(`Temperatura: ${ultimoDato.temperatura} °C`);
      doc.font('Helvetica').fontSize(12).text(`Género: ${ultimoDato.genero}`);
      doc.font('Helvetica').fontSize(12).text(`Edad: ${ultimoDato.edad} años`);
      doc.font('Helvetica').fontSize(12).text(`Peso: ${ultimoDato.peso} Kg`);
      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(14).text('Conclusiones y Recomendaciones:', { underline: true });
      doc.moveDown();
      doc.font('Helvetica').fontSize(12).text(`IMC: ${imc.toFixed(2)}`);
      doc.moveDown();
      if (imc < 18.5){
        doc.font('Helvetica').fontSize(12).text(`Su indice de masa corporal es insuficiente, ir a nutricionista`);
      }
      else if (imc > 18.5 && imc < 25){
        doc.font('Helvetica').fontSize(12).text(`Su indice de masa corporal es normal, siga así!`);
      }else{
        doc.font('Helvetica').fontSize(12).text(`Su indice de masa es alto, ir a nutricionista`);
      }

      ////////Crear Grafico
    const lecturaAnalogica = await ECGModel.find({
      lectura_analogica: {$ne: null} },
      {},{ timestamp: -1 });
      
    console.log(lecturaAnalogica);

    const ultimosDatosLectura = lecturaAnalogica.slice(-200); //Muestra los ultimos 200 datos (para mejorar la precicisión de la gráfica)

    // Extraes solo los valores de lectura_analogica usando el método map
    const valoresLecturaAnalogica = ultimosDatosLectura.map(item => item.lectura_analogica);

    console.log(valoresLecturaAnalogica);

    // Dibujar el gráfico de barras
    doc.addPage();
    const margin = 50;
    const chartWidth = 400;
    const chartHeight = 300;

    doc.fontSize(18).text('Lectura del electrocardiograma', margin, margin);

    // Dibujar el gráfico de línea en la segunda página
    const maxYValue = Math.max(...valoresLecturaAnalogica);
    const minYValue = Math.min(...valoresLecturaAnalogica);
    const yScale = (chartHeight - 2 * margin) / (maxYValue - minYValue);
    const xScale = chartWidth / (valoresLecturaAnalogica.length - 1);

    doc.moveTo(margin, chartHeight + margin - (valoresLecturaAnalogica[0] - minYValue) * yScale);
    for (let i = 1; i < valoresLecturaAnalogica.length; i++) {
      const x = margin + i * xScale;
      const y = chartHeight + margin - (valoresLecturaAnalogica[i] - minYValue) * yScale;
      doc.lineTo(x, y);
    }
    doc.stroke();
    

    //Segunda prueba
    doc.addPage();
   // const margin = 50;
   // const chartWidth = 400;
   // const chartHeight = 300;
    const pageWidth = 612; // Ancho de la página en puntos (por defecto es tamaño carta)
    const pageHeight = 792; // Altura de la página en puntos (por defecto es tamaño carta)

    // Calcular la posición inicial del gráfico para centrarlo horizontalmente y verticalmente
    const startX = (pageWidth - chartWidth) / 2;
    const startY = (pageHeight - chartHeight) / 2;

    doc.fontSize(18).text('Lectura del electrocardiograma', startX, startY - 30, { align: 'center' });

    // Dibujar el gráfico de línea en la segunda página
   // const maxYValue = Math.max(...valoresLecturaAnalogica);
    //const minYValue = Math.min(...valoresLecturaAnalogica);
    //const yScale = (chartHeight - 2 * margin) / (maxYValue - minYValue);
    //const xScale = chartWidth / (valoresLecturaAnalogica.length - 1);

    const graphStartX = startX + margin;
    const graphStartY = startY + chartHeight + margin;

    doc.moveTo(graphStartX, graphStartY - (valoresLecturaAnalogica[0] - minYValue) * yScale);
    for (let i = 1; i < valoresLecturaAnalogica.length; i++) {
      const x = graphStartX + i * xScale;
      const y = graphStartY - (valoresLecturaAnalogica[i] - minYValue) * yScale;
      doc.lineTo(x, y);
    }
    doc.stroke('blue'); // Cambiar el color del gráfico a azul

    // Añadir valores en el eje X (horizontal)
    const xAxisValues = ['0', '50', '100', '150', '200']; // Valores que quieres mostrar en el eje X
    xAxisValues.forEach((value, index) => {
      const xPosition = graphStartX + index * (chartWidth / (xAxisValues.length - 1)); // Calcular la posición X del valor
      doc.fontSize(10).text(value, xPosition, graphStartY + 10, { align: 'center' }); // Añadir texto en la posición calculada
    });

    // Añadir valores en el eje Y (vertical)
    const yAxisValues = ['0', '25', '50', '75', '100']; // Valores que quieres mostrar en el eje Y
    yAxisValues.forEach((value, index) => {
      const yPosition = graphStartY - index * (chartHeight / (yAxisValues.length - 1)); // Calcular la posición Y del valor
      doc.fontSize(10).text(value, graphStartX - 30, yPosition, { align: 'right' }); // Añadir texto en la posición calculada
    });

      // Finalizar el PDF
      doc.end();
    } else {
      res.status(404).send('No se encontraron datos en la base de datos.');
    }
  } catch (error) {
    console.error('Error al recuperar datos de MongoDB', error);
    res.status(500).send('Error al recuperar datos de MongoDB');
  }
});

module.exports = app;
