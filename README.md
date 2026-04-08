# PopCritics - Sistema de Avaliações

Um sistema web completo para avaliações e comentários com sistema de autenticação e banco de dados.

## 🚀 Funcionalidades

- ✅ Sistema de login e registro
- ✅ Publicação de avaliações com estrelas
- ✅ Upload de imagens
- ✅ Sistema de likes/dislikes
- ✅ Dados sincronizados entre dispositivos
- ✅ Interface responsiva

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Navegador moderno

## 🛠️ Configuração

### 1. Configurar Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto chamado "PopCritics"
3. Vá para **SQL Editor** e execute estas queries:

```sql
-- Tabela de usuários
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de posts
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  caption TEXT,
  rating INTEGER NOT NULL,
  image_data TEXT,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de votos
CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  post_id TEXT NOT NULL REFERENCES posts(id),
  vote_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Configurar Credenciais

1. Vá em **Settings > API**
2. Copie o **Project URL** e **anon key**
3. Abra o arquivo `config.js` e substitua:

```javascript
const SUPABASE_URL = 'https://SEU-PROJECT-URL.supabase.co';
const SUPABASE_ANON_KEY = 'SUA-ANON-KEY';
```

### 3. Hospedar o Site

**Opção 1: GitHub Pages (Grátis)**
1. Torne o repositório público
2. Vá em **Settings > Pages**
3. Selecione **"Deploy from a branch"** > **main** > **Save**
4. Aguarde 2-3 minutos e acesse: `https://SEU-USUARIO.github.io/PopCritics`

**Opção 2: Servidor Local**
```bash
python3 -m http.server 8000
# Acesse: http://localhost:8000
```

## 🎯 Como Usar

1. **Criar conta** ou **fazer login**
2. **Publicar avaliações** com comentários e estrelas
3. **Dar likes/dislikes** nas publicações
4. **Apagar** apenas suas próprias publicações
5. **Dados sincronizados** entre todos os dispositivos!

## 🔧 Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Backend:** Supabase (PostgreSQL)
- **Autenticação:** Sistema customizado
- **Armazenamento:** Base64 para imagens

## 📝 Notas

- As senhas são armazenadas em texto plano (para desenvolvimento)
- Em produção, implemente hash de senha
- Configure RLS (Row Level Security) no Supabase para maior segurança

---

**🎉 Pronto! Agora seu PopCritics funciona em qualquer dispositivo!**
