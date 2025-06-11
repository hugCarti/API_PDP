const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
        throw new Error();
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
        throw new Error();
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).redirect('/');
    }
};

module.exports = {
    authenticate
};