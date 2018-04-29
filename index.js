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

const getPosts = (first = 1, last = 100) => getJson(`${baseUrl}/posts`)
  .then(posts => {
    state.total = posts.length
    state.posts = posts.slice(first-1, last)
    renderPosts()
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
    postElement.setAttribute('data-post-id', post.id)
    updateInnerHtml(postElement, {
      '.title': post.title,
      '.body': post.body
    })
  })
  // TODO: remove potential extra nodes
}

document.addEventListener('DOMContentLoaded', () => {
  getPosts(1, 10).catch(err => {
    console.error(err)
  })
})