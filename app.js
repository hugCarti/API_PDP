const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const catwayRoutes = require('./routes/catwayRoutes');
const privateRoutes = require('./routes/privateRoutes');

const app = express();

// Configuration des vues
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', privateRoutes);  // Doit être avant la route racine
app.use('/', catwayRoutes);

// Connexion MongoDB
mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;