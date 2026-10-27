require("dotenv").config()
const http = require("http")
const express = require("express")
const mongoose=require("mongoose")
const cors = require("cors")
const corsOptions = require("./config/corsOptions")
const connectDB = require("./config/connectDB")
const configureSocket = require("./config/socket")
const PORT = process.env.PORT || 7100
const app = express()
const server = http.createServer(app)
const io = configureSocket(server, corsOptions)
app.set('io', io)

connectDB()

//middlewares
app.use(cors(corsOptions))
app.use(express.json())

app.use("/api/auth",require("./routes/authRoute"))
app.use("/api/products",require("./routes/productRoute"))
app.use("/api/cart",require("./routes/cartRoute"))
app.use("/api/topups",require("./routes/topUpRoute"))
app.use("/api/users",require("./routes/userRoute"))

//routes
app.get("/", (req, res) => {
    res.send("this is the home page")
})

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    server.listen(PORT, () => console.log(`Server running on port
${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
})




