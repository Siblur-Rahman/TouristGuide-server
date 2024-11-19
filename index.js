const express = require("express");
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PROT || 5001;


// middleware
app.use(cors({
  origin: ["http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://tourist-guide-9beb4.web.app",
    "https://tourist-guide-9beb4.firebaseapp.com/"
  ],
  credentials: true,
}))
app.use(express.json());
// const uri = "mongodb://localhost:27017";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ts8x6gb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Collection
    const usersCollection = client.db("touristGuideDb").collection("users");
    const packagesCollection = client.db("touristGuideDb").collection("packages");
    const wishPackagesCollection = client.db("touristGuideDb").collection("wishPackages");
    const bookingCollection = client.db("touristGuideDb").collection("booking");

 // jwt related api
 app.post('/jwt', async(req, res) =>{
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h"});
  res.send({ token})
})

// mddleware  
const verifyToken = (req, res, next) =>{
  // console.log("inside verify Token", req.headers.authorization);
  if(!req.headers.authorization){
    return res.status(401).send({message: "unauthorized access"})
  }
  const token = req.headers.authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.decoded = decoded
    next()
  })
}
//  use verify admin after verifyToken
const verifyAdmin = async(req, res, next) =>{
const email = req.decoded.email;
const query = {email: email};
const user = await usersCollection.findOne(query);
const isAdman = user?.role === 'admin';
if(!isAdman){
  return res.status(403).send({message: 'forbidden access'});
}
next();
}

  app.get("/users", verifyToken, verifyAdmin, async(req, res) =>{
      const result = await usersCollection.find().toArray();
      res.send(result)
     })
    app.patch('/user/admin/:id', async(req, res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc ={
        $set:{
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.patch('/user/tourguide/:id', async(req, res) =>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc ={
        $set:{
          role: 'tourguide'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
app.patch('/user/request/:id', async(req, res)=>{
  const id = req.params.id;
  const filter = {_id: new ObjectId(id)};
  const updatedDoc ={
    $set:{
      request: 'requested'
    }
  }
  const result = await usersCollection.updateOne(filter, updatedDoc);
  res.send(result);
})

    app.get('/user/admin/:email', verifyToken, async(req, res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'forbidden access'});
      }
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      let admin = false;
      if(user){
        admin = user?.role === 'admin'
      }
      res.send({admin})
   })
    app.get('/user/tourguide/:email', verifyToken, async(req, res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'forbidden access'});
      }
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      let tourguide = false;
      if(user){
        tourguide = user?.role === 'tourguide'
      }
      res.send({tourguide})
   })
    app.get('/user/tourist/:email', verifyToken, async(req, res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'forbidden access'});
      }
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      let tourist = '';
      if(user?.role==='tourist'){
        tourist = user
      }
      res.send(tourist)
   })
    app.get('/userinfo/:email', verifyToken, async(req, res) =>{
      const email = req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'forbidden access'});
      }
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      res.send(user)
   })

// Packages
app.post('/package', verifyToken, verifyAdmin, async (req, res) =>{
  const packageData = req.body
    const result = await packagesCollection.insertOne(packageData);
    res.send(result)
  })
app.get('/packages', async (req, res) =>{
  const result = await packagesCollection.find().toArray();
  res.send(result)
})
app.get('/packages3', async (req, res) =>{
  const result = await packagesCollection.find().limit(3).toArray();
  res.send(result)
})

app.get("/package/:id", async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await packagesCollection.findOne(query);
  res.send(result)
 })
// wishlist api
app.post("/wishPackage", async(req, res) =>{
  const wishPack = req.body;
  const result = await wishPackagesCollection.insertOne(wishPack);
  res.send(result)
})
app.get("/wishPackages", async(req, res) =>{
  const wishPack = req.body;
  const result = await wishPackagesCollection.find().toArray();
  res.send(result)
 })
 app.delete("/wishPackage/:id", async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await wishPackagesCollection.deleteOne(query);
  res.send(result)
 })

//  booking api

app.post('/booking', verifyToken, async (req, res) =>{
    const packageData = req.body
    const result = await bookingCollection.insertOne(packageData);
    res.send(result)
  })
app.get('/booking/:email', verifyToken, async (req, res) =>{
    const email = req.params.email
    const query = {touristEmail: email};
    const result = await bookingCollection.find(query).toArray();
    res.send(result)
  })
 app.post('/signup', async (req, res) => {
  const userData = req.body
  const query = { email: userData.email };
  const existingUser = await usersCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "user already exists", insertedId: null });
  }
  const result = await usersCollection.insertOne(userData)
  res.send(result)
})

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) =>{
    res.send('TouristGuide-server server is runing')
})

app.listen(port, () =>{
    console.log(`TouristGuide-server is runing on port ${port}`)
})
