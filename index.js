const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { verify } = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ovzqp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemCollection = client.db('assignment-12').collection('tools');
        const explorCollection = client.db('assignment-12').collection('reviews');
        const orderCollection = client.db('assignment-12').collection('orders');




        // SERVER API
        app.get('/tools', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (email) {
                const query = { email: email };
                const cursor = itemCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else {
                const query = {};
                const cursor = itemCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
        });

        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            console.log(id);
            const item = await itemCollection.findOne(query);
            res.send(item);
        });

        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = explorCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });
        app.get('/orders', async (req, res) => {
            const query = {};
            const cursor = orderCollection.find(query);
            const review = await cursor.toArray();
            res.send(review);
        });


        // POST
        app.post('/reviews', async (req, res) => {
            const newItem = req.body;
            const result = await explorCollection.insertOne(newItem);
            res.send(result);
        });
        app.post('/orders', async (req, res) => {
            const newItem = req.body;
            const order = await orderCollection.insertOne(newItem);
            res.send(order);
        });


          // UPDATE
          app.put('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.totalNewQuantity
                }
            };
            const result = await itemCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        });

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('final project assignment-12');
});

app.listen(port, () => {
    console.log(`Final project Listening on port ${port}`)
});