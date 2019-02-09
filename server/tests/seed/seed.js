const { ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const { Todo } = require('./../../models/todo');
const { User } = require('./../../models/user');


const userOneId = new ObjectId();
const userTwoId = new ObjectId();
const users = [ {
    _id: userOneId,
    email: 'saksham@example.com',
    password: 'userOnePass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: userOneId, access: 'auth' }, 'abs123').toString()
    }]
}, {
    _id: userTwoId,
    email: 'example@example.com',
    password: 'userTwoPass',
    tokens: [{
        access: 'auth',
        token: jwt.sign({ _id: userTwoId, access: 'auth' }, 'abs123').toString()
    }]

}]

const populateUsers = done => {
    User.remove({}).then(() => {
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();

        return Promise.all([userOne, userTwo]);
    }).then(() => done());
}


const todos = [
  {
    text: "First test todo",
    _id: new ObjectId(),
    _creator: userOneId
  },
  {
    text: "Second test todo",
    _id: new ObjectId(),
    complete: true,
    completedAt: 3333,
    _creator: userTwoId
  }
];

const populateTodos = done => {
  Todo.remove({})
    .then(() => {
      Todo.insertMany(todos);
    })
    .then(() => done());
};

module.exports = { todos, populateTodos, users, populateUsers };
