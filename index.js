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
        // const explorCollection = client.db('assignment-11').collection('explor');




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