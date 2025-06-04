const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const private = require('private');
const catwayRoutes = require('./routes/catwayRoutes');
const authRoutes = require('./routes/privateRoutes');

const app = express();

app.set('views', private.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(private.join(__dirname, 'public')));

app.use('/', privateRoutes);
app.use('/', catwayRoutes);

mongoose.connect(process.env.URL_MONGO)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;