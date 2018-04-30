const baseUrl = 'https://jsonplaceholder.typicode.com'

const getJson = fullUrl => { // returns a promise
  if (!localStorage.getItem(fullUrl)) {
    return fetch(fullUrl).then(fetchResponse => {
      const jsonResponse = fetchResponse.json()
      return jsonResponse.then(parsedJson => {
        localStorage.setItem(fullUrl, JSON.stringify(parsedJson))
        return parsedJson
      })
    })
  } else {
    const cachedResponse = localStorage.getItem(fullUrl)
    try {
      return Promise.resolve(JSON.parse(cachedResponse))
    } catch (e) {
      return Promise.reject({ error: `Could not parse: ${cachedResponse}` })
    }
  }
}

const getCommentsForPost = postId => getJson(`${baseUrl}/posts/${postId}/comments`)

const renderItemsIntoTemplate = ({containerSelector, templateSelector, elementSelector, items = [ true ], callback}) => {
  const template = document.querySelector(templateSelector)
  const container = document.querySelector(containerSelector)
  clearChildren(container)
  items.forEach(item => {
    const clone = template.content.cloneNode(true)
    callback && callback(clone.querySelector(elementSelector), item)
    container.appendChild(clone)
  })
}

const serialPromsieFunctions = funcs =>
  funcs.reduce((promise, func) =>
    promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]))

const updateInnerHtml = (DOMNode, updates)  => {
  Object.keys(updates).forEach(selector => {
    DOMNode.querySelectorAll(selector)[0].innerHTML = updates[selector]
  })
}

const clearChildren = node => {
  while(node.hasChildNodes()) {
    node.removeChild(node.lastChild)
  }
}

const state = {
  first: 1,
  last: 10,
  perPage: 10,
  total: undefined,
}

const renderPagination = () => {
  const numberOfPages = Math.ceil(state.total/state.perPage)
  const currentPage = Math.ceil(state.first/state.perPage)
  const items = [...Array(numberOfPages).keys()].map(i => i+1)
  const pageNumberRenderCallback = (element, index) => {
    updateInnerHtml(element, {
      'a': index,
    })
    element.firstElementChild.addEventListener('click', event => {
      event.preventDefault()
      goToPage(index)
    })
    if (index === currentPage) {
      element.firstElementChild.classList.add('current-page')
    }
  }

  // top pagination
  renderItemsIntoTemplate({
    containerSelector: '#pagination-top',
    templateSelector: '#pagination-container-template',
  })
  renderItemsIntoTemplate({
    containerSelector: '#pagination-top .pagination',
    templateSelector: '#pagination-template',
    elementSelector: '.pagination-page-number',
    items: items, 
    callback: pageNumberRenderCallback,
  })

  // bottom pagination
  renderItemsIntoTemplate({
    containerSelector: '#pagination-bottom',
    templateSelector: '#pagination-container-template',
  })
  renderItemsIntoTemplate({
    containerSelector: '#pagination-bottom .pagination',
    templateSelector: '#pagination-template',
    elementSelector: '.pagination-page-number',
    items: items, 
    callback: pageNumberRenderCallback,
  })
}

const goToPage = newPageNumber => {
  state.first = (newPageNumber - 1) * state.perPage + 1
  state.last = newPageNumber * state.perPage
  getPosts(state.first, state.last)
}

const getPosts = (first = 1, last = 100) => getJson(`${baseUrl}/posts`)
  .then(posts => {
    state.first= first
    state.last = last
    state.total = posts.length
    state.posts = posts.slice(first-1, last)
    renderPosts()
    renderPagination()
  })

const renderPosts = () => {
  const container = document.getElementById('posts-container')
  const postTemplate = document.getElementById('post-template')
  const authorPromiseGenerators = []
  state.posts.forEach((post, index) => {
    authorPromiseGenerators.push(() => getJson(`${baseUrl}/users/${post.userId}`))
    let postElement = container.querySelectorAll(`[data-index="${index}"]`)[0]
    if (!postElement) {
      const clone = postTemplate.content.cloneNode(true)
      postElement = clone.querySelectorAll('.post')[0]
      postElement.setAttribute('data-index', index)
      container.appendChild(clone)
    }
    clearChildren(postElement.querySelector('.comment-container'))
    postElement.setAttribute('data-post-id', post.id)
    const postId = post.id
    postElement.removeEventListener('click', loadComments)
    postElement.querySelector('[data-action="load-comments"]')
      .addEventListener('click', loadComments)
    updateInnerHtml(postElement, {
      '.title': `${post.id}: ${post.title}`,
      '.body': post.body
    })
  })
  serialPromsieFunctions(authorPromiseGenerators).then(users => {
    state.posts.forEach(post => {
      const user = users.find(user => user.id === post.userId)
      let postElement = container.querySelectorAll(`[data-post-id="${post.id}"]`)[0]
      updateInnerHtml(postElement, {
        '.author': user.username
      })
    })
  })
}

const loadComments = event => {
  const postId = event.target.closest('.post').getAttribute('data-post-id') // 'closest' has no IE
  const postElement = document.querySelector(`[data-post-id="${postId}"]`)
  const button = postElement.querySelector('[data-action="load-comments"]')
  button.disabled = true
  getCommentsForPost(postId).then(comments => {
    renderItemsIntoTemplate({
      containerSelector: `[data-post-id="${postId}"] .comment-container`,
      templateSelector: '#comment-template',
      elementSelector: '.comment',
      items: comments,
      callback: (element, comment) => {
        element.setAttribute('data-comment-id', comment.id)
        updateInnerHtml(element, {
          '.user-email': comment.email,
          '.comment-body': comment.body,
        })
        element.querySelector('a').setAttribute('href', `mailto:${comment.email}`)
      }
    })
    // button.parentElement.removeChild(button)
    button.disabled = false
  }).catch(errorHandler)
}

const errorHandler = error => console.error(error)

document.addEventListener('DOMContentLoaded', () => {
  getPosts(1, 10).catch(errorHandler)
})