require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const usersRoute = require('./routes/users');
const articlesRoute = require('./routes/articles');
const commentsRoute = require('./routes/comments');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', usersRoute);
app.use('/api/articles', articlesRoute);
app.use('/api/articles/:slug/comments', commentsRoute);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
