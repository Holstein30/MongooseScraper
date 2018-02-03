var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");

// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB & Mongoose
mongoose.Promise = Promise;
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost/WebdevScraper"
);

// Routes

app.get("/", function(req, res) {
  db.Article.find({}, null, { sort: { created: -1 } }, function(err, data) {
    if (data.length === 0) {
      res.render("placeholder", {
        message:
          'There\'s nothing scraped yet. Please click "Generate Articles"!'
      });
    } else {
      res.render("index", { articles: data });
      console.log(data);
    }
  });
});

// A GET route for scraping the webdev subreddit
app.get("/scrape", function(req, res) {
  // Grab html
  request("https://www.reddit.com/r/webdev", function(err, response, html) {
    // Load into cheerio and save as $
    var $ = cheerio.load(html);

    // Grab website tags
    $("p.title").each(function(i, element) {
      // Save an empty result object
      var result = {};
      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(element).text();
      result.link = $(element)
        .children()
        .attr("href");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // Redirect to home with articles returned
          res.redirect("/");
        })
        .catch(function(err) {
          // Error handling
          res.json(err);
        });
    });
  });
});

// Route for saved Articles
app.get("/saved", function(req, res) {
  db.Article.find({ saved: true }, null, { sort: { created: -1 } }, function(
    err,
    data
  ) {
    if (data.length === 0) {
      res.render("placeholder", {
        message:
          "You haven't saved any articles yet! Go back to Home and save an article!"
      });
    } else {
      res.render("saved", { saved: data });
    }
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // Send articles to client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // Error handling
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in db
  db.Article.findOne({ _id: req.params.id })
    // Populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // Send article back to client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // Error Handling
      res.json(err);
    });
});

// Route for saving an Article
app.post("/save/:id", function(req, res) {
  db.Article.findById(req.params.id, function(err, data) {
    if (data.saved) {
      db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { saved: false, status: "Save Article" } },
        { new: true },
        function(err, data) {
          res.redirect("/saved");
        }
      );
    } else {
      db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { saved: true, status: "Saved" } },
        { new: true },
        function(err, data) {
          res.redirect("/saved");
        }
      );
    }
  });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // Update the Article to be associated with the new Note
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      // Send article back to client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // Error Handling
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
