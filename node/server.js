require("dotenv").config()
const express = require("express")
const mongoose=require("mongoose")
const cors = require("cors")
const corsOptions = require("./config/corsOptions")
const connectDB = require("./config/connectDB")
const PORT = process.env.PORT || 7100
const app = express()

connectDB()

//middlewares
app.use(cors(corsOptions))
app.use(express.json())

app.use("/api/auth",require("./routes/authRoute"))
app.use("/api/products",require("./routes/productRoute"))
app.use("/api/cart",require("./routes/cartRoute"))
app.use("/api/users",require("./routes/userRoute"))

//routes
app.get("/", (req, res) => {
    res.send("this is the home page")
})

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port
${PORT}`))
})

mongoose.connection.on('error', err => {
    console.log(err)
})





