const expect = require("expect");
const request = require("supertest");
const { ObjectId } = require("mongodb");

const { app } = require("./../server");
const { Todo } = require("./../models/todo");

const todos = [
  {
    text: "First test todo",
    _id: new ObjectId()
  },
  {
    text: "Second test todo",
    _id: new ObjectId(),
    complete: true,
    completedAt: 3333
  }
];

console.log(todos);

beforeEach(done => {
  Todo.remove({})
    .then(() => {
      Todo.insertMany(todos);
    })
    .then(() => done());
});

describe("POST /todos", () => {
  it("should create a new todo", done => {
    let text = "Test todo text";

    request(app)
      .post("/todos")
      .send({ text })
      .expect(200)
      .expect(res => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find({ text })
          .then(todos => {
            expect(todos.length).toBe(1);
            expect(todos[0].text).toBe(text);
            done();
          })
          .catch(e => done(e));
      });
  });

  it("should not create todo with invalid body data", done => {
    const text = "";

    request(app)
      .post("/todos")
      .send({ text })
      .expect(400)
      .end((err, res) => {
        if (err) {
          return done(err);
        }

        Todo.find()
          .then(todos => {
            expect(todos.length).toBe(2);
            done();
          })
          .catch(e => done(e));
      });
  });
});

describe("GET /todos", () => {
    it("should get 2 test todos", done => {
        request(app)
            .get("/todos")
            .expect(200)
            .expect(res => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe("GET /todos/:id", () => {
    const correct_id = todos[0].id;
    const invalid_id = '124';
    const absent_id = "6c5c060b33540f07daa4669d";

    it("should return status 404 with empty body on invalid id", done => {
    request(app)
        .get(`/todos/${invalid_id}`)
        .expect(404)
        .end(done);
    });

    it("should return status 400 with empty body on valid but absent id", done => {
        request(app)
            .get(`/todos/${absent_id}`)
            .expect(404)
            .end(done);
    });

    it("should return correct todo on valid present id", done => {
        request(app)
            .get(`/todos/${todos[0]._id}`)
            .expect(200)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                Todo.find({ _id: todos[0]._id }).then(todos => {
                    expect(todos.length).toBe(1);
                    expect(res.body.todo.text).toBe(todos[0].text);
                    done();
                }).catch(e => done(e));
            })
    })
})

describe('DELETE /todos/:id', () => {
    it("should return deleted todo", done => {
        request(app)
            .delete(`/todos/${todos[0]._id}`)
            .expect(200)
            .expect(res => {
                expect(res.body.deletedTodo.text).toBe(todos[0].text);
            })
            .end((err, res) => {
                if(err){
                    return done(err);
                }
                Todo.findById(todos[0]._id.toHexString()).then(todo => {
                    expect(todo).toBe(null);
                    done();
                }).catch(e => done(e));
            });
    });

    it("should return 404 on invalid id", done => {
        request(app)
            .delete('/todos/1234')
            .expect(404)
            .end(done);
    });

    it("should return 404 on absent id", done => {
        request(app)
            .delete(`/todos/${new ObjectId().toHexString()}`)
            .expect(404)
            .end(done);
    })
});

describe('PATCH /todos/:id', () => {
    it("should update the todo", (done) => {
        const body = {
            completed: true,
            text: "YELLAAOWW!!"
        }
        request(app)
            .patch(`/todos/${todos[0]._id}`)
            .send(body)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(body.text);
                expect(res.body.todo.completed).toBe(true);
                expect(typeof res.body.todo.completedAt).toBe('number');
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                Todo.findById(todos[0]._id).then(todo => {
                    expect(todo.text).not.toBe(todos[0]._id);
                    expect(todo.completed).toBe(true);
                    expect(typeof todo.completedAt).toBe("number");
                    done();
                }).catch(e => done(e));
            });

    });

    it("should clear completedAt when todo is not completed", done => {
        const body = {
            text: "YELLAAOWW!! SAMMY HERE!!"
        }

        request(app)
            .patch(`/todos/${todos[1]._id}`)
            .send(body)
            .expect(200)
            .expect(res => {
                expect(res.body.todo.text).toBe(body.text);
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toBe(null);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }
                Todo.findById(todos[1]._id).then(todo => {
                    expect(todo.text).not.toBe(todos[1].text);
                    expect(todo.completed).toBe(false);
                    expect(todo.completedAt).toBe(null);
                    done();
                }).catch(e => done(e));
            })
    })
})