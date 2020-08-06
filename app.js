require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema ({
  username: String,
  email: String,
  password: String
});

userSchema.plugin(encrypt, {secret: process.env.SESSION_SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res) => {
  res.render( "login" );
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password
  });
  newUser.save(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.render("home", {user: req.body.username});
    }
  });
});

app.post("/login", (req,res) => {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email}, function(err, foundUser){
    if(err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === password) {
          res.render("home", {user: foundUser.username});
        }
      }
    }
  });
});

app.post("/get-word", (req, res) => {
  console.log("getting word...");
});

app.get("/logged-out", (req, res) => {
  res.render("logged-out");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
