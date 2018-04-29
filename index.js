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
  const paginationContainerTemplate= document.getElementById('pagination-container-template')
  const template = document.getElementById('pagination-template')
  const containers = document.querySelectorAll('#pagination-top, #pagination-bottom')
  const numberOfPages = Math.ceil(state.total/state.perPage)
  const currentPage = Math.ceil(state.first/state.perPage)
  containers.forEach(_container => {
    clearChildren(_container)
    _container.appendChild(paginationContainerTemplate.content.cloneNode(true))
    let container = _container.querySelector('.pagination')
    for (let index = 1; index <= numberOfPages; index++) {
      const node = template.content.cloneNode(true)
      const pageNumberNode = node.querySelectorAll('.pagination-page-number')[0]
      updateInnerHtml(pageNumberNode, {
        'a': index,
      })
      node.firstElementChild.addEventListener('click', event => {
        event.preventDefault()
        goToPage(index)
      })
      if (index === currentPage) {
        node.firstElementChild.classList.add('current-page')
      }
      container.appendChild(node)
    }
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

const updateInnerHtml = (DOMNode, updates)  => {
  Object.keys(updates).forEach(selector => {
    DOMNode.querySelectorAll(selector)[0].innerHTML = updates[selector]
  })
}

const renderPosts = () => {
  const container = document.getElementById('posts-container')
  const postTemplate = document.getElementById('post-template')
  state.posts.forEach((post, index) => {
    let postElement = container.querySelectorAll(`[data-index="${index}"]`)[0]
    if (!postElement) {
      const clone = postTemplate.content.cloneNode(true)
      postElement = clone.querySelectorAll('.post')[0]
      postElement.setAttribute('data-index', index)
      container.appendChild(clone)
    }
    clearChildren(postElement.querySelector('.comment-container'))
    postElement.setAttribute('data-post-id', post.id)
    postElement.querySelector('[data-action="load-comments"]')
      .addEventListener('click', () => {
        loadComments(post.id)
      })
    updateInnerHtml(postElement, {
      '.title': post.title,
      '.body': post.body
    })
  })
  // TODO: remove potential extra nodes
}

let commentTemplate

const loadComments = postId => {
  const domElement = document.querySelector(`[data-post-id="${postId}"]`)
  const commentContainer = domElement.querySelector('.comment-container')
  domElement.querySelector('button').disabled = true
  domElement.classList.add('loading')
  getCommentsForPost(postId).then(comments => {
    clearChildren(commentContainer)
    domElement.querySelector('button').disabled = false
    comments.forEach(comment => {
      const clone = commentTemplate.content.cloneNode(true)
      commentElement = clone.querySelector('.comment')
      commentElement.setAttribute('data-comment-id', comment.id)
      updateInnerHtml(commentElement, {
        '.user-email': comment.email,
        '.comment-body': comment.body,
      })
      commentContainer.appendChild(clone)
    })
  }).catch(errorHandler)
}

const errorHandler = error => console.error(error)

document.addEventListener('DOMContentLoaded', () => {
  commentTemplate = document.getElementById('comment-template')
  getPosts(1, 10).catch(errorHandler)
})