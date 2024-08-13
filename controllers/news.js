const router = require('express').Router();
const News = require('../models/news');
const Comment = require('../models/comment');
const { userExtractor } = require('../utils/middleware');
const logger = require('../utils/logger');

// GET ALL NEWS WHIT PAGINATION
router.get('/', async (request, response) => {
  const { page = 1, limit = 10 } = request.query;

  try {
    const news = await News.find({})
      .populate('user', { username: 1, email: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await News.countDocuments();

    logger.info(`news loaded`);
    response.status(200).json({
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error(error.message);
    response.status(500).json({ error: error.message });
  }
});

//GET ONE NEWS
router.get('/:id', async (request, response) => {
  const news = await News.findById(request.params.id).populate({
    path: 'comments',
    select: 'content likes user',
    populate: {
      path: 'user',
      select: 'username email',
    },
  });
  if (!news) {
    return response.status(404).json({ error: 'news not found' });
  }
  logger.info(`news ${request.params.id} loaded`);
  response.status(200).json(news);
});

//CREATE NEWS
router.post('/', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  if (!user.isAdmin) {
    return response
      .status(401)
      .json({ error: 'you are not allowed to do that' });
  }

  const body = request.body;

  if (
    !body.title ||
    !body.description ||
    !body.content ||
    !body.author ||
    !body.image
  ) {
    return response.status(400).json({ error: 'all fields are required' });
  }
  const categorias = [
    'cultura',
    'moda',
    'esporte',
    'arte',
    'politica',
    'natureza',
    'saude',
    'ciencia',
    'entretenimento',
  ];

  if (body.category && !categorias.includes(body.category)) {
    return response.status(400).json({ error: 'invalid category' });
  }

  const news = new News({
    title: body.title,
    description: body.description,
    content: body.content,
    author: body.author,
    image: body.image,
    category: body.category,
    user: user._id,
  });

  const savedNews = await news.save();
  logger.info(`news ${body.title} created`);
  response.status(201).json(savedNews);
});

//UPDATE NEWS
router.put('/:id', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  if (!user.isAdmin) {
    return response
      .status(401)
      .json({ error: 'you are not allowed to do that' });
  }

  const body = request.body;
  const news = {
    title: body.title,
    description: body.description,
    content: body.content,
    author: body.author,
    image: body.image,
    category: body.category,
  };
  const updatedNews = await News.findByIdAndUpdate(request.params.id, news, {
    new: true,
    runValidators: true,
    context: 'query',
  });
  logger.info(`news ${body.title} updated`);
  response.status(201).json(updatedNews);
});

// DELETE NEWS
router.delete('/:id', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  if (!user.isAdmin) {
    return response
      .status(401)
      .json({ error: 'you are not allowed to do that' });
  }

  try {
    const news = await News.findById(request.params.id);

    if (!news) {
      return response.status(404).json({ error: 'news not found' });
    }

    await Comment.deleteMany({ _id: { $in: news.comments } });

    await News.findByIdAndDelete(request.params.id);

    logger.info(`news ${request.params.id} and associated comments deleted`);
    response.status(204).end();
  } catch (error) {
    logger.error(error.message);
    response.status(500).json({ error: error.message });
  }
});

//GET ALL NEWS BY USER
router.get('/user/:id', async (request, response) => {
  const news = await News.find({ user: request.params.id }).populate('user', {
    username: 1,
    email: 1,
  });

  if (!news) {
    return response.status(404).json({ error: 'news not found' });
  }

  logger.info(`news ${request.params.id} loaded`);
  response.status(200).json(news);
});

// GET NEWS BY CATEGORY AND PAGINATION
router.get('/category/:category', async (request, response) => {
  const { page = 1, limit = 10 } = request.query;
  try {
    const news = await News.find({ category: request.params.category })
      .populate('user', { username: 1, email: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    const count = await News.countDocuments({
      category: request.params.category,
    });
    response.status(200).json({
      news,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

module.exports = router;
