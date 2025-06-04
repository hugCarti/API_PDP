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

router.get('/', getAllCatways);
router.get('/:id', getCatwayById);
router.post('/', authenticate, createCatway);
router.put('/:id', authenticate, updateCatway);
router.delete('/:id', authenticate, deleteCatway);

router.get('/:id/reservations', getReservationsByCatway);
router.get('/:id/reservations/:reservationId', getReservationById);
router.post('/:id/reservations', authenticate, createReservation);
router.delete('/:id/reservations/:reservationId', authenticate, deleteReservation);

module.exports = router;