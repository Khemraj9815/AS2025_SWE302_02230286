const router = require('express').Router();
const Article = require('../models/Article');
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
  const articles = await Article.find();
  res.json({ articles });
});

router.post('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = jwt.verify(token, process.env.JWT_SECRET);

  const article = await Article.create({
    ...req.body.article,
    slug: req.body.article.title.toLowerCase().replace(/ /g, '-'),
    author: user
  });

  res.json({ article });
});

module.exports = router;
