const express = require('express')
var jwt = require('jsonwebtoken');
const app = express()
const port = process.env.PORT || 5000
const cors = require('cors')
require('dotenv').config()

//middleware
app.use(cors())
app.use(express.json())

const verifyToken = (req, res, next) => {
    if (!req.body.authorization) {
        return res.status(401).send({ message: 'forbidden access' })
    }

    const token = req.body.authorization.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'forbidden access' })
        }

        req.decoded = decoded
        next()
    })
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7xouwts.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        const taskCollection = client.db('houseHunter').collection('')
        const userCollection = client.db('houseHunter').collection('users')

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'admin'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })

            }
            next()
        }
        //verify dekiveryman middleware
        const verifyDeliveryMan = async (req, res, next) => {
            const email = req.decoded.email
            const query = { email: email }
            const user = await userCollection.findOne(query)
            const isAdmin = user?.role === 'delivery_man'
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' })

            }
            next()
        }
        //jwt related api 
        app.post('/jwt', async (req, res) => {
            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token })
        })
        //users related api
        app.post('/users', async (req, res) => {
            const user = req.body
            const email = user.email
            // console.log(user)
            //checking user exist or not
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already exist', insertedId: null })
            }
            const result = await userCollection.insertOne(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({...result,token})
        })
        app.post('/login', async (req,res)=>{
            const user = req.body
            const email = user.email
            const password = user.password
            const query ={email:email}
            const userInfo = await userCollection.findOne(query)
            if(userInfo){
        
                // console.log("cp",password,userInfo.password)
                if(password===userInfo.password){
                    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
                    res.send({...userInfo,authorization:'ok',token})
                }else{
                    res.send("password doesn't match")
                }
            }
            else{
                res.send('register first')
            }
        })
        app.post('/checkUser',verifyToken,async(req,res)=>{
            const userEmail = req.decoded.email
            console.log(userEmail)
            const query = {email:userEmail}
            const user = await userCollection.findOne(query)
            const name =user.name
            const email = user.email
            const image =user.image
            const role = user.role
            const result ={name,email,image,role}
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('house hunter is running')
})
app.listen(port, () => {
    console.log(`House hunter is running on port ${port}`)
})