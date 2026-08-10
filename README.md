# 🎬 Nosso Cinema

Webapp para registrar filmes/séries assistidos, dar notas, manter a lista do que
querem assistir, e receber sugestões geradas por IA (Google Gemini) cruzando as
notas e as preferências de Brunno e Paloma.

Feito com **Next.js + TypeScript + Tailwind**, banco de dados **Supabase**
(Postgres) e IA **Google Gemini** (API gratuita).

## Antes de começar: uma coisa pra conferir

Na migração dos dados da planilha original, as duas colunas "Mô" foram
interpretadas como: **1ª coluna = Paloma, 2ª coluna = Brunno**. Se algum título
estiver com as notas trocadas depois de importar, é só editar direto pela tela
"Já assistimos" do app.

## 1. Estrutura do projeto

```
nosso-cinema/
  data/                  # dados extraídos da planilha original, prontos pra importar
  scripts/seed.ts        # script que importa data/*.json pro Supabase
  supabase/schema.sql    # script SQL que cria as tabelas
  src/app/                    # páginas (Next.js App Router)
    page.tsx                  # tela "quem tá assistindo?" (Brunno / Paloma)
    assistidos/page.tsx       # lista do que já assistiram
    assistir/page.tsx         # lista do que querem assistir + sugestões da IA
    perfil/page.tsx           # foto e preferências de cada usuário
    api/                      # rotas de backend (falam com Supabase e Gemini)
  src/components/         # componentes de UI reutilizáveis
  src/lib/                # tipos, helpers e clientes (Supabase, Gemini)
```

## 2. Criar o banco de dados (Supabase, gratuito)

1. Crie uma conta em [supabase.com](https://supabase.com) e crie um novo projeto.
2. Vá em **SQL Editor** → **New query**, cole o conteúdo de `supabase/schema.sql`
   e clique em **Run**. Isso cria as tabelas `filmes` e `perfis`.
3. Vá em **Project Settings** → **Data API**: copie a **API URL** (isso é o
   `SUPABASE_URL`).
4. Ainda em Settings → **API Keys**: copie a chave **service_role** (não é a
   `anon`/`public` — é a `service_role`, que fica só no backend e nunca é
   exposta ao navegador). Isso é o `SUPABASE_SERVICE_ROLE_KEY`.
5. Rode também os arquivos de `supabase/migrations/` no SQL Editor, na ordem
   alfabética. São os campos que foram adicionados depois do schema inicial
   (sistema de projetos, farol de prioridade). Todos usam `if not exists`,
   então rodar de novo não quebra nada.

## 3. Pegar a chave gratuita do Gemini

1. Acesse [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   e faça login com uma conta Google.
2. Clique em **Create API key** e copie o valor. Isso é o `GEMINI_API_KEY`.
3. O plano gratuito do Gemini tem um limite generoso de requisições por dia —
   mais do que suficiente para gerar sugestões esporadicamente.

## 4. Pegar a chave gratuita do TMDB (opcional — pôster automático)

Com essa chave o app busca sozinho o pôster oficial de cada filme, no lugar de
você subir a imagem na mão. Sem ela o app funciona igual, só não preenche o
pôster.

1. Crie uma conta em [themoviedb.org](https://www.themoviedb.org/signup).
2. Vá em **Configurações → API** e peça uma chave (uso pessoal, aprovação na
   hora).
3. Copie a **API Key (v3 auth)**. Isso é o `TMDB_API_KEY`. Se copiar o
   **API Read Access Token (v4)** também funciona.

## 5. Rodar localmente (opcional, pra testar antes de subir)

```bash
cp .env.example .env.local
# edite .env.local e cole os valores: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
# GEMINI_API_KEY e (opcional) TMDB_API_KEY

npm install
npm run seed   # importa os dados da planilha pro banco (rodar só uma vez)
npm run dev    # abre em http://localhost:3000
```

## 6. Subir pro GitHub

```bash
git init
git add .
git commit -m "Primeira versão do Nosso Cinema"
git branch -M main
git remote add origin <url-do-seu-repositorio-novo>
git push -u origin main
```

O `.gitignore` já impede que `.env.local` (com suas chaves) suba pro GitHub —
o repositório pode ficar público sem expor nada sensível.

## 7. Deploy no Vercel

1. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e
   importe o repositório do GitHub.
2. Em **Environment Variables**, adicione as variáveis (mesmos nomes do
   `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `GEMINI_API_KEY` e, se quiser pôster automático, `TMDB_API_KEY`.
3. Clique em **Deploy**. Pronto — o app fica no ar com as chaves guardadas só
   no Vercel, fora do código.
4. Se ainda não rodou `npm run seed` localmente, você pode rodar depois do
   deploy também (ele só precisa das variáveis de ambiente do Supabase, pode
   rodar da sua máquina apontando pro banco de produção).

## Instalar no iPhone (recomendado)

O app foi pensado pra ser usado principalmente no celular, no Safari do iOS,
como se fosse um app de verdade instalado:

1. Abra o link do app no **Safari** do iPhone (precisa ser o Safari, o Chrome
   no iOS não suporta instalar).
2. Toque no ícone de **Compartilhar** (o quadrado com a seta pra cima).
3. Escolha **"Adicionar à Tela de Início"**.
4. Pronto — abre um ícone na tela do iPhone que carrega o app em tela cheia,
   sem barra de endereço, com a barra de navegação fixa embaixo (dá pra
   trocar de tela com o polegar, sem precisar rolar até o topo).

## Como funciona a sugestão da IA

Ao clicar em "Gerar sugestões" na tela **Para assistir**, o app:

1. Busca no banco todos os títulos já assistidos com as notas do Brunno e da
   Paloma, e o perfil de preferências de cada um.
2. Monta um prompt para o Gemini pedindo 3 a 5 sugestões novas (que não estejam
   já na lista), com uma frase explicando o motivo de cada uma.
3. Salva essas sugestões como pendentes — elas aparecem na tela com o botão
   **Aprovar** (vai pra lista "Para assistir") ou **Rejeitar** (remove).

## Sobre login

Não existe senha: a tela inicial só pede pra clicar em "Brunno" ou "Paloma".
Isso significa que qualquer pessoa com o link do site consegue entrar e ver os
dados — não tem problema para uso pessoal entre vocês dois, mas vale lembrar
que não há nenhuma proteção de acesso.

## Personalização visual

Cada usuário tem uma paleta de cores diferente (aplicada automaticamente ao
entrar): tons de grafite/azul para o Brunno, tons de rosé/dourado para a
Paloma — a fonte é a mesma para os dois (Inter), só muda cor e o arredondamento
dos cantos. Para ajustar as cores, edite as variáveis CSS em
`src/app/globals.css` (blocos `[data-user="brunno"]` e `[data-user="paloma"]`).
