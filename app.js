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
  res.render("register");
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
          let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
          usersWords += currentWord;
        }

        let wordList = "";
        let beginBoxDisplay = "display:block";

        if (usersWords != "") {
          wordList = usersWords;
          beginBoxDisplay = "display:none;";
        }

        res.render("home", {user: "lauren", error: "", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
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
    res.render("home", {user: "username", error: "Please enter a word."});
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
                    for (j = 0; j < separatedArray[i].length; j++) {
                    listed += ("<button class='transWord' name='transWord' type='submit' value='" + separatedArray[i][j] + "'>" + separatedArray[i][j] + "</button>");
                    }
                  }
                return listed;

              }

              if (req.isAuthenticated()){
                let usersWords = "";
                User.findById(req.user.id, function(err, foundUser){
                  if(err){
                    console.log(err);
                  } else {
                    for (i = 0; i < foundUser.words.length; i++) {
                      const englishVersion = decodeURI(foundUser.words[i].english);
                      const spanishVersion = decodeURI(foundUser.words[i].spanish);
                      let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                      usersWords += currentWord;
                    }

                    let wordList = "";
                    let beginBoxDisplay = "display:block";

                    if (usersWords != "") {
                      wordList = usersWords;
                      beginBoxDisplay = "display:none;";
                    }

                    res.render("home", {user: "username", wordChoices: htmlChoices(), error: "", displayChoice: "display:block;", wordQuery: query, displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: englishSpanish, eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
                  }
                });

              } else {
                res.redirect("/");
              }

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
                      let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                      usersWords += currentWord;
                    }

                    let wordList = "";
                    let beginBoxDisplay = "display:block";

                    if (usersWords != "") {
                      wordList = usersWords;
                      beginBoxDisplay = "display:none;";
                    }

                    res.render("home", {user: "username", error: "Make sure you spell your word correctly.", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;" , original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
                  }
                });

              } else {
                res.redirect("/");
              }

            }

          });

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
                  let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                  usersWords += currentWord;
                }

                let wordList = "";
                let beginBoxDisplay = "display:block";

                if (usersWords != "") {
                  wordList = usersWords;
                  beginBoxDisplay = "display:none;";
                }

                res.render("home", {user: "username", error: "", wordChoices: "", displayChoice: "display:none;", wordQuery: "", displayConfirm: "display:none;" , original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
              }
            });

          } else {
            res.redirect("/");
          }

        }

      });

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
              let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
              usersWords += currentWord;
            }

            let wordList = "";
            let beginBoxDisplay = "display:block";

            if (usersWords != "") {
              wordList = usersWords;
              beginBoxDisplay = "display:none;";
            }

            res.render("home", {user: "username", error: "Please use only alphabet characters.", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:none;", original: "", translated: "", translatedEncoded: "", engOrSpan: "", eOrs: "", duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
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
          let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
          usersWords += currentWord;
        }

        let wordList = "";
        let beginBoxDisplay = "display:block";

        if (usersWords != "") {
          wordList = usersWords;
          beginBoxDisplay = "display:none;";
        }

        res.render("home", {user: "username", error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:block;", original: originalWord, translated: wordChosen, translatedEncoded: wordChosenEncoded, engOrSpan: "", eOrs: englishOrSpanish, duplicateError: "", displayConfirmButton: "display:block;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
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
                      let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                      usersWords += currentWord;
                    }

                    let wordList = "";
                    let beginBoxDisplay = "display:block";

                    if (usersWords != "") {
                      wordList = usersWords;
                      beginBoxDisplay = "display:none;";
                    }

                    res.render("home", {user: "username", error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:block;", original: originalWord, translated: wordChosen, translatedEncoded: providedWord, engOrSpan: "", eOrs: language, duplicateError: "You already have this word!", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
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


        } else if (language === "spanish") {
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
                        let currentWord = "<div class='wordset'><div class='smallXdelete'><svg height='25px' width='25px' viewbox='0 0 160 160'><circle cx='80' cy='80' r='70' fill='#FCC27C' stroke='#84041A' stroke-width='14'/><line x1='50' y1='45' x2='110' y2='115' stroke='#84041A' stroke-width='15' stroke-linecap='round'/><line x1='50' y1='115' x2='110' y2='45' stroke='#84041A' stroke-width='15' stroke-linecap='round'/></svg></div><div class='englishSide'>" + englishVersion + "</div><div class='spanishSide'>" + spanishVersion + "</div></div>";
                        usersWords += currentWord;
                      }

                      let wordList = "";
                      let beginBoxDisplay = "display:block";

                      if (usersWords != "") {
                        wordList = usersWords;
                        beginBoxDisplay = "display:none;";
                      }

                      res.render("home", {user: "username", error: "", wordChoices: "", wordQuery: "", displayChoice: "display:none;", displayConfirm: "display:block;", original: originalWord, translated: wordChosen, translatedEncoded: providedWord, engOrSpan: "", eOrs: language, duplicateError: "You already have this word!", displayConfirmButton: "display:none;", beginBoxDisplay: beginBoxDisplay, wordList: wordList});
                    }
                  });

                } else {
                  res.redirect("/");
                }
                }
              }

              if (!duplicate) {
                let newWord = {english: givenWord, spanish: providedWord};
                foundUser.words.push({newWord});
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
  console.log("deleting word...")
})

app.post("/logout", (req, res) => {
  req.logout();
  res.render("logged-out");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
