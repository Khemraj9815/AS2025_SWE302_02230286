const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { email, password } = req.body.user;
  const user = await User.findOne({ email });

  if (!user) return res.status(422).json({ errors: { "email or password": "is invalid" } });

  const match = await user.comparePassword(password);
  if (!match) return res.status(422).json({ errors: { "email or password": "is invalid" } });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ user: { email, username: user.username, token } });
});

router.post('/', async (req, res) => {
  const { email, username, password } = req.body.user;

  const exists = await User.findOne({ email });
  if (exists) return res.status(422).json({ errors: { email: 'already taken' } });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ email, username, password: hashed });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ user: { email, username, token } });
});

module.exports = router;
