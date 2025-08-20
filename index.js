const express = require("express");
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PROT || 5000;


// middleware
app.use(cors({
  origin: ["http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
  ],
  credentials: true,
}))
app.use(express.json());
// const uri = "mongodb://localhost:27017";
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ts8x6gb.mongodb.net/notes?retryWrites=true&w=majority&appName=Cluster0`;

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
    const englishCollection = client.db("notes").collection("english");
    const englishTopicsCollection = client.db("notes").collection("englishTopics");

// english
app.post('/english-topic', async (req, res) =>{
  const topic = req.body
    const query = { topic: topic.topic };
    const existingTopic = await englishTopicsCollection.findOne(query);
    if (existingTopic) {
      return res.send({ message: "Topic already exists", insertedId: null });
    } 
      const result = await englishTopicsCollection.insertOne(topic)
    res.send(result)  
  })
  app.patch('/english-topic/:topic', async(req, res) =>{
    const topic = req.params.topic;
    const sentence = req.body
    const query = {topic:topic};
    const updatedDoc ={
      $addToSet:{
        sentences: sentence
      }
    }
    const result = await englishTopicsCollection.updateOne(query, updatedDoc);
    res.send(result);
  })
  app.patch('/updateSentce/:topic', async(req, res) =>{
    const topic = req.params.topic;
    const sentence = req.body
    const query = {topic:topic, "sentences.eng":`${sentence.bang}`};
    const updatedDoc ={
      $set:{
        "sentences.eng": `${sentence.eng}`,
        "sentences.bang": `${sentence.bang}`,
      }
    }
    const result = await englishTopicsCollection.updateOne(query, updatedDoc);
    res.send(result);
  })
  app.patch('/deleteSentce/:topic', async(req, res) =>{
    const topic = req.params.topic;
    const sentence = req.body
    const query = {topic:topic};
    const updatedDoc ={
      $pull:{
        sentences: sentence
      }
    }
    const result = await englishTopicsCollection.updateOne(query, updatedDoc);
    res.send(result);
  })
app.get('/all-topics', async (req, res) =>{
  const result = await englishTopicsCollection.find().toArray();
  res.send(result)
})

app.get('/english-sentences/:topic', async (req, res) =>{
  const topic = req.params.topic
const query = {topic: topic};
  const result = await englishCollection.find(query).toArray();
  res.send(result)
})
app.get('/all-englishData', async (req, res) =>{
  const result = await englishCollection.find().toArray();
  res.send(result)
})

app.post('/english-sentences', async (req, res) =>{
  const sentencesData = req.body
    const result = await englishCollection.insertOne(sentencesData);
    res.send(result)
  })
 app.delete("/delete-topic/:id", async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await englishTopicsCollection.deleteOne(query);
  res.send(result)
 })
 app.delete("/delete-english-sentence/:topic", async(req, res) =>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await englishCollection.deleteOne(query);
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
    res.send('notes-server server is runing')
})

app.listen(port, () =>{
    console.log(`notes-server is runing on port ${port}`)
})
