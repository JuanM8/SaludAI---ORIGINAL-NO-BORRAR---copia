const usersCtrl = {};

// Models
const User = require('../models/User');

// Modules
const passport = require("passport");

usersCtrl.renderSignUpForm = (req, res) => {
  res.render('users/signup');
};

usersCtrl.renderSignUpForm = (req, res) => {
  const codigo = Math.floor(100000 + Math.random() * 900000); //Generar un código de 6 digitos
  res.render('users/signup', { codigo });
}

usersCtrl.singup = async (req, res) => {
  let errors = [];
  const { name, email, password, confirm_password, claveregistro, codigo } = req.body;
  //clave de registro para no permitir registros no deseados
  if (claveregistro != "Salud_ai") {
    errors.push({ text: "Clave de registro no coincide" });
  }
  if (password != confirm_password) {
    errors.push({ text: "Las contraseñas no coinciden" });
  }
  if (password.length < 4) {
    errors.push({ text: "La contraseña debe contener al menos 4 caracteres." });
  }
  if (errors.length > 0) {
    res.render("users/signup", {
      errors,
      claveregistro,
      name,
      email,
      password,
      confirm_password,
      codigo
    });
  } else {
    // Look for email coincidence
    const emailUser = await User.findOne({ email: email });
    const ComprobarCodigo = await User.findOne({ codigo: codigo });
    if (emailUser, ComprobarCodigo) {
      req.flash("error_msg", "El código o el correo ya están en uso.");
      res.redirect("/users/signup");
    } else {
      // Saving a New User
      const newUser = new User({ name, email, password, codigo });
      newUser.password = await newUser.encryptPassword(password);
      await newUser.save();
      req.flash("success_msg", "You are registered.");
      res.redirect("/users/signin");
    }
  }
};

usersCtrl.renderSigninForm = (req, res) => {
  res.render("users/signin");
};

usersCtrl.signin = passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/users/signin",
    failureFlash: true
  });

usersCtrl.logout = (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out now.");
  res.redirect("/users/signin");
};

module.exports = usersCtrl;
