const express = require("express");
const router = express.Router();

// Controller
const {
  renderInterfazForm,
  createNewInterfaz,
  renderInterfaz,
  updateInterfaz,
  editarInterfaz,
  postValorWireless,
  deleteinterfaz,
dataiot
} = require("../controllers/interfaz.controller");

// Helpers
const { isAuthenticated } = require("../helpers/auth");


router.get("/interfaz/addsensor", renderInterfazForm, isAuthenticated);
router.post("/interfaz/new-sensor", createNewInterfaz, isAuthenticated);
router.get("/interfaz", renderInterfaz, isAuthenticated);
router.get("/interfaz/edit-sensor/:id", updateInterfaz, isAuthenticated);
router.post("/interfaz/editar", editarInterfaz, isAuthenticated);
router.delete("/interfaz/delete-sensor/:id", deleteinterfaz , isAuthenticated);
// ver datos
router.get("/interfaz/visulizar-sensor/:id", dataiot, isAuthenticated);


// Recibir los valores por navegador

//recibir los valores desde equipo wireless
router.post("/interfaz/postadd", postValorWireless);

module.exports = router;
