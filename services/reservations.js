const Reservation = require('../models/reservation');
const Catway = require('../models/catway');


const createReservation = async (req, res) => {
    try {
        const { catwayId } = req.params;
        const { clientName, boatName, checkIn, checkOut } = req.body;

        // Vérifier que le catway existe
        const catway = await Catway.findById(catwayId);
        if (!catway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }

        // Vérifier la disponibilité du catway
        const existingReservation = await Reservation.findOne({
            catwayNumber: catway.catwayNumber,
            $or: [
                { checkIn: { $lt: new Date(checkOut) }, checkOut: { $gt: new Date(checkIn) } },
                { checkIn: { $gte: new Date(checkIn), $lt: new Date(checkOut) } }
            ]
        });

        if (existingReservation) {
            return res.status(400).json({ 
                message: 'Le catway est déjà réservé pour cette période' 
            });
        }

        // Créer la réservation
        const reservation = new Reservation({
            catwayNumber: catway.catwayNumber,
            clientName,
            boatName,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut)
        });

        const newReservation = await reservation.save();

        catway.catwayState = 'reserved';
        await catway.save();

        res.status(201).json({
            message: 'Réservation créée avec succès',
            reservation: newReservation
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                error: true,
                message: error.message
            });
        }
        res.status(500).json({ message: error.message });
    }
};


const getReservationsByCatway = async (req, res) => {
    try {
        const catway = await Catway.findById(req.params.id);
        if (!catway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }

        const reservations = await Reservation.find({ 
            catwayNumber: catway.catwayNumber 
        }).select('-__v');

        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getReservationById = async (req, res) => {
    try {
        const reservation = await Reservation.findOne({
            _id: req.params.reservationId,
            catwayNumber: (await Catway.findById(req.params.id)).catwayNumber
        }).select('-__v');

        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
        }

        res.status(200).json(reservation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const deleteReservation = async (req, res) => {
    try {
        const catway = await Catway.findById(req.params.id);
        if (!catway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }

        const reservation = await Reservation.findOneAndDelete({
            _id: req.params.reservationId,
            catwayNumber: catway.catwayNumber
        });

        if (!reservation) {
            return res.status(404).json({ message: 'Réservation non trouvée' });
        }

        // Vérifie s'il reste des réservations pour ce catway
        const remainingReservations = await Reservation.countDocuments({ 
            catwayNumber: catway.catwayNumber 
        });

        // Mettre à jour l'état du catway si plus de réservations
        if (remainingReservations === 0) {
            catway.catwayState = 'free';
            await catway.save();
        }

        res.status(200).json({ message: 'Réservation supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getAllReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .select('-__v')
            .populate('catwayNumber', 'type catwayState -_id');

        res.status(200).json(reservations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReservation,
    getReservationsByCatway,
    getReservationById,
    deleteReservation,
    getAllReservations
};