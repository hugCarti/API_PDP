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

// View Routes
router.get('/catways', authenticate, async (req, res) => {
  try {
    const catways = await getAllCatways(req, res);
    res.render('catways', { catways });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

router.get('/catways/:id', authenticate, async (req, res) => {
  try {
    const catway = await getCatwayById(req, res);
    const reservations = await getReservationsByCatway(req, res);
    res.render('catway-details', { catway, reservations });
  } catch (error) {
    res.status(500).render('error', { error });
  }
});

module.exports = router;