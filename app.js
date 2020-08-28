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
mongoose.set('useFindAndModify', false);

const userSchema = new mongoose.Schema ({
  username: String,
  name: String,
  password: String,
  words: [{english: String, spanish: String}]
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
  res.render("register", {registerError: ""});
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()){
    let usersWords = "";
    User.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
      } else {
        for (i = 0; i < foundUser.words.length; i++) {
          const englishVersion = decodeURI(foundUser.words[i].english);
          const spanishVersion = decodeURI(foundUser.words[i].spanish);
          let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
          usersWords += currentWord;
        }

        let wordList = "";
        let beginBoxDisplay = "display:block";

        if (usersWords != "") {
          wordList = usersWords;
          beginBoxDisplay = "display:none;";
        }

        res.render("home", {user: req.user.name, error: "", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
      }
    });

  } else {
    res.redirect("/");
  }
});

app.post("/register", (req, res) => {
  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
    console.log(err);
    res.render("register", {registerError: "This email is already registered."});
    } else {
      passport.authenticate("local")(req, res, function(){
        User.findById(req.user.id, function(err, foundUser){
          if(err){
            console.log(err);
          } else {
                let userId = foundUser.id;
                User.updateOne({ _id: userId }, {
                        "name": req.body.name
                  }, (err, result) => {
                    console.log(err);
                  });
          }
        });
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

app.post("/login",
      passport.authenticate("local", {
        successRedirect: "/home",
        failureRedirect: "/login",
        failureFlash: false
  })
);

app.post("/get-word", (req, res) => {
  const wordQuery = req.body.wordInput;
  const englishSpanish = req.body.englishOrSpanish;

  var letters = /^[A-Za-z]+$/;

  if (!wordQuery) {
    res.redirect("/home");
  }

    if (wordQuery.match(letters)) {
      const query = wordQuery;
      const url = "https://www.dictionaryapi.com/api/v3/references/spanish/json/" + query + "?key=" + process.env.API_KEY;

      https.get(url, (response) => {

        if (response.statusCode === 200) {

          let body = "";

          response.on("data", function(data) {

            body += data;

          });

          response.on("end", function(){

            const translationData = JSON.parse(body);
            const translation = [];

              // Deconstruct the returned data and isolate the translated words
                for (i = 0; i < translationData.length; i++) {
                  translation.push(translationData[i].shortdef);
                }

              const separatedArray = [];

              if ((translation[0] != undefined) && (translation != [])) {

            for (i = 0; i < translation.length; i++) {
              if (translation[i] != undefined) {
                for (j = 0; j < translation[i].length; j++) {
                  let newString = translation[i][j];
                  separatedArray.push(newString.split(","));
                }
              }
            }

              let listed = "";
              // Put the translated words into HTML elements
              const htmlChoices = function() {
                  for (i = 0; i < separatedArray.length; i++) {
                    for (j = 0; j < separatedArray[i].length; j++) {
                    listed += ("<button class='transWord' name='transWord' type='submit' value='" + separatedArray[i][j] + "'>" + separatedArray[i][j] + "</button>");
                    }
                  }
                return listed;

              }
              // If the user is authenticated, display their words on the page
              if (req.isAuthenticated()){
                let usersWords = "";
                User.findById(req.user.id, function(err, foundUser){
                  if(err){
                    console.log(err);
                  } else {
                    for (i = 0; i < foundUser.words.length; i++) {
                      const englishVersion = decodeURI(foundUser.words[i].english);
                      const spanishVersion = decodeURI(foundUser.words[i].spanish);
                      let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                      usersWords += currentWord;
                    }

                    let wordList = "";
                    let beginBoxDisplay = "display:block";

                    if (usersWords != "") {
                      wordList = usersWords;
                      beginBoxDisplay = "display:none;";
                    }

                    res.render("home", {user: req.user.name, wordChoices: htmlChoices(), error: "", displayChoice: "display:block;", wordQuery: query, displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: englishSpanish, eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
                  }

                });

              } else {
                res.redirect("/");
              }
              // If there is no translation, show a spelling warning
            } else if ((translation[0] == undefined) || (translation == [])) {
              if (req.isAuthenticated()) {
                let usersWords = "";
                User.findById(req.user.id, function(err, foundUser){
                  if(err){
                    console.log(err);
                  } else {
                    for (i = 0; i < foundUser.words.length; i++) {
                      const englishVersion = decodeURI(foundUser.words[i].english);
                      const spanishVersion = decodeURI(foundUser.words[i].spanish);
                      let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                      usersWords += currentWord;
                    }

                    let wordList = "";
                    let beginBoxDisplay = "display:block";

                    if (usersWords != "") {
                      wordList = usersWords;
                      beginBoxDisplay = "display:none;";
                    }

                    res.render("home", {user: req.user.name, error: "Make sure you spell your word correctly.", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;" , original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:block;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
                  }
                });

              } else {
                res.redirect("/");
              }

            }


          });
          // If the response status code is something other than 200, render the homepage

        } else {
          if (req.isAuthenticated()){
            let usersWords = "";
            User.findById(req.user.id, function(err, foundUser){
              if(err){
                console.log(err);
              } else {
                for (i = 0; i < foundUser.words.length; i++) {
                  const englishVersion = decodeURI(foundUser.words[i].english);
                  const spanishVersion = decodeURI(foundUser.words[i].spanish);
                  let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                  usersWords += currentWord;
                }

                let wordList = "";
                let beginBoxDisplay = "display:block";

                if (usersWords != "") {
                  wordList = usersWords;
                  beginBoxDisplay = "display:none;";
                }

                res.render("home", {user: req.user.name, error: "", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;" , original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
              }
            });

          } else {
            res.redirect("/");
          }

        }

      });
// If there are non-alphabetical characters, render the page with an error
    } else {
      if (req.isAuthenticated()){
        let usersWords = "";
        User.findById(req.user.id, function(err, foundUser){
          if(err){
            console.log(err);
          } else {
            for (i = 0; i < foundUser.words.length; i++) {
              const englishVersion = decodeURI(foundUser.words[i].english);
              const spanishVersion = decodeURI(foundUser.words[i].spanish);
              let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
              usersWords += currentWord;
            }

            let wordList = "";
            let beginBoxDisplay = "display:block";

            if (usersWords != "") {
              wordList = usersWords;
              beginBoxDisplay = "display:none;";
            }

            res.render("home", {user: req.user.name, error: "Please use only alphabet characters.", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
          }
        });

      } else {
        res.redirect("/");
      }

    }

});

app.post("/word-chosen", (req, res) => {
  const wordChosen = req.body.transWord;
  const wordChosenEncoded = encodeURI(req.body.transWord);
  const originalWord = req.body.originalWord;
  const englishOrSpanish = req.body.firstLanguage;

  if (req.isAuthenticated()){
    let usersWords = "";
    User.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
      } else {
        for (i = 0; i < foundUser.words.length; i++) {
          const englishVersion = decodeURI(foundUser.words[i].english);
          const spanishVersion = decodeURI(foundUser.words[i].spanish);
          let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
          usersWords += currentWord;
        }

        let wordList = "";
        let beginBoxDisplay = "display:block";

        if (usersWords != "") {
          wordList = usersWords;
          beginBoxDisplay = "display:none;";
        }

        res.render("home", {user: req.user.name, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:block;", original: originalWord, translated: wordChosen, translatedEncoded: wordChosenEncoded, engOrSpan: "", eOrs: englishOrSpanish, duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
      }
    });

  } else {
    res.redirect("/");
  }

});

app.post("/confirm-word", (req, res) => {
  const language = req.body.initalLang;
  const providedWord = req.body.originConfirm;
  const originalWord = decodeURI(providedWord);
  const givenWord = req.body.transConfirm;
  const wordChosen = decodeURI(givenWord);

  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      if (foundUser) {
        let duplicate = false;
        if (language === "english") {

          for (i = 0; i < foundUser.words.length; i++) {
            if ((foundUser.words[i].english == providedWord) && (foundUser.words[i].spanish == givenWord)) {
              duplicate = true;
              if (req.isAuthenticated()){
                let usersWords = "";
                User.findById(req.user.id, function(err, foundUser){
                  if(err){
                    console.log(err);
                  } else {
                    for (i = 0; i < foundUser.words.length; i++) {
                      const englishVersion = decodeURI(foundUser.words[i].english);
                      const spanishVersion = decodeURI(foundUser.words[i].spanish);
                      let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                      usersWords += currentWord;
                    }

                    let wordList = "";
                    let beginBoxDisplay = "display:block";

                    if (usersWords != "") {
                      wordList = usersWords;
                      beginBoxDisplay = "display:none;";
                    }

                    res.render("home", {user: req.user.name, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:block;", original: originalWord, translated: wordChosen, translatedEncoded: providedWord, engOrSpan: "", eOrs: language, duplicateError: "You already have this word!", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
                  }
                });

              } else {
                res.redirect("/");
              }

            }
          }

            if (!duplicate) {
              let newWord = {english: providedWord, spanish: givenWord};
              foundUser.words.push(newWord);
              foundUser.save(function(){
                res.redirect("/home");
              });
            }


        }

        if (language === "spanish") {
            for (i = 0; i < foundUser.words.length; i++) {
              if ((foundUser.words[i].spanish == providedWord) && (foundUser.words[i].english == givenWord)) {
                duplicate = true;
                if (req.isAuthenticated()){
                  let usersWords = "";
                  User.findById(req.user.id, function(err, foundUser){
                    if(err){
                      console.log(err);
                    } else {
                      for (i = 0; i < foundUser.words.length; i++) {
                        const englishVersion = decodeURI(foundUser.words[i].english);
                        const spanishVersion = decodeURI(foundUser.words[i].spanish);
                        let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                        usersWords += currentWord;
                      }

                      let wordList = "";
                      let beginBoxDisplay = "display:block";

                      if (usersWords != "") {
                        wordList = usersWords;
                        beginBoxDisplay = "display:none;";
                      }

                      res.render("home", {user: req.user.name, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:block;", original: originalWord, translated: wordChosen, translatedEncoded: providedWord, engOrSpan: "", eOrs: language, duplicateError: "You already have this word!", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});
                    }
                  });

                } else {
                  res.redirect("/");
                }
                }
              }

              if (!duplicate) {
                let newWord = {english: givenWord, spanish: providedWord};
                foundUser.words.push(newWord);
                foundUser.save(function(){
                  res.redirect("/home");
                });
              }

        }
      }
    }
  });

})

app.post("/deleteWord", (req, res) => {
  const englishSide = encodeURI(req.body.englishSide);
  const spanishSide = encodeURI(req.body.spanishSide);

    let deleteComplete = false;
    let usersWords = "";
    User.findById(req.user.id, function(err, foundUser){
      if(err){
        console.log(err);
      } else {

        for (i = 0; i < foundUser.words.length; i++) {

          if ((foundUser.words[i].english == englishSide) && (foundUser.words[i].spanish == spanishSide)) {

            let userId = foundUser.id;
            let objectId = foundUser.words[i].id;

            User.updateOne({ _id: userId }, {
                "$pull": {
                  "words": {
                    "_id": objectId
                  }
                }
              }, (err, result) => {
                console.log(err);
              });
              deleteComplete = true;
              res.redirect("/home");

          }
        }
      }
        if (!deleteComplete) {

          for (i = 0; i < foundUser.words.length; i++) {
            const englishVersion = decodeURI(foundUser.words[i].english);
            const spanishVersion = decodeURI(foundUser.words[i].spanish);
            let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
            usersWords += currentWord;
          }

          let wordList = "";
          let beginBoxDisplay = "display:block";

          if (usersWords != "") {
            wordList = usersWords;
            beginBoxDisplay = "display:none;";
          }

          res.render("home", {user: req.user.name, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "You already have this word!", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:none;", confirmMessage: ""});

        }

      });

})

app.post("/changeUsername", (req,res) => {
  const newUsername = req.body.newUsername;

  User.findById(req.user.id, function(err, foundUser){
    let usersWords = "";
    if(err){
      console.log(err);
    } else {
      User.updateOne({ _id: foundUser.id }, {
              "name": newUsername
        }, (err, result) => {
          console.log(err);
        });
        for (i = 0; i < foundUser.words.length; i++) {
          const englishVersion = decodeURI(foundUser.words[i].english);
          const spanishVersion = decodeURI(foundUser.words[i].spanish);
          let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
          usersWords += currentWord;
        }

        let wordList = "";
        let beginBoxDisplay = "display:block";

        if (usersWords != "") {
          wordList = usersWords;
          beginBoxDisplay = "display:none;";
        }

        res.render("home", {user: newUsername, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:block;", confirmMessage: "Username Changed."});
    }
  });
});

app.post("/changePassword", (req,res) => {
  const oldPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  User.findById(req.user.id, function(err, foundUser){
    let usersWords = "";
    if(err){
      console.log(err);
    } else {
      req.user.changePassword(oldPassword, newPassword, function(err) {
        if (err) {
          console.log(err);
          for (i = 0; i < foundUser.words.length; i++) {
            const englishVersion = decodeURI(foundUser.words[i].english);
            const spanishVersion = decodeURI(foundUser.words[i].spanish);
            let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
            usersWords += currentWord;
          }

          let wordList = "";
          let beginBoxDisplay = "display:block";

          if (usersWords != "") {
            wordList = usersWords;
            beginBoxDisplay = "display:none;";
          }

          res.render("home", {user: req.user.name, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:block;", confirmMessage: "Incorrect password. Password was not changed. "});
        } else {

      for (i = 0; i < foundUser.words.length; i++) {
        const englishVersion = decodeURI(foundUser.words[i].english);
        const spanishVersion = decodeURI(foundUser.words[i].spanish);
        let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
        usersWords += currentWord;
      }

      let wordList = "";
      let beginBoxDisplay = "display:block";

      if (usersWords != "") {
        wordList = usersWords;
        beginBoxDisplay = "display:none;";
      }

      res.render("home", {user: req.user.name, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: req.user.username, changeConfirmBox: "display:block;", confirmMessage: "Password Changed."});
    }
      });

  }
  });
});

app.post("/changeEmail", (req,res) => {
  const newEmail = req.body.newEmail;
  User.findById(req.user.id, function(err, foundUser){
    let usersWords = "";
    if(err){
      console.log(err);
    } else {
      User.updateOne({ _id: foundUser.id }, {
              "username": newEmail
        }, (err, result) => {
          console.log(err);
        });
        for (i = 0; i < foundUser.words.length; i++) {
          const englishVersion = decodeURI(foundUser.words[i].english);
          const spanishVersion = decodeURI(foundUser.words[i].spanish);
          let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='22px' width='22px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#ED863A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#EDD0AE' stroke-width='18' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
          usersWords += currentWord;
        }

        let wordList = "";
        let beginBoxDisplay = "display:block";

        if (usersWords != "") {
          wordList = usersWords;
          beginBoxDisplay = "display:none;";
        }

        res.render("home", {user: req.user.name, error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList, wordFormDisplay: "display:none;", currentEmail: newEmail, changeConfirmBox: "display:block;", confirmMessage: "Email Changed."});
    }
  });
  });


app.post("/deleteAccount", (req,res) => {

  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else {
      User.deleteOne({_id: foundUser.id}, function(err, result) {
        if (err) {
          res.send(err);
        } else {
          res.redirect("/register");
        }
    });
  }
  });

});

app.post("/logout", (req, res) => {
  req.logout();
  res.render("logged-out");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
