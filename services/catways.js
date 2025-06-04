const Catway = require('../models/catway');
const Reservation = require('../models/reservation');


const createCatway = async (req, res) => {
    try {
        const lastCatway = await Catway.findOne().sort({ catwayNumber: -1 });
        const nextNumber = lastCatway ? lastCatway.catwayNumber + 1 : 1;

        const catway = new Catway({
            catwayNumber: nextNumber,
            type: req.body.type,
            catwayState: req.body.catwayState || 'free'
        });

        const newCatway = await catway.save();
        res.status(201).json(newCatway);
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


const getAllCatways = async (req, res) => {
    try {
        const catways = await Catway.find().select('-__v');
        res.status(200).json(catways);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getCatwayById = async (req, res) => {
    try {
        const catway = await Catway.findById(req.params.id).select('-__v');
        if (!catway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }
        res.status(200).json(catway);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updateCatway = async (req, res) => {
    try {
        const catway = await Catway.findById(req.params.id);
        if (!catway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }

        if (req.body.type) catway.type = req.body.type;
        if (req.body.catwayState) catway.catwayState = req.body.catwayState;

        const updatedCatway = await catway.save();
        res.status(200).json(updatedCatway);
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


const deleteCatway = async (req, res) => {
    try {
        const reservations = await Reservation.find({ catwayNumber: req.params.id });
        if (reservations.length > 0) {
            return res.status(400).json({ 
                message: 'Impossible de supprimer - Ce catway a des réservations associées' 
            });
        }

        const deletedCatway = await Catway.findByIdAndDelete(req.params.id);
        if (!deletedCatway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }
        res.status(200).json({ message: 'Catway supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getCatwayState = async (req, res) => {
    try {
        const catway = await Catway.findById(req.params.id).select('catwayState -_id');
        if (!catway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }
        res.status(200).json(catway);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const updateCatwayState = async (req, res) => {
    try {
        const catway = await Catway.findById(req.params.id);
        if (!catway) {
            return res.status(404).json({ message: 'Catway non trouvé' });
        }

        if (!req.body.catwayState) {
            return res.status(400).json({ message: 'Le champ catwayState est requis' });
        }

        catway.catwayState = req.body.catwayState;
        const updatedCatway = await catway.save();
        res.status(200).json(updatedCatway);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllCatways,
    getCatwayById,
    createCatway,
    updateCatway,
    deleteCatway,
    getCatwayState,
    updateCatwayState
};