const mongoose = require('mongoose');

exports.initClientDbConnection = async () => {
    try {
        await mongoose.connect(process.env.URL_MONGO, {
            dbName: 'apinode'
        })
        console.log('connected to MongoDB')
    } catch (error) {
        console.log('MongoDB connection error:', error)
        throw error
    }
}