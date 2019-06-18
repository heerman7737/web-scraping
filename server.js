// App requirements
let express = require("express");
let mongoose = require("mongoose");
let axios = require("axios");
let cheerio = require("cheerio");
let exphbs = require("express-handlebars");

let db = require("./models");

let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

let PORT = process.env.PORT || 3000;
let app = express();

app.engine('handlebars', exphbs({ defaultLayout: "main" }));
app.set('view engine', 'handlebars');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ //

// Routes
app.get('/', function (req, res) {
  db.Article.find({})
    .then(function (result) {
      res.render('index', { articles: result.reverse() });
    }
  );
});

app.get('/articles', function (req, res) {
  axios.get('https://www.ign.com/articles?tags=news').then(function (response) {
    let $ = cheerio.load(response.data);

    $($(".listElmnt").get().reverse()).each(function (i, element) {
      let result = {};

      result.title = $(element).find(".listElmnt-blogItem").find(".listElmnt-storyHeadline").text();
      result.summary = $(element).find(".listElmnt-blogItem").find("p").text().replace('Read More »', '');
      result.link = $(element).find(".listElmnt-blogItem").find(".listElmnt-storyHeadline").attr('href');

      db.Article.create(result)
      .then(function(dbArticle) {
        // View the added result in the console
        console.log(dbArticle);
      })
      .catch(function(err) {
        // If an error occurred, log it
        console.log(err);
      });
    });
    });
  res.render('scrape');
});
  
app.get("/api/articles", function(req, res) {
  db.Article.find({})
    .then(function (dbArticles) {
      res.json(dbArticles);
    })
    .catch(function (err) {
      res.json(err);
    })
});

app.get("/articles/:id", function(req, res) {
  db.Article.find({ _id: req.params.id })
    .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      res.json(err);
  })
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
    .then(function (dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log('App running on port ' + PORT + '!');
});