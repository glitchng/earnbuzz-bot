const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = '-1002353520070';
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
  const firstNames = ["Chinedu", "Aisha", "Tunde", "Ngozi", "Fatima"];
  const lastNames = ["Okoro", "Bello", "Eze", "Oladipo"];
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last.slice(0, 2)}***`;
}

function getRandomAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000)
    .toString()
    .slice(0, -4) + "****";
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

// === Broadcast Message Function ===
async function sendWithdrawalMessage() {
  const amount = getRandomAmount();
  const name = getRandomNigerianName();
  const accountNumber = getRandomAccountNumber();
  const bank = getRandomBank();
  const timestamp = getCurrentTimestamp();

  const message = `✅ *Withdrawal Successful*\n\n💸 *Amount:* ₦${amount.toLocaleString()}\n👤 *Name:* ${name}\n🏦 *Account:* \`${accountNumber}\`\n🏛️ *Bank:* ${bank}\n📆 *Date:* ${timestamp}`;

  try {
    await bot.sendMessage(CHANNEL_ID, message, { parse_mode: "Markdown" });
    messageCount++;  // Increment the message counter
  } catch (err) {
    const errorNote = `⚠️ *Broadcast Failed!*\n\nReason: \`${err.message}\``;
    await bot.sendMessage(ADMIN_ID, errorNote, { parse_mode: "Markdown" });
    stopBroadcasting();
  }
}

// === Broadcast Control ===
function startBroadcasting() {
  if (broadcasting) return;
  broadcasting = true;
  messageCount = 0;  // Reset message count on restart

  broadcastInterval = setInterval(() => {
    if (!broadcasting || messageCount >= 500) {
      stopBroadcasting();
      return;
    }
    sendWithdrawalMessage();
  }, 150000); // Every 2.5 minutes
}

function stopBroadcasting() {
  broadcasting = false;
  if (broadcastInterval) {
    clearInterval(broadcastInterval);
    broadcastInterval = null;
  }
}

// === Admin Panel Keyboard ===
function getAdminPanelKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: broadcasting ? "✅ Running" : "▶️ Start Broadcast",
            callback_data: broadcasting ? "already_running" : "start_broadcast"
          },
          {
            text: "⛔ Stop Broadcast",
            callback_data: "stop_broadcast"
          }
        ],
        [
          {
            text: `📊 Stats: ${messageCount} Messages Sent`,
            callback_data: "show_stats"
          }
        ]
      ]
    }
  };
}

// === /panel Command ===
bot.onText(/\/panel/, (msg) => {
  if (msg.from.id !== ADMIN_ID) return;
  bot.sendMessage(msg.chat.id, "🎛️ *Control Panel*", {
    parse_mode: "Markdown",
    ...getAdminPanelKeyboard()
  });
});

// === Inline Keyboard Callback Handling ===
bot.on("callback_query", async (query) => {
  const userId = query.from.id;
  const messageId = query.message.message_id;
  const chatId = query.message.chat.id;

  if (userId !== ADMIN_ID) {
    bot.answerCallbackQuery(query.id, { text: "Unauthorized", show_alert: true });
    return;
  }

  if (query.data === "start_broadcast" && !broadcasting) {
    startBroadcasting();
    await bot.answerCallbackQuery({ callback_query_id: query.id, text: "📡 Broadcasting started" });
    await bot.editMessageReplyMarkup(getAdminPanelKeyboard().reply_markup, {
      chat_id: chatId,
      message_id: messageId
    });
  }

  if (query.data === "stop_broadcast" && broadcasting) {
    stopBroadcasting();
    await bot.answerCallbackQuery({ callback_query_id: query.id, text: "🛑 Broadcasting stopped" });
    await bot.editMessageReplyMarkup(getAdminPanelKeyboard().reply_markup, {
      chat_id: chatId,
      message_id: messageId
    });
  }

  if (query.data === "already_running") {
    await bot.answerCallbackQuery({ callback_query_id: query.id, text: "🔄 Already running" });
  }

  if (query.data === "show_stats") {
    const statsMessage = `📊 *Live Stats*\n\nMessages Sent: ${messageCount}\nBroadcasting: ${broadcasting ? "Yes" : "No"}`;
    await bot.answerCallbackQuery({ callback_query_id: query.id, text: statsMessage });
  }
});

// === Dummy HTTP Server for Render ===
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Telegram bot is running.\n');
}).listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
