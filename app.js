const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const methodOverride = require('method-override');

const catwayRoutes = require('./routes/catwayRoutes');
const privateRoutes = require('./routes/privateRoutes');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use('/', privateRoutes);
app.use('/', catwayRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    error: err,
    user: req.user 
  });
});

// Connexion MongoDB
mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;