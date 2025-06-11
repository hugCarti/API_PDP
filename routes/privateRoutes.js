const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const User = require('../models/user');
const { register, login, logout } = require('../services/privates');
const { authenticate } = require('../middlewares/private');

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.post('/api/auth/logout', authenticate, logout);

// View Routes
router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Accueil',
    error: req.query.error 
  });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Debug: Afficher les valeurs reçues
    console.log('Tentative de connexion avec:', email);

    const user = await User.findOne({ email });

    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.redirect('/?error=invalid_credentials');
    }

    // Debug: Afficher le mot de passe stocké et celui fourni
    console.log('Comparaison mot de passe:', {
      stored: user.password,
      provided: password
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Mot de passe incorrect');
      return res.redirect('/?error=invalid_credentials');
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );

    // Débug: Afficher le token généré
    console.log('Token généré:', token);

    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 heures
    });

    res.redirect('/index');
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.redirect('/?error=login_failed');
  }
});

router.get('/index', authenticate, (req, res) => {
  res.render('index', {
    title: 'Tableau de Bord',
    user: req.user
  });
});

router.get('/documentation', (req, res) => {
  res.render('documentation', {
    title: 'Documentation API'
  });
});

module.exports = router;