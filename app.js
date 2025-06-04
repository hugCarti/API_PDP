const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const catwayRoutes = require('./routes/catwayRoutes');
const privateRoutes = require('./routes/privateRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/catways', catwayRoutes);
app.use('/private', privateRoutes);

mongoose.connect(process.env.URL_MONGO)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

module.exports = app;