var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new UserSchema object
var ArticleSchema = new Schema({
  // `title` is required and of type String
  title: {
    type: String,
    required: true
  },
  // `link` is required and of type String
  link: {
    type: String,
    required: true
  },
  // `note` is an object that stores a Note id
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  },
  saved: {
    type: Boolean,
    default: false
  }
});

// Mongoose model method to create model from schema above
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;
