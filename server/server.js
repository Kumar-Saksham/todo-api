const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');

const { mongoose } = require('./db/mongoose');

const { Todo } = require('./models/todo');
const { User } = require('./models/user');


const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("HELLO THERE");
})

app.post('/todos', (req, res) => {
    var todo = new Todo({
        text: req.body.text
    });

    todo.save().then(doc => { res.send(doc); }, err => { res.status(400).send(err) });
})

app.get('/todos', (req, res) => {
    Todo.find().then(todos => {
        res.send({ todos })
    }, err => {
        res.status(400).send(err);
    })
})

app.get('/todos/:id', (req, res) => {
    const id = req.params.id;

    if(!ObjectId.isValid(id)){
        return res.status(404).send();
    }

    Todo.findById(id).then(todo => {
        if(!todo){
            return res.status(404).send();
        }
        res.send({todo});
    }, err => res.status(400).send());
    
})


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log("started on port", port);
})

module.exports = { app };

