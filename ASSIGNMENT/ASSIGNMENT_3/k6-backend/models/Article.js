const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  title: String,
  description: String,
  body: String,
  slug: String,
  tagList: [String],
  author: Object
});

module.exports = mongoose.model('Article', ArticleSchema);
