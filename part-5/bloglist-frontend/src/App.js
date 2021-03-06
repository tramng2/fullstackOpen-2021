import React, { useState, useEffect, useRef } from 'react'
import Blog from './components/Blog'
import blogsService from './services/blogs'
import loginService from './services/login'
import BlogForm from './components/BlogForm'
import Notification from './components/Notification'
import LoginForm from './components/LoginForm'
import ToggleTable from './components/ToggleTable'
import PropTypes from 'prop-types'
import { useField } from './custom_hooks/hooks'

const App = () => {
  const [blogs, setBlogs] = useState([])
  const username = useField('text')
  const password = useField('password')
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState({ type: '', content: '' })
  useEffect(() => {
    blogsService.getAll().then((blogs) => setBlogs(blogs))
  }, [])

  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      blogsService.setToken(user.token)
    }
  }, [])

  const blogFormRef = useRef()

  const addLikes = (blog) => {
    if (blog) {
      const newObject = blog
      newObject.likes++
      blogsService.update(blog.id, newObject).then(() => blogsService.getAll().then((blogs) => setBlogs(blogs)))
    }
  }
  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      const user = await loginService.login({
        username: username.value, password: password.value
      })
      window.localStorage.setItem('loggedUser', JSON.stringify(user))
      blogsService.setToken(user.token)
      setUser(user)
      setMessage({ type: 'noti', content: 'Logged' })
      setTimeout(() => {
        setMessage({ type: '', content: '' })
      }, 3000)
    } catch (exception) {
      setMessage({ type: 'error', content: 'Username or Password is invalid' })
      setTimeout(() => {
        setMessage({ type: '', content: '' })
      }, 3000)
    }
  }

  const addBlog = (newBlog) => {
    blogFormRef.current.toggleVisibility()
    blogsService.create(newBlog)
      .then((returnedBlog) => {
        setBlogs(blogs.concat(returnedBlog))
        setMessage({ type: 'noti', content: 'new note added' })
      })
      .catch((error) => setMessage({ type: 'error', content: `invalid input ${error}` }))
    setTimeout(() => {
      setMessage({ type: '', content: '' })
    }, 3000)
  }
  const deleteBlog = (blog) => {
    if(blog) {
      window.confirm('Do you want to delete this blog?') && blogsService.deleteRequest(blog.id).then(() => blogsService.getAll().then((blogs) => setBlogs(blogs)))
    }
  }
  const logout = () => {
    setUser(null)
    setMessage({ type: 'noti', content: 'Log out' })
    setTimeout(() => {
      setMessage({ type: '', content: '' })
    }, 3000)
    window.localStorage.removeItem('loggedUser')
  }
  return (
    <div>
      <h2>Blogs</h2>
      <Notification message={message} />
      {user === null ? (
        <ToggleTable buttonLable="login">
          <LoginForm
            username={username}
            password={password}
            handleSubmit={handleLogin}
          />
        </ToggleTable>
      ) : (
        <div>
          <h3>{user.username} logged in</h3>
          <button onClick={logout}>Log out</button>
          <ToggleTable buttonLable="Create new blog" ref={blogFormRef}>
            <BlogForm createBlog={addBlog} blogs={blogs} />
          </ToggleTable>
          <Blog blogs={blogs} user={user} handleAddLikes={addLikes} handleDelete={deleteBlog} />
        </div>
      )}
    </div>
  )
}

export default App

ToggleTable.propTypes = {
  buttonLable: PropTypes.string.isRequired
}