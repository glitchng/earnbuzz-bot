// === IMPORTS === const http = require('http'); const express = require('express'); const session = require('express-session'); const TelegramBot = require('node-telegram-bot-api'); const WebSocket = require('ws'); const path = require('path');

// === CONFIGURATION === const BOT_TOKEN = process.env.BOT_TOKEN; const ADMIN_PASS = process.env.ADMIN_PASS || "letmein"; const CHANNEL_ID = '-1002353520070'; const ADMIN_ID = 6101660516;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let broadcasting = false; let broadcastInterval = null; let messageCount = 0;

const wss = new WebSocket.Server({ noServer: true }); const clients = new Set();

function broadcastStatus() { const payload = JSON.stringify({ type: 'status', broadcasting, messageCount }); for (const client of clients) { if (client.readyState === WebSocket.OPEN) { client.send(payload); } } }

function getRandomAmount() { const rand = Math.random(); return rand < 0.98 ? Math.floor(Math.random() * (500000 - 100000 + 1)) + 100000 : Math.floor(Math.random() * (1000000 - 500001 + 1)) + 500001; }

function getRandomNigerianName() { const firstNames = ["Emeka", "Tolu", "Chioma", "Ayo", "Ngozi"]; const lastNames = ["Okoro", "Adeyemi", "Ibrahim", "Nwankwo", "Balogun"]; const first = firstNames[Math.floor(Math.random() * firstNames.length)]; const last = lastNames[Math.floor(Math.random() * lastNames.length)]; return ${first} ${last.slice(0, 2)}***; }

function getRandomAccountNumber() { return Math.floor(1000000000 + Math.random() * 9000000000).toString().slice(0, -4) + "****"; }

function getRandomBank() { const banks = ["GTBank", "Access Bank", "UBA", "Zenith Bank", "First Bank"]; return banks[Math.floor(Math.random() * banks.length)]; }

function getCurrentTimestamp() { return new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Lagos", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true, }).format(new Date()); }

function sendWithdrawalMessage() { const message = ✅ *Withdrawal Successful*\n\n💸 *Amount:* ₦${getRandomAmount().toLocaleString()}\n👤 *Name:* ${getRandomNigerianName()}\n🏦 *Account:* \${getRandomAccountNumber()}`\n🏛️ Bank: ${getRandomBank()}\n📆 Date: ${getCurrentTimestamp()}`; bot.sendMessage(CHANNEL_ID, message, { parse_mode: "Markdown" }); }

function startBroadcasting() { if (broadcasting) return; broadcasting = true; messageCount = 0; broadcastStatus(); broadcastInterval = setInterval(() => { if (!broadcasting || messageCount >= 500) { stopBroadcasting(); return; } sendWithdrawalMessage(); messageCount++; broadcastStatus(); }, 150000); }

function stopBroadcasting() { broadcasting = false; clearInterval(broadcastInterval); broadcastInterval = null; broadcastStatus(); }

bot.onText(//start/, (msg) => bot.sendMessage(msg.chat.id, "Welcome to EarnBuzz Bot!")); bot.onText(//stop/, (msg) => { bot.sendMessage(msg.chat.id, "Bot operations stopped."); stopBroadcasting(); });

const app = express(); const server = http.createServer(app); app.use(express.urlencoded({ extended: true })); app.use(express.json()); app.use(session({ secret: 'super_secret_key', resave: false, saveUninitialized: false }));

function auth(req, res, next) { if (req.session.loggedIn) next(); else res.redirect('/login'); }

app.get('/login', (req, res) => { res.send(`

<html><head><title>Login</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex justify-center items-center h-screen">
  <form method="POST" class="bg-white dark:bg-gray-800 shadow-md rounded px-8 pt-6 pb-8 mb-4">
    <h2 class="text-2xl font-bold mb-4 text-center">🔐 Admin Login</h2>
    <input type="password" name="password" placeholder="Password" class="border rounded w-full py-2 px-3 mb-3" />
    <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">Login</button>
  </form>
</body>
</html>
  `);
});app.post('/login', (req, res) => { if (req.body.password === ADMIN_PASS) { req.session.loggedIn = true; res.redirect('/'); } else { res.send('<p>Wrong password. <a href="/login">Try again</a></p>'); } });

app.get('/', auth, (req, res) => { res.send(`

<!DOCTYPE html><html class="bg-gray-100 dark:bg-gray-900">
<head>
  <title>EarnBuzz Control</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    let ws;
    window.onload = () => {
      ws = new WebSocket("ws://" + location.host);
      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.type === 'status') {
          document.getElementById('status').innerText = data.broadcasting ? 'Running' : 'Stopped';
          document.getElementById('counter').innerText = data.messageCount;
          document.getElementById('toggle').checked = data.broadcasting;
        }
      };
      const themeToggle = document.getElementById('theme-toggle');
      themeToggle.onclick = () => {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      };
      if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
      }
    };
    async function toggleBroadcast(checkbox) {
      const res = await fetch('/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on: checkbox.checked })
      });
    }
  </script>
</head>
<body class="flex items-center justify-center h-screen text-gray-900 dark:text-white">
  <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
    <h1 class="text-2xl font-bold mb-4">💼 EarnBuzz Bot Control</h1>
    <label class="flex items-center justify-center space-x-2">
      <span>Broadcasting</span>
      <input id="toggle" type="checkbox" onchange="toggleBroadcast(this)" class="w-6 h-6">
    </label>
    <p class="mt-2 text-sm">Status: <span id="status">Checking...</span></p>
    <p class="text-sm">Messages sent: <span id="counter">0</span></p>
    <button id="theme-toggle" class="mt-4 bg-gray-300 dark:bg-gray-600 text-black dark:text-white px-3 py-1 rounded">Toggle Theme</button>
    <a href="/logout" class="block text-red-500 text-sm mt-4">Logout</a>
  </div>
</body>
</html>
  `);
});app.post('/toggle', auth, (req, res) => { const shouldStart = req.body.on; if (shouldStart && !broadcasting) startBroadcasting(); else if (!shouldStart && broadcasting) stopBroadcasting(); res.json({ status: broadcasting ? "Running" : "Stopped" }); });

app.get('/logout', (req, res) => { req.session.destroy(() => res.redirect('/login')); });

server.on('upgrade', (req, socket, head) => { wss.handleUpgrade(req, socket, head, (ws) => { clients.add(ws); ws.on('close', () => clients.delete(ws)); }); });

const PORT = process.env.PORT || 3000; server.listen(PORT, () => console.log(Web portal running on ${PORT}));

                                  
