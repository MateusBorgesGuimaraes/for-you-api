const router = require('express').Router();
const Comment = require('../models/comment');
const News = require('../models/news');
const { userExtractor } = require('../utils/middleware');
const logger = require('../utils/logger');

//GET ALL COMMENT BY NEWS ID AND PAGINATION
router.get('/news/:id', async (request, response) => {
  const { page = 1, limit = 10 } = request.query;

  try {
    const comments = await Comment.find({ news: request.params.id })
      .populate('user', { username: 1, email: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Comment.countDocuments({ news: request.params.id });

    response.status(200).json({
      comments,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// POST COMMENT
router.post('/', userExtractor, async (request, response) => {
  try {
    const user = request.user;
    if (!user) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }
    const body = request.body;
    const comment = new Comment({
      content: body.content,
      user: user._id,
      news: body.news,
    });
    const savedComment = await comment.save();

    const news = await News.findById(body.news);
    if (!news) {
      return response.status(404).json({ error: 'news not found' });
    }
    news.comments.push(savedComment._id);
    await news.save();
    logger.info(`comment ${body.content} created`);
    response.status(201).json(savedComment);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// DELETE COMMENT
router.delete('/:id', userExtractor, async (request, response) => {
  const user = request.user;
  if (!user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const comment = await Comment.findById(request.params.id);
  if (!comment) {
    return response.status(404).json({ error: 'comment not found' });
  }
  if (user._id.toString() !== comment.user.toString()) {
    return response
      .status(401)
      .json({ error: 'you are not allowed to do that' });
  }
  const deletedComment = await Comment.findByIdAndDelete(request.params.id);
  logger.info(`comment ${deletedComment.content} deleted`);
  response.status(204).json({ message: 'Comentário deletado com sucesso' });
});

module.exports = router;
