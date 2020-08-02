const mongoose = require('mongoose');
require('dotenv').config({path:'.env'})


const connectedDB = async () =>{
    try {
        const connection= await mongoose.connect( process.env.DB_MONGO, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
        console.log(`MongoDb Connected:${connection.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1); //stop app
    }

}

module.exports = connectedDB;