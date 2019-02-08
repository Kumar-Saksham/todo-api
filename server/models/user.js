const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 5,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: "{VALUE}, id not a valid email!"
    }
  },
  password: {
    type: String,
    require: true,
    trim: true,
    minlength: 6
  },
  tokens: [
    {
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required: true
      }
    }
  ]
});

//MONGOOSE MIDDLEWARE
UserSchema.pre('save', function (next) {
  const user = this;

  if(user.isModified('password')){
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      })
    })
  } else {
    next();
  }
})

//MODEL METHODS
UserSchema.statics.findByToken = function(token) {
  const User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, "abs123");
  } catch (e) {
    return Promise.reject();
  }
  return User.findOne({
    _id: decoded._id,
    "tokens.token": token,
    "tokens.access": "auth"
  });
};

UserSchema.statics.findByCredentials = function(email, password) {
  const user = this;

  return User.findOne({ email }).then(user => {
    if(!user){
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if(res){
          resolve(user);
        } else {
          reject();
        }
      })
    })
  })
};



//INSTANCE METHODS
UserSchema.methods.generateAuthToken = function() {
  let user = this;
  const access = "auth";
  const token = jwt
    .sign({ _id: user._id.toHexString(), access }, "abs123")
    .toString();

  user.tokens = [...user.tokens, { access, token }];

  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.toJSON = function() {
  const user = this;
  var userObject = user.toObject();

  return _.pick(userObject, ["_id", "email"]);
};

const User = mongoose.model("User", UserSchema);

module.exports = { User };
