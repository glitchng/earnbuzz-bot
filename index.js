const http = require('http');
const express = require('express');
const session = require('express-session');
const TelegramBot = require('node-telegram-bot-api');

// === CONFIGURATION ===
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = '-1002353520070'; // Replace with your channel ID
const ADMIN_ID = 6101660516; // Replace with your Telegram ID

const USERNAME = 'admin';
const PASSWORD = 'admin';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey', // Change to a stronger secret key in production
  resave: false,
  saveUninitialized: true
}));

// === BOT LOGIC ===
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let broadcasting = false;
let broadcastInterval = null;
let messageCount = 0;
const messageLog = []; // Store messages for the log

function getRandomAmount() {
  const rand = Math.random();
  return rand < 0.98
    ? Math.floor(Math.random() * (500000 - 100000 + 1)) + 100000
    : Math.floor(Math.random() * (1000000 - 500001 + 1)) + 500001;
}

function getRandomNigerianName() {
  const firstNames = ["Chinedu", "Aisha", "Tunde", "Ngozi", "Emeka", "Fatima", "Ibrahim", "Kelechi", "Seyi"];
  const lastNames = ["Okoro", "Bello", "Oladipo", "Nwankwo", "Eze", "Musa", "Lawal", "Umeh", "Bakare"];
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  const maskedLast = last.slice(0, 2) + '***';
  return `${first} ${maskedLast}`;
}

function getRandomAccountNumber() {
  const acc = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return acc.slice(0, -4) + '****';
}

function getRandomBank() {
  const banks = ["Access Bank", "GTBank", "Zenith Bank", "UBA", "First Bank"];
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
  const account = getRandomAccountNumber();
  const bank = getRandomBank();
  const date = getCurrentTimestamp();

  const msg = `✅ *Withdrawal Successful*\n\n💸 *Amount:* ₦${amount.toLocaleString()}\n👤 *Name:* ${name}\n🏦 *Account:* \`${account}\`\n🏛️ *Bank:* ${bank}\n📆 *Date:* ${date}`;
  
  // Log the message
  messageLog.unshift(msg);
  if (messageLog.length > 20) messageLog.pop(); // Keep only the latest 20 messages

  // Send message to Telegram channel
  bot.sendMessage(CHANNEL_ID, msg, { parse_mode: "Markdown" })
    .catch(err => console.error("Error sending message: ", err)); // Log any errors
}

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
  }, 150000); // Every 2.5 mins
}

function stopBroadcasting() {
  broadcasting = false;
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

// === BOT COMMANDS ===
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome to EarnBuzz Bot!");
});

bot.onText(/\/stop/, (msg) => {
  bot.sendMessage(msg.chat.id, "Bot operations stopped.");
  stopBroadcasting();
});

// === WEB PORTAL ===
function requireLogin(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect('/login');
}

app.get('/login', (req, res) => {
  res.send(`
    <h2>Admin Login</h2>
    <form method="post" action="/login">
      <input name="username" placeholder="Username" /><br/>
      <input type="password" name="password" placeholder="Password" /><br/>
      <button type="submit">Login</button>
    </form>
  `);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === USERNAME && password === PASSWORD) {
    req.session.loggedIn = true;
    res.redirect('/');
  } else {
    res.send('Login failed. <a href="/login">Try again</a>');
  }
});

app.get('/', requireLogin, (req, res) => {
  res.send(`
    <h2>Welcome, Admin</h2>
    <p>Status: <strong>${broadcasting ? 'Broadcasting ✅' : 'Stopped ❌'}</strong></p>
    <form method="post" action="/toggle">
      <button>${broadcasting ? 'Stop' : 'Start'} Bot</button>
    </form>
    <h3>Recent Broadcasts</h3>
    <pre>${messageLog.join('\n\n')}</pre>
  `);
});

app.post('/toggle', requireLogin, (req, res) => {
  if (broadcasting) {
    stopBroadcasting();
  } else {
    startBroadcasting();
  }
  res.redirect('/');
});

// === COMBINED HTTP SERVER (for Render) ===
http.createServer(app).listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
