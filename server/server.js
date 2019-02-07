const express = require("express");
const bodyParser = require("body-parser");
const { ObjectId } = require("mongodb");
const _ = require("lodash");

const { mongoose } = require("./db/mongoose");

const { Todo } = require("./models/todo");
const { User } = require("./models/user");

const app = express();

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("HELLO THERE");
});

app.post("/todos", (req, res) => {
  var todo = new Todo({
    text: req.body.text
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

app.get("/todos", (req, res) => {
  Todo.find().then(
    todos => {
      res.send({ todos });
    },
    err => {
      res.status(400).send(err);
    }
  );
});

app.get("/todos/:id", (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findById(id).then(
    todo => {
      if (!todo) {
        return res.status(404).send();
      }
      res.send({ todo });
    },
    err => res.status(400).send()
  );
});

app.delete("/todos/:id", (req, res) => {
  const id = req.params.id;

  if (!ObjectId.isValid(id)) {
    return res.status(404).send();
  }

  Todo.findByIdAndDelete(id).then(
    deletedTodo => {
      if (!deletedTodo) {
        return res.status(404).send();
      }
      res.send({ deletedTodo });
    },
    err => res.status(400).send()
  );
});

app.patch("/todos/:id", (req, res) => {
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

  Todo.findByIdAndUpdate(
    id,
    {
      $set: body
    },
    { new: true }
  ).then(todo => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({ todo });
  }, err => res.status(400).send());
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("started on port", port);
});

module.exports = { app };
