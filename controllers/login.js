const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const router = require('express').Router();
const { userExtractor } = require('../utils/middleware');
const logger = require('../utils/logger');
const config = require('../utils/config');

//POST  USER LOGIN token
router.post('/', async (request, response) => {
  const { username, password } = request.body;
  if (!username || !password) {
    return response.status(400).json({ error: 'username or password missing' });
  }
  const user = await User.findOne({ username });

  if (!user) {
    return response.status(401).json({ error: 'invalid username or password' });
  }

  const passwordCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!passwordCorrect) {
    return response.status(401).json({ error: 'invalid username or password' });
  }

  const userForToken = {
      username: user.username,
      id: user._id,
    },
    token = jwt.sign(userForToken, config.SECRET, {
      expiresIn: 60 * 60 * 24 * 7,
    });

  logger.info(`user ${user.username} logged in`);
  response.status(200).send({ token });
});

//GET USER BY TOKEN
router.get('/user', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  logger.info(`user ${user.username} loaded`);
  response.status(200).json(user);
});

//USER REGISTER
router.post('/', async (request, response) => {
  const { username, email, password } = request.body;

  if (!username || !email || !password) {
    return response
      .status(400)
      .json({ error: 'username, email or password missing' });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    email,
    passwordHash,
  });

  const savedUser = await user.save();

  const userForToken = {
    username: savedUser.username,
    id: savedUser._id,
  };

  const token = jwt.sign(userForToken, config.SECRET, {
    expiresIn: 60 * 60 * 24 * 7,
  });

  logger.info(`user ${username} registered`);
  response.status(201).json({ token });
});

module.exports = router;
