

const indexCtrl = {};

indexCtrl.renderIndex = (req, res) => {
  res.render('index');
};

indexCtrl.renderAbout = (req, res) => {
  res.render('about');
};

indexCtrl.renderHome = (req, res) => {
  res.render('home');
};

indexCtrl.renderSensor = (req, res) => {
  res.render('sensor');
};

indexCtrl.renderFC = (req, res) => {
  res.render('fc');
};
module.exports = indexCtrl;