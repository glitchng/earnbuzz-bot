const TelegramBot = require('node-telegram-bot-api');

// === CONFIGURATION ===
const BOT_TOKEN = process.env.BOT_TOKEN;  // Use the environment variable for the bot token
const CHANNEL_ID = '-1002353520070';     // Replace with your channel ID
const ADMIN_ID = 6101660516;             // Replace with your own Telegram ID

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
    "Seyi", "Adaobi", "Bola", "Obinna", "Zainab", "Yusuf", "Amaka", "David",
    "Grace", "Uche", "Tope", "Nneka", "Samuel", "Maryam", "Gbenga", "Rashida",
    "Kingsley", "Temitope", "Hadiza", "John", "Blessing", "Peter", "Linda", "Ahmed",
    "Funmi", "Rita", "Abdul", "Chika", "Paul", "Victoria", "Halima", "Ifeanyi",
    "Sarah", "Joseph", "Joy", "Musa", "Bukky", "Stephen", "Aminat", "Henry", "Femi",
    "Micheal", "Modupe", "Ngozi", "Yemisi", "Titi", "Chijioke", "Oluwaseun", "Durojaiye",
    "Fatimah", "Ademola", "Yusuf", "Aminat", "Ifeoluwa", "Hassan", "Aderemi", "Idris",
    "Ekong", "Ivy", "Uko", "Eyo", "Abasiama", "Mfon", "Mbakara", "Ibrahim", "Nkechi",
    "Idorenyin", "Martha", "Ita", "Akpan", "Essien", "Obong", "Ikot", "Inyang", "Ntia",
    "Akpabio", "Obong", "Etim", "Inyene", "Ndiana", "Udoh", "Akanimoh", "Udo", "Ukpong"
  ];

  const lastNames = [
    "Okoro", "Bello", "Oladipo", "Nwankwo", "Eze", "Musa", "Lawal", "Umeh", "Bakare",
    "Okafor", "Adeyemi", "Mohammed", "Onyeka", "Ibrahim", "Ogunleye", "Balogun",
    "Chukwu", "Usman", "Abiola", "Okonkwo", "Aliyu", "Ogundele", "Danladi", "Ogbonna",
    "Salami", "Olumide", "Obi", "Akinwale", "Suleiman", "Ekwueme", "Ayodele", "Garba",
    "Nwachukwu", "Anyanwu", "Yahaya", "Idowu", "Ezra", "Mustapha", "Iroko", "Ajayi",
    "Adebayo", "Ogundipe", "Nuhu", "Bamgbose", "Ikenna", "Osagie", "Akinyemi", "Chisom",
    "Oladele", "Adeleke", "Fashola", "Taiwo", "Tiwatope", "Oluwaseun", "Onyebuchi",
    "Ikechukwu", "Ayodele", "Nnaji", "Ogunbiyi", "Sule", "Muhammad", "Alabi", "Oloyede",
    "Ekong", "Idong", "Etim", "Bassey", "Otu", "Akanimoh", "Udoh", "Akpabio", "Ubong"
  ];

  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function getRandomAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000);
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

  const message = `✅ *Withdrawal Successful*\n\n💸 *Amount:* ₦${amount.toLocaleString()}\n👤 *Name:* ${name}\n🏦 *Account:* \`${accountNumber}\` (${bank})\n📆 *Date:* ${timestamp}`;

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
  }, 30000); // every 30 seconds = 2 messages per minute
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

// Start bot logic
startBroadcasting();
