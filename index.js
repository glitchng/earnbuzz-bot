const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

// === CONFIGURATION ===
const BOT_TOKEN = process.env.BOT_TOKEN;  // Set in Render environment variables
const CHANNEL_ID = '-1002353520070';     // Replace with your channel ID
const ADMIN_ID = 6101660516;             // Replace with your Telegram ID

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let broadcasting = false;
let broadcastInterval = null;
let messageCount = 0;

// === Utility Functions ===
function getRandomAmount() {
  const rand = Math.random();
  if (rand < 0.98) {
    return Math.floor(Math.random() * (500000 - 100000 + 1)) + 100000;
  } else {
    return Math.floor(Math.random() * (1000000 - 500001 + 1)) + 500001;
  }
}

function getRandomNigerianName() {
  const firstNames = [
    "Chinedu", "Aisha", "Tunde", "Ngozi", "Emeka", "Fatima", "Ibrahim", "Kelechi",
    "Seyi", "Adaobi", "Bola", "Obinna", "Zainab", "Yusuf", "Amaka", "David", "Grace",
    "Uche", "Tope", "Nneka", "Samuel", "Maryam", "Gbenga", "Rashida", "Kingsley", "Temitope",
    "Hadiza", "John", "Blessing", "Peter", "Linda", "Ahmed", "Funmi", "Rita", "Abdul",
    "Chika", "Paul", "Victoria", "Halima", "Ifeanyi", "Sarah", "Joseph", "Joy", "Musa",
    "Bukky", "Stephen", "Aminat", "Henry", "Femi", "Micheal", "Modupe", "Yemisi", "Titi",
    "Chijioke", "Oluwaseun", "Durojaiye", "Fatimah", "Ademola", "Ifeoluwa", "Hassan", "Aderemi",
    "Idris", "Ekong", "Ivy", "Uko", "Eyo", "Abasiama", "Mfon", "Mbakara", "Nkechi",
    "Idorenyin", "Martha", "Ita", "Akpan", "Essien", "Obong", "Ikot", "Inyang", "Ntia",
    "Akpabio", "Etim", "Inyene", "Ndiana", "Udoh", "Akanimoh", "Udo", "Ukpong"
  ];

  const lastNames = [
    "Okoro", "Bello", "Oladipo", "Nwankwo", "Eze", "Musa", "Lawal", "Umeh", "Bakare",
    "Okafor", "Adeyemi", "Mohammed", "Onyeka", "Ibrahim", "Ogunleye", "Balogun",
    "Chukwu", "Usman", "Abiola", "Okonkwo", "Aliyu", "Ogundele", "Danladi", "Ogbonna",
    "Salami", "Olumide", "Obi", "Akinwale", "Suleiman", "Ekwueme", "Ayodele", "Garba",
    "Nwachukwu", "Anyanwu", "Yahaya", "Idowu", "Ezra", "Mustapha", "Iroko", "Ajayi",
    "Adebayo", "Ogundipe", "Nuhu", "Bamgbose", "Ikenna", "Osagie", "Akinyemi", "Chisom",
    "Oladele", "Adeleke", "Fashola", "Taiwo", "Tiwatope", "Onyebuchi", "Ikechukwu",
    "Nnaji", "Ogunbiyi", "Sule", "Muhammad", "Alabi", "Oloyede", "Etim", "Bassey",
    "Otu", "Akpabio", "Ubong"
  ];

  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  const maskedLast = last.slice(0, 2) + '***';
  return `${first} ${maskedLast}`;
}

function getRandomAccountNumber() {
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return accountNumber.slice(0, -4) + "****"; // Mask last 4 digits
}

function getRandomBank() {
  const banks = [
    "Access Bank", "GTBank", "Zenith Bank", "UBA", "First Bank", "Union Bank",
    "Fidelity Bank", "Stanbic IBTC", "Wema Bank", "Ecobank"
  ];
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

  const message = `✅ *Withdrawal Successful*\n\n💸 *Amount:* ₦${amount.toLocaleString()}\n👤 *Name:* ${name}\n🏦 *Account:* \`${accountNumber}\`\n🏛️ *Bank:* ${bank}\n📆 *Date:* ${timestamp}`;

  bot.sendMessage(CHANNEL_ID, message, { parse_mode: "Markdown" });
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
  }, 150000); // 150000 ms = 2.5 minutes → 2 messages every 5 mins
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

// Start broadcasting immediately
startBroadcasting();

// === Dummy HTTP Server for Render ===
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Telegram bot is running.\n');
}).listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
