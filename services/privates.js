const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Vérification si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
        }

        // Création du nouvel utilisateur
        const user = new User({ name, email, password });
        await user.save();

        // Génération du token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la création du compte',
            error: error.message 
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la connexion',
            error: error.message 
        });
    }
};


const logout = async (req, res) => {
    try {
        res.status(200).json({ message: 'Déconnexion réussie' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Erreur lors de la déconnexion',
            error: error.message 
        });
    }
};

module.exports ={
    register,
    login,
    logout
}