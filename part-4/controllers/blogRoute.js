const blogRouter = require('express').Router()
const Blog = require('../models/blogSchema')
const User = require('../models/userSchema')

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', {username : 1, name: 1})
  response.json(blogs)
})

blogRouter.post('/', async (request, response, next) => {
  const body = request.body
  const token = request.token
  const decodedToken = request.decodedToken

  if (!token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' })
  }
  const user = await User.findById(decodedToken.id)

  const blog = new Blog({
    title: body.title,
    url: body.url,
    likes: body.likes,
    author: body.author,
    user: user._id
  })
  const savedBlog = await blog.save()
  try {
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.json(savedBlog)
  } catch (exception) {
    next(exception)
  }
})

blogRouter.get('/:id', async (request, response,next) => {
  try {
    const blog = await Blog.findById(request.params.id)
    if(blog) {
      response.json(blog)
    } else {
      response.status(400).end()
    }
  } catch(error) {next(error)}
})


blogRouter.delete('/:id', async (request, response) => {
  if (!request.token || !request.decodedToken) {
    return response.status(401).json({ error: 'missing or invalid token' })
  }

  const blog = await Blog.findById(request.params.id)
  const userId = request.decodedToken.id

  if (blog.user.toString() !== userId.toString()) {
    response.status(400).end()
  }

  await Blog.findByIdAndRemove(request.params.id)
  response.status(204).end()
})

blogRouter.put('/:id', (request, response, next) => {
  const body = request.body
  const blog = {
    title: body.content,
    url: body.url,
    likes: body.likes,
    author: body.author
  }
  Blog.findByIdAndUpdate(request.params.id, blog, { new: true })
    .then((updatedBlog) => {
      response.json(updatedBlog)
    })
    .catch((error) => next(error))
})
module.exports = blogRouter
