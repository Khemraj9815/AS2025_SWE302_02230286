const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  body: String,
  articleSlug: String,
  author: Object
});

module.exports = mongoose.model('Comment', CommentSchema);
