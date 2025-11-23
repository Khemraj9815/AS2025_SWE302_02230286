const router = require('express').Router({ mergeParams: true });
const Comment = require('../models/Comment');
const jwt = require('jsonwebtoken');

router.post('/', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const user = jwt.verify(token, process.env.JWT_SECRET);

  const comment = await Comment.create({
    body: req.body.comment.body,
    articleSlug: req.params.slug,
    author: user
  });

  res.json({ comment });
});

router.get('/', async (req, res) => {
  const comments = await Comment.find({ articleSlug: req.params.slug });
  res.json({ comments });
});

module.exports = router;
