const express = require('express');
const router = express.Router();
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
    await login(req, res);
    res.redirect('/dashboard');
  } catch (error) {
    res.redirect('/?error=login_failed');
  }
});

router.get('/dashboard', authenticate, (req, res) => {
  res.render('dashboard', {
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