const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
const User = require('../models/user');
const Catway = require('../models/catway');
const Reservation = require('../models/reservation');
const jwt = require('jsonwebtoken');

chai.use(chaiHttp);
const expect = chai.expect;

describe('API Tests', function() {
    let testUser;
    let testToken;
    let testCatway;
    let testReservation;

    // Avant tous les tests, nettoyer la base et créer des données de test
    before(async function() {
        await User.deleteMany({});
        await Catway.deleteMany({});
        await Reservation.deleteMany({});

        // Créer un utilisateur de test
        testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            isAdmin: true
        });

        // Générer un token pour l'utilisateur de test
        testToken = jwt.sign(
            { userId: testUser._id },
            process.env.SECRET_KEY,
            { expiresIn: '24h' }
        );

        // Créer un catway de test
        testCatway = await Catway.create({
            catwayNumber: 1,
            type: 'long',
            catwayState: 'free'
        });

        // Créer une réservation de test
        testReservation = await Reservation.create({
            catwayNumber: testCatway.catwayNumber,
            clientName: 'Test Client',
            boatName: 'Test Boat',
            checkIn: new Date('2025-01-01'),
            checkOut: new Date('2025-01-10')
        });
    });

    describe('Authentication', function() {
        it('should register a new user', async function() {
            const res = await chai.request(app)
                .post('/api/auth/register')
                .send({
                    name: 'New User',
                    email: 'new@example.com',
                    password: 'password123'
                });

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('token');
            expect(res.body.user).to.have.property('email', 'new@example.com');
        });

        it('should login with correct credentials', async function() {
            const res = await chai.request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('token');
            expect(res.body.user).to.have.property('email', 'test@example.com');
        });

        it('should reject login with wrong password', async function() {
            const res = await chai.request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrongpassword'
                });

            expect(res).to.have.status(401);
            expect(res.body).to.have.property('message', 'Email ou mot de passe incorrect');
        });
    });

    describe('Catways', function() {
        it('should get all catways', async function() {
            const res = await chai.request(app)
                .get('/api/catways')
                .set('Authorization', `Bearer ${testToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body[0]).to.have.property('catwayNumber', 1);
        });

        it('should get a single catway', async function() {
            const res = await chai.request(app)
                .get(`/api/catways/${testCatway._id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('catwayNumber', 1);
        });

        it('should create a new catway', async function() {
            const res = await chai.request(app)
                .post('/api/catways')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    type: 'short',
                    catwayState: 'free'
                });

            expect(res).to.have.status(201);
            expect(res.body).to.have.property('catwayNumber', 2); // Le numéro devrait être incrémenté
        });

        it('should update a catway', async function() {
            const res = await chai.request(app)
                .put(`/api/catways/${testCatway._id}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    catwayState: 'reserved'
                });

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('catwayState', 'reserved');
        });

        it('should delete a catway', async function() {
            // D'abord supprimer la réservation associée
            await Reservation.deleteMany({});

            const res = await chai.request(app)
                .delete(`/api/catways/${testCatway._id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Catway supprimé avec succès');
        });
    });

    describe('Reservations', function() {
        before(async function() {
            // Recréer le catway si nécessaire
            testCatway = await Catway.findOneAndUpdate(
                { catwayNumber: 1 },
                { catwayState: 'free' },
                { upsert: true, new: true }
            );
        });

        it('should get all reservations', async function() {
            const res = await chai.request(app)
                .get('/reservations')
                .set('Cookie', `token=${testToken}`);

            expect(res).to.have.status(200);
        });

        it('should create a new reservation', async function() {
            const res = await chai.request(app)
                .post('/api/reservations')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    catwayNumber: testCatway.catwayNumber,
                    clientName: 'New Client',
                    boatName: 'New Boat',
                    checkIn: '2025-02-01T00:00:00Z',
                    checkOut: '2025-02-10T00:00:00Z'
                });

            expect(res).to.have.status(200);
        });

        it('should prevent conflicting reservations', async function() {
            const res = await chai.request(app)
                .post('/api/reservations')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    catwayNumber: testCatway.catwayNumber,
                    clientName: 'Conflict Client',
                    boatName: 'Conflict Boat',
                    checkIn: '2025-02-05T00:00:00Z',
                    checkOut: '2025-02-15T00:00:00Z'
                });

            expect(res).to.have.status(400);
        });

        it('should delete a reservation', async function() {
            const res = await chai.request(app)
                .delete(`/api/reservations/${testReservation._id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('message', 'Réservation supprimée avec succès');
        });
    });

    describe('Users', function() {
        it('should get all users', async function() {
            const res = await chai.request(app)
                .get('/users')
                .set('Cookie', `token=${testToken}`);

            expect(res).to.have.status(200);
        });

        it('should create a new user (admin)', async function() {
            const res = await chai.request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    name: 'Admin User',
                    email: 'admin@example.com',
                    password: 'admin123',
                    isAdmin: true
                });

            expect(res).to.have.status(200);
        });

        it('should update a user', async function() {
            const res = await chai.request(app)
                .put(`/api/users/${testUser._id}`)
                .set('Authorization', `Bearer ${testToken}`)
                .send({
                    name: 'Updated Name'
                });

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('success', true);
        });

        it('should delete a user', async function() {
            const newUser = await User.create({
                name: 'To Delete',
                email: 'delete@example.com',
                password: 'password123'
            });

            const res = await chai.request(app)
                .delete(`/api/users/${newUser._id}`)
                .set('Authorization', `Bearer ${testToken}`);

            expect(res).to.have.status(200);
            expect(res.body).to.have.property('success', true);
        });
    });
});