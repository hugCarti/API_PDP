const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const catwayRoutes = require('./routes/catwayRoutes');
const privateRoutes = require('./routes/privateRoutes');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(cookieParser());

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

<<<<<<< HEAD
// Routes
=======
>>>>>>> second
app.use('/', privateRoutes);
app.use('/', catwayRoutes);

// Connexion MongoDB
mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;