var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new NoteSchema object
var NoteSchema = new Schema({
  // `title` is of type String
  title: String,
  // `body` is of type String
  body: String
});

// Mongoose model method to create model from schema above
var Note = mongoose.model("Note", NoteSchema);

// Export the Note model
module.exports = Note;
