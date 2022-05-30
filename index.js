const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { verify } = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);



const port = process.env.PORT || 5000;
const app = express();


//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ovzqp.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}



async function run() {
    try {
        await client.connect();
        const itemCollection = client.db('assignment-12').collection('tools');
        const explorCollection = client.db('assignment-12').collection('reviews');
        const orderCollection = client.db('assignment-12').collection('orders');
        const userCollection = client.db('assignment-12').collection('users');
        const userDitailCollection = client.db('assignment-12').collection('userDital');




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
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (email) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else {
                const query = {};
                const cursor = orderCollection.find(query);
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
    app.get('/orders', verifyJWT, async (req, res) => {
        const email = req.query.email;
        const decodedEmail = req.decoded.email;
        if (email === decodedEmail) {
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const items = await cursor.toArray();
            return res.send(items);
        }
        else {

            // const query = {};
            // const cursor = orderCollection.find(query);
            // const items = await cursor.toArray();
            return res.status(403).send({ message: 'forbidden access' });

        }
    });
    app.get('/orders/:id',  async(req, res) =>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const booking = await orderCollection.findOne(query);
        res.send(booking);
      })

    app.get('/users', async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
    });

    app.get('/admin/:email', async (req, res) => {
        const email = req.params.email;
        const user = await userCollection.findOne({ email: email });
        const isAdmin = user.role === 'admin';
        res.send({ admin: isAdmin })
    })


    // POST
    app.post('/tools', async (req, res) => {
        const newItem = req.body;
        const result = await itemCollection.insertOne(newItem);
        res.send(result);
    });
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
    app.post('/userDital', async (req, res) => {
        const newItem = req.body;
        const result = await userDitailCollection.insertOne(newItem);
        res.send(result);
    });

    app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
        const service = req.body;
        const price = service.price;
        const amount = price*100;
        const paymentIntent = await stripe.paymentIntents.create({
          amount : amount,
          currency: 'usd',
          payment_method_types:['card']
        });
        res.send({clientSecret: paymentIntent.client_secret})
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

    app.put('/users/admin/:email', verifyJWT, async (req, res) => {
        const email = req.params.email;
        const requester = req.decoded.email;
        const requesterAccount = await userCollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        }
        // else{
        //   res.status(403).send({message: 'forbidden'});
        // }

    });

    app.put('/users/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
            $set: user,
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.send({ result, token });
    });

    app.patch('/orders/:id', verifyJWT, async(req, res) =>{
        const id  = req.params.id;
        const payment = req.body;
        const filter = {_id: ObjectId(id)};
        const updatedDoc = {
          $set: {
            paid: true,
            transactionId: payment.transactionId
          }
        }
  
        const result = await paymentCollection.insertOne(payment);
        const updatedBooking = await orderCollection.updateOne(filter, updatedDoc);
        res.send(updatedBooking);
      })


    // DELETE
    app.delete('/orders/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await orderCollection.deleteOne(query);
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