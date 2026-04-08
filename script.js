// ============= ELEMENTOS DO DOM =============
const authSection = document.getElementById('authSection');
const mainApp = document.getElementById('mainApp');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');

const reviewForm = document.getElementById('reviewForm');
const commentInput = document.getElementById('comment');
const imageInput = document.getElementById('image');
const captionInput = document.getElementById('caption');
const ratingInput = document.getElementById('rating');
const ratingStars = document.getElementById('ratingStars');
const postsContainer = document.getElementById('postsContainer');

const currentUserName = document.getElementById('currentUserName');
const logoutButton = document.getElementById('logoutButton');

// ============= CHAVES DE ARMAZENAMENTO =============
const USERS_KEY = 'popcritics_users';
const POSTS_KEY = 'popcritics_posts';
const VOTES_KEY = 'popcritics_votes';
const CURRENT_USER_KEY = 'popcritics_current_user';

// ============= VARIÁVEIS GLOBAIS =============
let posts = [];
let votes = {};
let currentUser = null;

// ============= FUNÇÕES DE USUÁRIO =============
function loadUsers() {
  const saved = localStorage.getItem(USERS_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const saved = localStorage.getItem(CURRENT_USER_KEY);
  return saved ? JSON.parse(saved) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
  currentUser = user;
}

function registerUser(name, email, password) {
  const users = loadUsers();
  
  // Verificar se email já existe
  if (users.some(u => u.email === email)) {
    alert('Este email já está cadastrado!');
    return false;
  }

  // Validações
  if (!name.trim()) {
    alert('Por favor, informe seu nome.');
    return false;
  }

  if (name.length > 50) {
    alert('O nome deve ter no máximo 50 caracteres.');
    return false;
  }

  if (password.length < 6) {
    alert('A senha deve ter pelo menos 6 caracteres.');
    return false;
  }

  // Criar novo usuário
  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.toLowerCase(),
    password: password, // Em produção, fazer hash!
    createdAt: Date.now()
  };

  users.push(newUser);
  saveUsers(users);
  
  return newUser;
}

function loginUser(email, password) {
  const users = loadUsers();
  const user = users.find(u => u.email === email.toLowerCase() && u.password === password);
  
  if (!user) {
    alert('Email ou senha incorretos.');
    return null;
  }

  return user;
}

function logout() {
  setCurrentUser(null);
  votes = {}; // Resetar votos ao fazer logout
  showAuthSection();
  postsContainer.innerHTML = ''; // Limpar posts renderizados
  loginForm.reset();
  registerForm.reset();
}

// ============= FUNÇÕES DE POSTS =============
function loadPosts() {
  const saved = localStorage.getItem(POSTS_KEY);
  return saved ? JSON.parse(saved) : [];
}

function savePosts() {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

function loadVotes() {
  const saved = localStorage.getItem(VOTES_KEY);
  return saved ? JSON.parse(saved) : {};
}

function saveVotes() {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

// ============= FUNÇÕES DE UI =============
function showAuthSection() {
  authSection.classList.remove('hidden');
  mainApp.classList.add('hidden');
}

function showMainApp() {
  authSection.classList.add('hidden');
  mainApp.classList.remove('hidden');
  currentUserName.textContent = `Olá, ${currentUser.name}!`;
  renderPosts(); // Re-renderizar posts com o novo usuário
}

function toggleForms() {
  const isLoginVisible = !loginForm.classList.contains('hidden');
  
  if (isLoginVisible) {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  } else {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  }
  
  loginForm.reset();
  registerForm.reset();
}

function formatStars(value) {
  return '★'.repeat(value) + '☆'.repeat(5 - value);
}

function createPostElement(post) {
  const card = document.createElement('article');
  card.className = 'post-card';
  
  // Encontrar o autor pelo userId
  const users = loadUsers();
  const authorUser = users.find(u => u.id === post.userId);
  const authorName = authorUser ? authorUser.name : 'Usuário desconhecido';
  
  const isCurrentUserPost = post.userId === currentUser.id;
  
  // Verificar o voto atual do usuário para este post
  const voteKey = `${currentUser.id}_${post.id}`;
  const currentVote = votes[voteKey];
  
  const likeClass = currentVote === 'like' ? 'voted' : '';
  const dislikeClass = currentVote === 'dislike' ? 'voted' : '';
  
  card.innerHTML = `
    <div class="post-header">
      <div>
        <div class="post-meta"><strong>${escapeHtml(authorName)}</strong> · Postado em ${new Date(post.createdAt).toLocaleString('pt-BR')}</div>
      </div>
      <div class="post-rating">${formatStars(post.rating)} (${post.rating}/5)</div>
    </div>
    <p class="post-comment">${escapeHtml(post.comment)}</p>
    ${post.imageData ? `<div class="post-image"><img src="${post.imageData}" alt="Imagem da avaliação" /></div>` : ''}
    ${post.caption ? `<p class="post-caption">${escapeHtml(post.caption)}</p>` : ''}
    <div class="post-actions">
      <button class="action-button like ${likeClass}" data-action="like" data-id="${post.id}">👍 <span class="action-count">${post.likes}</span></button>
      <button class="action-button dislike ${dislikeClass}" data-action="dislike" data-id="${post.id}">👎 <span class="action-count">${post.dislikes}</span></button>
      ${isCurrentUserPost ? `<button class="action-button delete" data-action="delete" data-id="${post.id}">🗑️ Excluir</button>` : ''}
    </div>
  `;
  return card;
}

function renderPosts() {
  postsContainer.innerHTML = '';
  if (!posts.length) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.textContent = 'Nenhuma avaliação publicada ainda. Crie a primeira agora!';
    postsContainer.appendChild(emptyState);
    return;
  }

  const sorted = [...posts].sort((a, b) => b.createdAt - a.createdAt);
  sorted.forEach(post => {
    postsContainer.appendChild(createPostElement(post));
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;');
}

function updateStars(value) {
  ratingInput.value = value;
  ratingStars.querySelectorAll('.star').forEach(button => {
    const starValue = Number(button.dataset.value);
    button.classList.toggle('selected', starValue <= value);
    button.textContent = starValue <= value ? '★' : '☆';
  });
}

// ============= EVENT LISTENERS - AUTENTICAÇÃO =============
loginForm.addEventListener('submit', event => {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  const user = loginUser(email, password);
  if (user) {
    setCurrentUser(user);
    votes = loadVotes(); // Carregar votos para este usuário
    showMainApp();
    loginForm.reset();
  }
});

registerForm.addEventListener('submit', event => {
  event.preventDefault();
  
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

  if (password !== passwordConfirm) {
    alert('As senhas não conferem!');
    return;
  }

  const user = registerUser(name, email, password);
  if (user) {
    alert('Conta criada com sucesso! Agora você pode fazer login.');
    setCurrentUser(user);
    votes = loadVotes(); // Carregar votos para este novo usuário
    showMainApp();
    registerForm.reset();
  }
});

switchToRegister.addEventListener('click', event => {
  event.preventDefault();
  toggleForms();
});

switchToLogin.addEventListener('click', event => {
  event.preventDefault();
  toggleForms();
});

logoutButton.addEventListener('click', () => {
  if (confirm('Você tem certeza que deseja sair?')) {
    logout();
  }
});

// ============= EVENT LISTENERS - FORMULÁRIO DE POSTS =============
reviewForm.addEventListener('submit', event => {
  event.preventDefault();

  const comment = commentInput.value.trim();
  const caption = captionInput.value.trim();
  const rating = Number(ratingInput.value);
  const file = imageInput.files[0];

  if (!comment) {
    alert('Por favor, adicione um comentário.');
    return;
  }

  if (comment.length > 500) {
    alert('O comentário deve ter no máximo 500 caracteres.');
    return;
  }

  if (caption.length > 100) {
    alert('A legenda deve ter no máximo 100 caracteres.');
    return;
  }

  if (!rating || rating < 1 || rating > 5) {
    alert('Por favor, selecione uma avaliação de 1 a 5 estrelas.');
    return;
  }

  const newPost = {
    id: Date.now().toString(),
    userId: currentUser.id,
    comment,
    caption,
    rating,
    imageData: null,
    likes: 0,
    dislikes: 0,
    createdAt: Date.now(),
  };

  function saveAndReset() {
    posts.push(newPost);
    savePosts();
    renderPosts();
    reviewForm.reset();
    updateStars(0);
    imageInput.value = '';
    ratingInput.value = '0';
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      newPost.imageData = reader.result;
      saveAndReset();
    };
    reader.readAsDataURL(file);
  } else {
    saveAndReset();
  }
});

// ============= EVENT LISTENERS - RATING =============
ratingStars.addEventListener('click', event => {
  const button = event.target.closest('button.star');
  if (!button) return;
  const value = Number(button.dataset.value);
  updateStars(value);
});

// ============= EVENT LISTENERS - POSTS =============
postsContainer.addEventListener('click', event => {
  const button = event.target.closest('button.action-button');
  if (!button) return;

  const action = button.dataset.action;
  const postId = button.dataset.id;
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) return;

  // Criar chave única para cada usuário e post
  const voteKey = `${currentUser.id}_${postId}`;
  const currentVote = votes[voteKey];
  
  if (action === 'like') {
    if (currentVote === 'like') {
      votes[voteKey] = null;
      posts[postIndex].likes -= 1;
    } else {
      if (currentVote === 'dislike') {
        posts[postIndex].dislikes -= 1;
      }
      votes[voteKey] = 'like';
      posts[postIndex].likes += 1;
    }
  }

  if (action === 'dislike') {
    if (currentVote === 'dislike') {
      votes[voteKey] = null;
      posts[postIndex].dislikes -= 1;
    } else {
      if (currentVote === 'like') {
        posts[postIndex].likes -= 1;
      }
      votes[voteKey] = 'dislike';
      posts[postIndex].dislikes += 1;
    }
  }

  if (action === 'delete') {
    // Verificar se o usuário atual é o criador do post
    if (posts[postIndex].userId !== currentUser.id) {
      alert('Você só pode apagar suas próprias publicações!');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
      posts = posts.filter(post => post.id !== postId);
      delete votes[postId];
      savePosts();
      saveVotes();
      renderPosts();
    }
    return;
  }

  if (!votes[voteKey]) {
    delete votes[voteKey];
  }

  saveVotes();
  savePosts();
  renderPosts();
});

// ============= INICIALIZAÇÃO =============
posts = loadPosts();
votes = loadVotes();
currentUser = getCurrentUser();

if (currentUser) {
  showMainApp();
  renderPosts();
} else {
  showAuthSection();
}
