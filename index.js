const TelegramBot = require('node-telegram-bot-api');

// === CONFIGURATION ===
const BOT_TOKEN = process.env.BOT_TOKEN;  // Use environment variable for token
const CHANNEL_ID = '-1002353520070';     // Your Telegram channel ID
const ADMIN_ID = 6101660516;             // Your Telegram ID

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

let broadcasting = false;
let broadcastInterval = null;
let messageCount = 0;
let lastBigAmountTime = Date.now() - 300000; // Allows first big one immediately

// === Utility Functions ===
function getRandomNigerianName() {
  const firstNames = [ "Chinedu", "Aisha", "Tunde", "Ngozi", "Emeka", "Fatima", "Ibrahim", "Kelechi",
    "Seyi", "Adaobi", "Bola", "Obinna", "Zainab", "Yusuf", "Amaka", "David", "Grace", "Uche",
    "Tope", "Nneka", "Samuel", "Maryam", "Gbenga", "Rashida", "Kingsley", "Temitope", "Hadiza",
    "John", "Blessing", "Peter", "Linda", "Ahmed", "Funmi", "Rita", "Abdul", "Chika", "Paul",
    "Victoria", "Halima", "Ifeanyi", "Sarah", "Joseph", "Joy", "Musa", "Bukky", "Stephen",
    "Aminat", "Henry", "Femi" ];

  const lastNames = [ "Okoro", "Bello", "Oladipo", "Nwankwo", "Eze", "Musa", "Lawal", "Umeh", "Bakare",
    "Okafor", "Adeyemi", "Mohammed", "Onyeka", "Ibrahim", "Ogunleye", "Balogun", "Chukwu", "Usman",
    "Abiola", "Okonkwo", "Aliyu", "Ogundele", "Danladi", "Ogbonna", "Salami", "Olumide", "Obi",
    "Akinwale", "Suleiman", "Ekwueme", "Ayodele", "Garba", "Nwachukwu", "Anyanwu", "Yahaya",
    "Idowu", "Ezra", "Mustapha", "Iroko", "Ajayi", "Adebayo", "Ogundipe", "Nuhu", "Bamgbose",
    "Ikenna", "Osagie", "Akinyemi", "Chisom" ];

  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

function getRandomAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000);
}

function getRandomBank() {
  const banks = ["Access Bank", "GTBank", "Zenith Bank", "UBA", "First Bank"];
  return banks[Math.floor(Math.random() * banks.length)];
}

function getCurrentTimestamp() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function sendWithdrawalMessage() {
  const now = Date.now();
  let amount;

  if (now - lastBigAmountTime >= 300000) {
    // Big amount every 5 mins
    amount = Math.floor(Math.random() * (1000000 - 500001 + 1)) + 500001;
    lastBigAmountTime = now;
  } else {
    // Normal range
    amount = Math.floor(Math.random() * (500000 - 100000 + 1)) + 100000;
  }

  const name = getRandomNigerianName();
  const accountNumber = getRandomAccountNumber();
  const bank = getRandomBank();
  const timestamp = getCurrentTimestamp();

  const message = `✅ Withdrawal Successful\n\n💸 Amount: ₦${amount.toLocaleString()}\n👤 Name: ${name}\n💳 Account: ${accountNumber}\n🏦 Bank: ${bank}\n📆 Date: ${timestamp}`;
  bot.sendMessage(CHANNEL_ID, message);
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
  }, 10000); // Every 10 seconds
}

function stopBroadcasting() {
  broadcasting = false;
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

// === Admin Panel Keyboard ===
const adminKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 Start", callback_data: "start_broadcast" }],
      [{ text: "🛑 Stop", callback_data: "stop_broadcast" }],
      [{ text: "📊 Status", callback_data: "status_broadcast" }],
    ],
  },
};

// === Admin Command ===
bot.onText(/\/admin/, (msg) => {
  if (msg.from.id !== ADMIN_ID) {
    return bot.sendMessage(msg.chat.id, "🚫 Access Denied.");
  }
  bot.sendMessage(msg.chat.id, "🛠️ Admin Panel", adminKeyboard);
});

// === Button Handlers ===
bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;

  if (userId !== ADMIN_ID) {
    return bot.answerCallbackQuery(query.id, {
      text: "🚫 You are not authorized.",
    });
  }

  switch (query.data) {
    case "start_broadcast":
      startBroadcasting();
      bot.editMessageText("✅ Broadcast started!", {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: adminKeyboard.reply_markup,
      });
      break;

    case "stop_broadcast":
      stopBroadcasting();
      bot.editMessageText("🛑 Broadcast stopped.", {
        chat_id: chatId,
        message_id: query.message.message_id,
        reply_markup: adminKeyboard.reply_markup,
      });
      break;

    case "status_broadcast":
      bot.answerCallbackQuery({
        callback_query_id: query.id,
        text: broadcasting
          ? `📢 Broadcasting is ON\nMessages sent: ${messageCount}/500`
          : "🔕 Broadcasting is OFF",
        show_alert: true,
      });
      break;
  }
});
