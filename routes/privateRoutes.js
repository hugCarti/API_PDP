const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();

const User = require('../models/user');
const Reservation = require('../models/reservation');
const Catway = require('../models/catway');
const { register, login, logout } = require('../services/privates');
const { authenticate } = require('../middlewares/private');

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.post('/api/auth/logout', authenticate, logout);


router.get('/', (req, res) => {
  res.render('index', { 
    title: 'Accueil',
    error: req.query.error 
  });
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


router.get('/reservations', authenticate, async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ checkIn: 1 });
    res.render('reservations', { 
      reservations,
      user: req.user 
    });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});


router.post('/api/reservations', authenticate, async (req, res) => {
  try {
    const conflictingReservations = await Reservation.find({
      catwayNumber: req.body.catwayNumber,
      $or: [
        { checkIn: { $lt: new Date(req.body.checkOut) } }, 
        { checkOut: { $gt: new Date(req.body.checkIn) } }
      ]
    });

    if (conflictingReservations.length > 0) {
      return res.status(400).send(`
        <script>
          alert('Catway déjà réservé pour cette période');
          window.history.back();
        </script>
      `);
    }

    const reservation = await Reservation.create(req.body);
    await Catway.findOneAndUpdate(
      { catwayNumber: req.body.catwayNumber },
      { catwayState: 'reserved' }
    );

    res.send(`
      <script>
        alert('Réservation effectuée avec succès !');
        window.location.href = '/reservations';
      </script>
    `);
  } catch (error) {
    res.status(400).send(`
      <script>
        alert('Erreur : ${error.message}');
        window.history.back();
      </script>
    `);
  }
});


router.get('/reservations/details', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.query.id);
    if (!reservation) {
      return res.status(404).render('error', {
        error: { message: 'Réservation non trouvée' },
        user: req.user
      });
    }
    res.render('reservation-details', {
      title: 'Détails de la Réservation',
      reservation,
      user: req.user
    });
  } catch (error) {
    res.status(500).render('error', {
      error: { message: error.message },
      user: req.user
    });
  }
});


router.delete('/api/reservations/:id', authenticate, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ 
        success: false,
        message: 'Réservation non trouvée' 
      });
    }

    const remainingReservations = await Reservation.countDocuments({
      catwayNumber: reservation.catwayNumber
    });

    if (remainingReservations === 0) {
      await Catway.findOneAndUpdate(
        { catwayNumber: reservation.catwayNumber },
        { catwayState: 'free' }
      );
    }

    res.json({ 
      success: true,
      message: 'Réservation supprimée avec succès'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});


router.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.render('users', {
      title: 'Gestion des utilisateurs',
      users,
      user: req.user
    });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});


router.post('/api/users', authenticate, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    await User.create({ ...req.body, password: hashedPassword });
    res.status(200).send(`
      <script>
        alert('Utilisateur créé avec succès !');
        window.location.href = '/users';
      </script>
    `);
  } catch (error) {
    res.status(400).send(`
      <script>
        alert('Erreur : ${error.message}');
        window.history.back();
      </script>
    `);
  }
});


router.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    } else {
      delete updateData.password;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.delete('/api/users/:id', authenticate, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const catway = await Catway.findOne();
    res.render('dashboard', {
      title: 'Tableau de bord',
      user: req.user,
      catway: catway || {}
    });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});


router.get('/logout', (req, res) => {
  res.redirect('/');
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


module.exports = router;