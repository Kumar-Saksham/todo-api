require("./config/config");

const express = require("express");
const bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
const _ = require("lodash");
const bcrypt = require('bcryptjs');

const { mongoose } = require("./db/mongoose");
const { authenticate } = require('./middleware/authenticate');

const { Todo } = require("./models/todo");
const { User } = require("./models/user");

const app = express();

app.use(bodyParser.json());

//TODOS
app.get("/", (req, res) => {
  res.send("HELLO THERE");
});

app.post("/todos", authenticate, (req, res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then(
    doc => {
      res.send(doc);
    },
    err => {
      res.status(400).send(err);
    }
  );
});

app.get("/todos", authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then(
    todos => {
      res.send({ todos });
    },
    err => {
      res.status(400).send(err);
    }
  );
});

app.get("/todos/:id", authenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOne({ _id: id, _creator: req.user._id }).then(
    todo => {
      console.log(todo)
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    },
    err => res.status(400).send()
  );
});

app.delete("/todos/:id", authenticate, (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findOneAndDelete({ _id: id, _creator: req.user._id }).then(
    deletedTodo => {
      if (!deletedTodo) {
        return res.status(404).send();
      }
      res.send({ deletedTodo });
    },
    err => res.status(400).send()
  );
});

app.patch("/todos/:id", authenticate, (req, res) => {
  const id = req.params.id;

  let body = _.pick(req.body, ["text", "completed"]);

  if (!ObjectId.isValid(id)) {
    return res.send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findOneAndUpdate(
    { _id: id, _creator: req.user._id },
    {
      $set: body
    },
    { new: true }
  ).then(
    todo => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    },
    err => res.status(400).send()
  );
});


//USERS
app.post("/users", (req, res) => {
  const body = _.pick(req.body, ["email", "password"]);
  
  const user = new User(body);
  
  user.save().then(() => {
    return user.generateAuthToken();
  }).then(token => {
    res.header('x-auth', token).send(user);
  }).catch(e => res.status(400).send(e));
});

app.get('/users/me', authenticate, (req, res) => {
  res.send(req.user);
});

app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then(user => {
    return user.generateAuthToken().then(token => {
      res.header('x-auth', token).send(user);
    });
  }).catch(e => {
    res.status(400).send(e);
  });
});

app.delete('/users/me/token', authenticate, (req, res) => {
  req.user.removeToken(req.token).then(() => {
    res.send();
  }, () => {
    res.status(400).send();
  });
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("started on port", port);
});

module.exports = { app };
