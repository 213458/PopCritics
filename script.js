// ============= CONFIGURAÇÃO SUPABASE =============
// (Será carregado do config.js)

// ============= VARIÁVEIS GLOBAIS =============
let posts = [];
let votes = {};
let currentUser = null;

// ============= FUNÇÕES DE USUÁRIO =============
async function loadUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao carregar usuários:', error);
    return [];
  }
}

async function saveUsers(users) {
  // Não precisamos salvar usuários manualmente - Supabase cuida disso
  return true;
}

function getCurrentUser() {
  const saved = localStorage.getItem('popcritics_current_user');
  return saved ? JSON.parse(saved) : null;
}

function setCurrentUser(user) {
  if (user) {
    localStorage.setItem('popcritics_current_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('popcritics_current_user');
  }
  currentUser = user;
}

async function registerUser(name, email, password) {
  try {
    // Verificar se email já existe
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase());

    if (checkError) throw checkError;

    if (existingUsers && existingUsers.length > 0) {
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
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('users')
      .insert([newUser])
      .select();

    if (error) throw error;

    return data[0];
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    alert('Erro ao criar conta. Tente novamente.');
    return false;
  }
}

async function loginUser(email, password) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('password', password);

    if (error) throw error;

    if (!data || data.length === 0) {
      alert('Email ou senha incorretos.');
      return null;
    }

    return data[0];
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Erro ao fazer login. Tente novamente.');
    return null;
  }
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
async function loadPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        users!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transformar dados para manter compatibilidade
    return data.map(post => ({
      id: post.id,
      userId: post.user_id,
      author: post.users.name, // Para compatibilidade
      comment: post.comment,
      caption: post.caption,
      rating: post.rating,
      imageData: post.image_data,
      likes: post.likes,
      dislikes: post.dislikes,
      createdAt: new Date(post.created_at).getTime()
    })) || [];
  } catch (error) {
    console.error('Erro ao carregar posts:', error);
    return [];
  }
}

async function savePosts() {
  // Não precisamos salvar posts manualmente - Supabase cuida disso
  return true;
}

async function loadVotes() {
  if (!currentUser) return {};

  try {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', currentUser.id);

    if (error) throw error;

    // Transformar para o formato esperado
    const votesObj = {};
    data.forEach(vote => {
      votesObj[`${vote.user_id}_${vote.post_id}`] = vote.vote_type;
    });

    return votesObj;
  } catch (error) {
    console.error('Erro ao carregar votos:', error);
    return {};
  }
}

async function saveVotes() {
  // Não precisamos salvar votos manualmente - Supabase cuida disso
  return true;
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
  // Carregar dados do Supabase
  loadPosts().then(loadedPosts => {
    posts = loadedPosts;
    return loadVotes();
  }).then(loadedVotes => {
    votes = loadedVotes;
    renderPosts();
  }).catch(error => {
    console.error('Erro ao carregar dados:', error);
    renderPosts(); // Renderizar mesmo com erro
  });
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
  
  const isCurrentUserPost = post.userId === currentUser.id;
  
  // Verificar o voto atual do usuário para este post
  const voteKey = `${currentUser.id}_${post.id}`;
  const currentVote = votes[voteKey];
  
  const likeClass = currentVote === 'like' ? 'voted' : '';
  const dislikeClass = currentVote === 'dislike' ? 'voted' : '';
  
  card.innerHTML = `
    <div class="post-header">
      <div>
        <div class="post-meta"><strong>${escapeHtml(post.author)}</strong> · Postado em ${new Date(post.createdAt).toLocaleString('pt-BR')}</div>
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
loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  const user = await loginUser(email, password);
  if (user) {
    setCurrentUser(user);
    showMainApp();
    loginForm.reset();
  }
});

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  
  const name = document.getElementById('registerName').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

  if (password !== passwordConfirm) {
    alert('As senhas não conferem!');
    return;
  }

  const user = await registerUser(name, email, password);
  if (user) {
    alert('Conta criada com sucesso! Agora você pode fazer login.');
    setCurrentUser(user);
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
reviewForm.addEventListener('submit', async event => {
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
    user_id: currentUser.id,
    comment,
    caption,
    rating,
    image_data: null,
    likes: 0,
    dislikes: 0,
    created_at: new Date().toISOString()
  };

  function saveAndReset() {
    // Salvar no Supabase
    supabase.from('posts').insert([newPost]).then(({ error }) => {
      if (error) {
        console.error('Erro ao salvar post:', error);
        alert('Erro ao publicar avaliação. Tente novamente.');
        return;
      }

      // Adicionar à lista local e renderizar
      posts.unshift({
        ...newPost,
        userId: newPost.user_id,
        author: currentUser.name,
        createdAt: new Date(newPost.created_at).getTime(),
        imageData: newPost.image_data
      });

      renderPosts();
      reviewForm.reset();
      updateStars(0);
      imageInput.value = '';
      ratingInput.value = '0';
    });
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      newPost.image_data = reader.result;
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
postsContainer.addEventListener('click', async event => {
  const button = event.target.closest('button.action-button');
  if (!button) return;

  const action = button.dataset.action;
  const postId = button.dataset.id;
  const postIndex = posts.findIndex(p => p.id === postId);
  if (postIndex === -1) return;

  // Criar chave única para cada usuário e post
  const voteKey = `${currentUser.id}_${postId}`;
  const currentVote = votes[voteKey];

  if (action === 'like' || action === 'dislike') {
    const newVote = action;
    let likeChange = 0;
    let dislikeChange = 0;

    if (currentVote === newVote) {
      // Remover voto
      if (newVote === 'like') likeChange = -1;
      else dislikeChange = -1;
      votes[voteKey] = null;
    } else {
      // Trocar ou adicionar voto
      if (currentVote === 'like') likeChange = -1;
      else if (currentVote === 'dislike') dislikeChange = -1;

      if (newVote === 'like') likeChange = 1;
      else dislikeChange = 1;

      votes[voteKey] = newVote;
    }

    // Atualizar contadores locais
    posts[postIndex].likes += likeChange;
    posts[postIndex].dislikes += dislikeChange;

    // Atualizar no Supabase
    try {
      // Atualizar contadores do post
      await supabase
        .from('posts')
        .update({
          likes: posts[postIndex].likes,
          dislikes: posts[postIndex].dislikes
        })
        .eq('id', postId);

      // Gerenciar voto na tabela votes
      if (votes[voteKey]) {
        // Inserir ou atualizar voto
        await supabase
          .from('votes')
          .upsert({
            id: voteKey,
            user_id: currentUser.id,
            post_id: postId,
            vote_type: votes[voteKey]
          });
      } else {
        // Remover voto
        await supabase
          .from('votes')
          .delete()
          .eq('id', voteKey);
      }

      renderPosts();
    } catch (error) {
      console.error('Erro ao atualizar voto:', error);
      alert('Erro ao registrar voto. Tente novamente.');
      // Reverter mudanças locais
      posts[postIndex].likes -= likeChange;
      posts[postIndex].dislikes -= dislikeChange;
      votes[voteKey] = currentVote;
    }
  }

  if (action === 'delete') {
    // Verificar se o usuário atual é o criador do post
    if (posts[postIndex].userId !== currentUser.id) {
      alert('Você só pode apagar suas próprias publicações!');
      return;
    }

    if (confirm('Tem certeza que deseja excluir esta avaliação?')) {
      try {
        // Deletar do Supabase
        await supabase
          .from('posts')
          .delete()
          .eq('id', postId);

        // Também deletar votos relacionados
        await supabase
          .from('votes')
          .delete()
          .eq('post_id', postId);

        // Remover da lista local
        posts = posts.filter(post => post.id !== postId);
        delete votes[voteKey];

        renderPosts();
      } catch (error) {
        console.error('Erro ao deletar post:', error);
        alert('Erro ao excluir avaliação. Tente novamente.');
      }
    }
    return;
  }
});

// ============= INICIALIZAÇÃO =============
currentUser = getCurrentUser();

if (currentUser) {
  // Carregar dados do Supabase se usuário estiver logado
  loadPosts().then(loadedPosts => {
    posts = loadedPosts;
    return loadVotes();
  }).then(loadedVotes => {
    votes = loadedVotes;
    showMainApp();
  }).catch(error => {
    console.error('Erro ao carregar dados:', error);
    showMainApp(); // Mostrar app mesmo com erro
  });
} else {
  showAuthSection();
}
