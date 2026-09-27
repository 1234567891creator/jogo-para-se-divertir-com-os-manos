# Echoward: Reino das Cinzas - Servidor Multiplayer Online Real

Servidor multiplayer autoritativo de alta performance em Node.js, Express e WebSocket para o metroidvania **Echoward: Reino das Cinzas**.

Projetado para funcionar com o frontend hospedado na **Netlify** e o backend persistente em **Render, Railway, Fly.io, Google Cloud Run ou VPS**.

---

## 1. Arquitetura

```text
ECHOWARD
├── frontend/ (Netlify)
│   ├── React + TypeScript + Canvas 2D
│   ├── VITE_GAME_SERVER_URL (aponta para wss://seu-servidor.onrender.com)
│   └── Interpolação de movimento (LERP) & predição de cliente
│
├── server/ (Render / Railway / Fly.io / VPS)
│   ├── Node.js + TypeScript + WebSocketServer
│   ├── src/rooms/RoomManager.ts (Salas, Santuários e slots 0..3)
│   ├── src/combat/CombatManager.ts (Dano autoritativo de chefes e revive)
│   ├── src/world/WorldStateManager.ts (Vida de chefes, totens e portas)
│   ├── src/networking/validation.ts (Segurança, rate limiting e filtros)
│   └── src/server.ts (REST API + WebSocket Gateway)
│
└── shared/
    ├── types.ts (Tipos de rede compartilhados)
    ├── messages.ts (Protocolo WebSocket de mensagens)
    ├── constants.ts (Versão 1.0.0, limites e tick rates)
    └── protocols.ts (Sanitização e geração de códigos)
```

---

## 2. Como Rodar Localmente

### Opção A: Jogo Completo (Frontend + Servidor juntos)
Na raiz do projeto:
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`. O jogo e o servidor multiplayer iniciarão juntos automaticamente.

### Opção B: Servidor Separado
Dentro da pasta `server/`:
```bash
cd server
npm install
npm run dev
```
O servidor iniciará em `http://localhost:3000` (REST) e `ws://localhost:3000/ws` (WebSocket).

---

## 3. Como Gerar Build e Iniciar em Produção

```bash
cd server
npm run build
npm start
```

---

## 4. Variáveis de Ambiente (.env)

Crie um arquivo `.env` no servidor com base em `server/.env.example`:

```env
PORT=3000
NODE_ENV=production
HOST=0.0.0.0
ALLOWED_ORIGINS=https://seu-jogo.netlify.app,http://localhost:5173
MAX_PLAYERS_PER_ROOM=4
TICK_RATE=20
```

---

## 5. Como Publicar o Servidor (Render / Railway / Fly.io / VPS)

### Opção 1: Render (Recomendado)
1. Crie uma conta em [render.com](https://render.com).
2. Clique em **New +** > **Web Service**.
3. Conecte seu repositório Git.
4. Defina:
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Em **Environment Variables**:
   - `NODE_ENV`: `production`
   - `ALLOWED_ORIGINS`: `https://seu-jogo.netlify.app`
6. O Render fornecerá uma URL pública, ex: `https://echoward-server.onrender.com`.

### Opção 2: Railway
1. Acesse [railway.app](https://railway.app).
2. Novo projeto a partir do repositório Git.
3. Configure a pasta raiz como `server`.
4. Porta: `PORT` injetado automaticamente pelo Railway.

---

## 6. Como Configurar na Netlify (Frontend)

1. No painel da Netlify do seu site, vá em **Site Configuration** > **Environment Variables**.
2. Adicione a variável:
   ```env
   VITE_GAME_SERVER_URL=https://echoward-server.onrender.com
   ```
   *(ou `wss://echoward-server.onrender.com`)*
3. Faça um novo Deploy no Netlify (`npm run build`).
4. O cliente no navegador detectará automaticamente `https:` e conectará com segurança via `wss://echoward-server.onrender.com/ws`.

---

## 7. Como Testar com 2 Computadores Diferentes

1. **Computador 1 (Jogador 1)**:
   - Abre `https://seu-jogo.netlify.app`.
   - Clica em **Co-op Online** ou tecla `[P]`.
   - Escolhe seu arquétipo (**Nox**) e clica em **Criar Sala**.
   - O servidor gera um código de 6 caracteres (ex: `A7K9P2`).
   - Copia o código clicando no botão **[Copiar]**.
2. **Computador 2 (Jogador 2)**:
   - Abre `https://seu-jogo.netlify.app`.
   - Clica em **Co-op Online** ou tecla `[P]`.
   - Escolhe seu arquétipo (**Veyra** ou **Orin**).
   - Cola o código `A7K9P2` e clica em **Entrar na Sala**.
3. **Resultado**:
   - Ambos os jogadores aparecem na mesma sala em tempo real.
   - Posição, animações, ataques com lâmina de eco, dano em chefes e revive são sincronizados.

---

## 8. Como Testar com 4 Jogadores

1. O Host cria a sala privada de 4 vagas (ex: `NER4X2`).
2. Os outros 3 jogadores entram com os arquétipos `Nox`, `Veyra`, `Orin` e `Kael`.
3. Cada jogador ocupa seu slot correspondente (0, 1, 2 e 3).
4. O 5º jogador que tentar entrar receberá a mensagem oficial:
   > *"A sala está cheia. Limite de 4 jogadores alcançado."*

---

## 9. Como Ver Logs e Diagnósticos

O servidor inclui logs estruturados no console:
- `[Echoward Server] Nox entrou na sala LUMEN`
- `[Echoward Server] Veyra saiu da sala LUMEN`
- `[Echoward Server] WebSocket error...`

Para verificar o status a qualquer momento:
```bash
curl https://seu-servidor.onrender.com/health
```
Resposta:
```json
{
  "status": "ok",
  "game": "Echoward: Reino das Cinzas",
  "version": "1.0.0",
  "uptimeSeconds": 3600,
  "activeRooms": 5,
  "connectedPlayers": 4
}
```

---

## 10. Resolução de Problemas

- **Erro de CORS**: Certifique-se de que a URL exata da Netlify (`https://seu-jogo.netlify.app`) está na lista de `ALLOWED_ORIGINS` no servidor, ou configure `ALLOWED_ORIGINS=*`.
- **WebSocket não conecta**: Se o frontend estiver em `https://`, o WebSocket DEVE usar `wss://`. O cliente já realiza essa conversão automaticamente.
