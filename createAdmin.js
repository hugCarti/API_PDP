require('dotenv').config({ path: __dirname + '/.env' });
console.log("Chemin .env:", __dirname + '/.env'); // Debug
console.log("URL_MONGO:", process.env.URL_MONGO); // Debug

const mongoose = require('mongoose');
const User = require('./models/user');
const bcrypt = require('bcrypt');

if (!process.env.URL_MONGO) {
  console.error("ERREUR CRITIQUE: URL_MONGO non trouvée");
  console.log("Variables chargées:", process.env);
  process.exit(1);
}

console.log("Tentative de connexion à:", process.env.URL_MONGO);

mongoose.connect(process.env.URL_MONGO)
  .then(async () => {
    console.log("Connecté à MongoDB");

    const newPassword = await bcrypt.hash("nouveaumotdepasse", 10);
    await User.updateOne(
  
      { email: "admin@portplaisance.com" },
      { $set: { password: newPassword } }
    );
    const adminExists = await User.findOne({ email: 'admin@portplaisance.com' });
    if (adminExists) {
      console.log("Le superadmin existe déjà");
      return process.exit();
    }

    const admin = new User({
      name: 'Admin',
      email: 'admin@portplaisance.com',
      password: await bcrypt.hash('motdepasseadmin', 10),
      isAdmin: true
    });

    await admin.save();
    console.log('superutilisateur créé avec succès');
    process.exit();
  })
  .catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });