const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return next();
        }

        console.log('Token reçu:', token);
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log('Token décodé:', decoded);

        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
            console.log('Utilisateur non trouvé pour le token');
            throw new Error();
        }

        console.log('Utilisateur authentifié:', user.email);
        req.user = user;
        next();
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        res.status(401).redirect('/');
    }
};

module.exports = {
    authenticate
};