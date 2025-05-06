const http = require('http');
const express = require('express');
const session = require('express-session');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

// === CONFIGURATION ===
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_PASS = process.env.ADMIN_PASS || "letmein";
const CHANNEL_ID = '-1002353520070'; // Make sure bot is added & admin
const ADMIN_ID = 6101660516;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let broadcasting = false;
let broadcastInterval = null;
let messageCount = 0;

// === Utility Functions ===
function getRandomAmount() {
  const rand = Math.random();
  return rand < 0.98
    ? Math.floor(Math.random() * (500000 - 100000 + 1)) + 100000
    : Math.floor(Math.random() * (1000000 - 500001 + 1)) + 500001;
}

function getRandomNigerianName() {
  const firstNames = ['Emeka', 'Chinedu', 'Aisha', 'Bola', 'Ngozi'];
  const lastNames = ['Okafor', 'Balogun', 'Ahmed', 'Obi', 'Chukwu'];
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  const maskedLast = last.slice(0, 2) + '***';
  return `${first} ${maskedLast}`;
}

function getRandomAccountNumber() {
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return accountNumber.slice(0, -4) + "****";
}

function getRandomBank() {
  const banks = ['GTBank', 'Access Bank', 'UBA', 'First Bank', 'Zenith Bank'];
  return banks[Math.floor(Math.random() * banks.length)];
}

function getCurrentTimestamp() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date());
}

function sendWithdrawalMessage() {
  const amount = getRandomAmount();
  const name = getRandomNigerianName();
  const accountNumber = getRandomAccountNumber();
  const bank = getRandomBank();
  const timestamp = getCurrentTimestamp();

  const message = `✅ *Withdrawal Successful*\n\n` +
    `💸 *Amount:* ₦${amount.toLocaleString()}\n` +
    `👤 *Name:* ${name}\n` +
    `🏦 *Account:* \`${accountNumber}\`\n` +
    `🏛️ *Bank:* ${bank}\n` +
    `📆 *Date:* ${timestamp}`;

  bot.sendMessage(CHANNEL_ID, message, { parse_mode: "Markdown" })
    .then(() => {
      console.log(`✅ Message sent: ₦${amount.toLocaleString()} to ${name}`);
    })
    .catch((err) => {
      console.error("❌ Telegram sendMessage error:", err);
    });
}

// === Broadcast Control ===
function startBroadcasting() {
  if (broadcasting) return;
  broadcasting = true;
  messageCount = 0;
  broadcastInterval = setInterval(() => {
    if (!broadcasting || messageCount >= 500) {
      stopBroadcasting();
      return;
    }
    sendWithdrawalMessage();
    messageCount++;
  }, 150000); // 2.5 minutes
}

function stopBroadcasting() {
  broadcasting = false;
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

// === Bot Commands ===
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to EarnBuzz Bot!");
});

bot.onText(/\/stop/, (msg) => {
  bot.sendMessage(msg.chat.id, "Bot operations stopped.");
  stopBroadcasting();
});

// === Express Web Portal With Login ===
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'super_secret_key',
  resave: false,
  saveUninitialized: false
}));

function auth(req, res, next) {
  if (req.session.loggedIn) next();
  else res.redirect('/login');
}

app.get('/login', (req, res) => {
  res.send(`
    <html><head><title>Login</title><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-gray-100 flex justify-center items-center h-screen">
      <form method="POST" class="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <h2 class="text-2xl font-bold mb-4 text-center">🔐 Admin Login</h2>
        <input type="password" name="password" placeholder="Password"
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3" />
        <button type="submit"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          Login
        </button>
      </form>
    </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  if (req.body.password === ADMIN_PASS) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    res.send('<p>Wrong password. <a href="/login">Try again</a></p>');
  }
});

app.get('/', auth, (req, res) => {
  res.send(`
    <html class="bg-gray-100">
    <head>
      <title>EarnBuzz Control</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script>
        async function trigger(action) {
          const res = await fetch('/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ on: action === 'start' })
          });
          const data = await res.json();
          document.getElementById('status').innerText = data.status;
          showToast(data.status);
        }

        function showToast(message) {
          const toast = document.getElementById('toast');
          toast.textContent = message;
          toast.classList.remove('hidden');
          setTimeout(() => toast.classList.add('hidden'), 3000);
        }
      </script>
    </head>
    <body class="flex items-center justify-center h-screen">
      <div class="bg-white p-6 rounded-lg shadow-lg text-center space-y-4">
        <h1 class="text-2xl font-bold mb-2">💼 EarnBuzz Bot Control</h1>
        <div class="flex justify-center gap-4">
          <button onclick="trigger('start')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Start</button>
          <button onclick="trigger('stop')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Stop</button>
        </div>
        <p id="status" class="text-gray-700 mt-4">${broadcasting ? 'Running' : 'Stopped'}</p>
        <div id="toast" class="hidden mt-2 text-white bg-black bg-opacity-75 px-3 py-2 rounded text-sm"></div>
        <a href="/logout" class="text-red-500 text-sm mt-4 block">Logout</a>
      </div>
    </body>
    </html>
  `);
});

app.post('/toggle', auth, (req, res) => {
  const shouldStart = req.body.on;
  if (shouldStart && !broadcasting) {
    startBroadcasting();
    res.json({ status: "Running" });
  } else if (!shouldStart && broadcasting) {
    stopBroadcasting();
    res.json({ status: "Stopped" });
  } else {
    res.json({ status: broadcasting ? "Running" : "Stopped" });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// === Start HTTP Server for Render ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Web portal running on port ${PORT}`);
});
