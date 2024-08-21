const mongoose = require('mongoose');

const userSchema = mongoose.Schema(
  {
    isAdmin: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      minlength: 3,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: String,
    savedNews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'News',
      },
    ],
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    if (returnedObject._id) {
      returnedObject.id = returnedObject._id.toString();
      delete returnedObject._id;
    }
    delete returnedObject.__v;
    delete returnedObject.passwordHash;
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
