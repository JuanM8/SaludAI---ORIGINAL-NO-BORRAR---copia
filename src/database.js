
//SE CONECTA EL SERVER CON MONGO DB
const mongoose = require("mongoose");

const { NOTES_APP_MONGODB_HOST, NOTES_APP_MONGODB_DATABASE } = process.env;

const MONGODB_URI = 'mongodb+srv://iotsalud5:afIRPVQvle0VDCrG@cluster0.j48k0e6.mongodb.net/';



mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true

  })
  .then(db => console.log("DB Mongo is connected"))
  .catch(err => console.error(err));


