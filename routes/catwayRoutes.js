const express = require('express');
const router = express.Router();
const {
  getAllCatways,
  getCatwayById,
  createCatway,
  updateCatway,
  deleteCatway
} = require('../services/catways');
const {
  getReservationsByCatway,
  getReservationById,
  createReservation,
  deleteReservation
} = require('../services/reservations');
const { authenticate } = require('../middlewares/private');
const Reservation = require('../models/reservation');
const Catway = require('../models/catway');

// API Routes
router.get('/api/catways', getAllCatways);
router.get('/api/catways/:id', getCatwayById);
router.post('/api/catways', authenticate, createCatway);
router.put('/api/catways/:id', authenticate, updateCatway);
router.delete('/api/catways/:id', authenticate, deleteCatway);

router.get('/api/catways/:id/reservations', getReservationsByCatway);
router.get('/api/catways/:id/reservations/:reservationId', getReservationById);
router.post('/api/catways/:id/reservations', authenticate, createReservation);
router.delete('/api/catways/:id/reservations/:reservationId', authenticate, deleteReservation);

router.get('/catways', authenticate, async (req, res) => {
  try {
    const catways = await Catway.find().select('-__v');
    res.render('catways', {
      title: 'Catways',
      catways,
      user: req.user
    });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

router.get('/catways/:id', authenticate, async (req, res) => {
  try {
    const catway = await Catway.findById(req.params.id);
    if (!catway) {
      return res.status(404).render('error', { 
        error: { message: 'Catway non trouvé' },
        user: req.user
      });
    }

    const reservations = await Reservation.find({ 
      catwayNumber: catway.catwayNumber 
    });

    res.render('catway-details', {
      title: 'Détails du Catway',
      catway,
      reservations,
      user: req.user
    });
  } catch (error) {
    console.error('Erreur détails catway:', error);
    res.status(500).render('error', {
      error: { message: error.message },
      user: req.user
    });
  }
});

router.get('/catways/details', authenticate, async (req, res) => {
  try {
    if (!req.query.id) {
      throw new Error('ID du catway non fourni');
    }

    const catway = await Catway.findById(req.query.id);
    if (!catway) {
      return res.status(404).render('error', {
        error: { message: 'Catway non trouvé' },
        user: req.user
      });
    }

    const reservations = await Reservation.find({ 
      catwayNumber: catway.catwayNumber 
    });

    res.render('catway-details', {
      title: 'Détails du Catway',
      catway,
      reservations,
      user: req.user
    });
  } catch (error) {
    console.error('Erreur détails catway:', error);
    res.status(500).render('error', {
      error: { message: error.message },
      user: req.user
    });
  }
});

router.post('/api/catways', authenticate, async (req, res) => {
  try {
    const lastCatway = await Catway.findOne().sort({ catwayNumber: -1 });
    const nextNumber = lastCatway ? lastCatway.catwayNumber + 1 : 1;

    const catway = await Catway.create({
      catwayNumber: nextNumber,
      ...req.body
    });
    res.json({ success: true, catway });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/api/catways/:id', authenticate, async (req, res) => {
  try {
    const { catwayState } = req.body;
    if (!['free', 'reserved', 'maintenance'].includes(catwayState)) {
      return res.status(400).json({ 
        success: false,
        message: 'État invalide' 
      });
    }

    const catway = await Catway.findByIdAndUpdate(
      req.params.id,
      { catwayState },
      { new: true }
    );

    if (!catway) {
      return res.status(404).json({ 
        success: false,
        message: 'Catway non trouvé' 
      });
    }

    res.json({ 
      success: true,
      message: 'Catway modifié avec succès',
      catway 
    });
  } catch (error) {
    console.error('Erreur modification catway:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

router.delete('/api/catways/:id', authenticate, async (req, res) => {
  try {
    const catway = await Catway.findById(req.params.id);
    if (!catway) {
      return res.status(404).json({ 
        success: false,
        message: 'Catway non trouvé' 
      });
    }

    const reservations = await Reservation.find({ catwayNumber: catway.catwayNumber });
    if (reservations.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Impossible de supprimer - Réservations existantes' 
      });
    }

    await Catway.findByIdAndDelete(req.params.id);
    res.json({ 
      success: true,
      message: 'Catway supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur suppression catway:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

module.exports = router;