const express = require("express");
const router = express.Router();

// Controllers
const { renderIndex, renderAbout, renderSensor, handleSensorData } = require("../controllers/index.controller");

router.get("/", renderIndex);
router.get("/about", renderAbout);
router.get("/sensor", renderSensor); // Vista para mostrar el formulario

module.exports = router;
