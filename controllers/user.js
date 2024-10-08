const User = require('../models/user');
const router = require('express').Router();
const { userExtractor } = require('../utils/middleware');
const logger = require('../utils/logger');

// MANAGE USER SAVED NEWS
router.get('/', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const savedNews = await User.findById(user._id)
    .populate('savedNews')
    .select('savedNews');
  response.status(200).json(savedNews);
});

// SAVE/UNSAVE NEWS
router.put('/:id/save', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  if (user.savedNews.includes(request.params.id)) {
    const removed = user.savedNews.filter(
      (id) => id.toString() !== request.params.id,
    );
    user.savedNews = removed;
    logger.info(
      `news ${request.params.id} removed. New saved news: ${user.savedNews}`,
    );
    await user.save();
    return response.status(201).json({ message: 'news removed to saved news' });
  }

  user.savedNews.push(request.params.id);

  logger.info(
    `user saved after removing news. Current saved news: ${user.savedNews}`,
  );
  await user.save();
  response.status(201).json({ message: 'news added to saved news' });
});

// GET SAVED NEWS
router.get('/saved', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const savedNews = await User.findById(user._id)
    .populate('savedNews')
    .select('savedNews');
  response.status(200).json(savedNews);
});

module.exports = router;
