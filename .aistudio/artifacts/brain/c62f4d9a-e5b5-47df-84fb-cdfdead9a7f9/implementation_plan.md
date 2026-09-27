# Guia Passo a Passo: Colocando o Servidor no Render e Conectando com a Netlify

Este plano explica de forma direta e sem jargões como colocar o seu servidor no ar e ligá-lo ao seu jogo.

---

## Passo 1: Subir o Servidor no Render (Grátis)

1. Entre no site **[render.com](https://render.com)** e crie sua conta (pode entrar com sua conta do GitHub).
2. No painel inicial, clique no botão azul **"New +"** no canto superior direito e escolha **"Web Service"**.
3. Escolha o seu repositório do GitHub onde está o código do Echoward.
4. Preencha os campos na tela exatamente assim:
   - **Name:** `echoward-servidor` *(ou o nome que quiser)*
   - **Region:** Escolha `Ohio (US East)` ou `Oregon (US West)`
   - **Root Directory:** digite `server`
   - **Environment:** selecione `Node`
   - **Build Command:** digite `npm install && npm run build`
   - **Start Command:** digite `npm start`
   - **Instance Type:** selecione **Free** ($0/mês)
5. Role até a seção **"Environment Variables"** (Variáveis de Ambiente) e adicione:
   - **Key:** `ALLOWED_ORIGINS`
   - **Value:** `https://joao-para-se-divertir.netlify.app`
6. Clique em **"Deploy Web Service"**.
7. O Render vai compilar e iniciar o servidor. Quando ficar verde escrito **"Live"**, copie o link que aparece no topo (exemplo: `https://echoward-servidor.onrender.com`).

---

## Passo 2: Testar se o Servidor está funcionando

Abra uma nova aba no seu navegador e cole o link do Render com `/health` no final:
`https://SEU-LINK.onrender.com/health`

Se aparecer algo como:
```json
{"status":"ok","service":"echoward-multiplayer","game":"Echoward: Reino das Cinzas"}
```
Significa que seu servidor está 100% vivo e pronto!

---

## Passo 3: Ligar a Netlify ao Servidor

Agora vamos avisar o seu site na Netlify qual é o endereço do servidor:

1. Acesse o painel da **[Netlify](https://app.netlify.com)** e clique no seu projeto (`joao-para-se-divertir`).
2. No menu lateral esquerdo, clique em **Site configuration** (Configurações do Site).
3. Clique em **Environment variables** (Variáveis de ambiente).
4. Clique no botão **"Add a variable"** (ou "New variable") e preencha:
   - **Key:** `VITE_GAME_SERVER_URL`
   - **Value:** Cole o link do seu Render (ex: `https://echoward-servidor.onrender.com`)
5. Clique em **Save**.
6. Agora, para a Netlify atualizar o site com essa variável:
   - Vá no menu **Deploys**
   - Clique em **Trigger deploy** e depois em **Deploy site**.

---

## Passo 4: Jogar Multiplayer!

1. Abra seu jogo em: **https://joao-para-se-divertir.netlify.app**
2. Clique no botão de **Multiplayer Online**.
3. O status agora vai mostrar a bolinha verde: **🟢 Conectado ao Servidor**.
4. Você e seus amigos podem entrar na mesma sala (`LUMEN` ou criar uma sala com código) e jogar juntos em tempo real!
