require("dotenv").config();
const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema ({
  username: String,
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  if (req.isAuthenticated()){
    res.redirect("/home");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()){
    res.render("home", {user: "username", error: "", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;", original: "", translated: ""});
  } else {
    res.redirect("/");
  }
});

app.post("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
    console.log(err);
    res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});

app.get("/login", (req, res) => {
  if (req.isAuthenticated()){
    res.redirect("/home");
  } else {
    res.render("login");
  }
});

app.post("/login", (req,res) => {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});

app.post("/get-word", (req, res) => {
  const wordQuery = req.body.wordInput;

  var letters = /^[A-Za-z]+$/;

  if (!wordQuery) {
    res.render("home", {user: "username", error: "Please enter a word."});
  }

    if (wordQuery.match(letters)) {
      const query = wordQuery;
      const url = "https://www.dictionaryapi.com/api/v3/references/spanish/json/" + query + "?key=" + process.env.API_KEY;

      https.get(url, (response) => {
        if (response.statusCode === 200) {

          response.on("data", function(data) {

            const translationData = JSON.parse(data);
            const translation = [];

            for (i = 0; i < translationData.length; i++) {
              translation.push(translationData[i].shortdef);
            }

            if (translation) {

              const separatedArray = [];

            for (i = 0; i < translation.length; i++) {
              for (j = 0; j < translation[i].length; j++) {
                let newString = translation[i][j];
                separatedArray.push(newString.split(","));
              }
            }

              let listed = "";

              const htmlChoices = function() {
                  for (i = 0; i < separatedArray.length; i++) {
                    listed += ("<button class='transWord' name='transWord' type='submit' value='" + separatedArray[i] + "'>" + separatedArray[i] + "</button>");
                  }
                return listed;

              }

              res.render("home", {user: "username", wordChoices: htmlChoices(), error: "", displayChoice: "display:block;", wordQuery: query, displayConfirm: "display:none;", original: "", translated: ""});

            } else {
              res.render("home", {user: "username", error: "Make sure you spell your word correctly.", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;" , original: "", translated: ""});
            }

          });

        } else {
            res.render("home", {user: "username", error: "", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;" , original: "", translated: ""});
        }

      });

    } else {
      res.render("home", {user: "username", error: "Please use only alphabet characters.", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: ""});
    }

});

app.post("/word-chosen", (req, res) => {
  const wordChosen = req.body.transWord;
  const originalWord = req.body.originalWord;
  const body = req.body;

  res.render("home", {user: "username", error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:block;", original: originalWord, translated: wordChosen});

});

app.post("/confirm-word", (req, res) => {
  console.log("Saving word...");
})

app.post("/logout", (req, res) => {
  req.logout();
  res.render("logged-out");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
