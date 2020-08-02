const express = require('express')
const morgan = require('morgan')
const connectedDB = require('./config/dataBase')
const cors = require('cors')
const authRouter = require('./src/routes/authRoute')


const app = express();
connectedDB();

if(process.env.NODE_ENV === 'development'){
    app.use(cors({
        origin: process.env.CLIENT_URL
    }))
    app.use(morgan('dev'))

}
app.use(express.json({extended:true}))
app.use(express.urlencoded({extended:true}))
app.use('/v01/', authRouter)

app.use((req, res, next) =>{
    res.status(404).json({
        success: false,
        message:"Page not Founded"
    })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(`App listenin on port ${PORT}`)
})