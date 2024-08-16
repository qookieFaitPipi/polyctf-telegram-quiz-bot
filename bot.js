const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
dotenv.config();
const { taskStega, taskCrypto, taskOsint, taskPPC, taskForensics } = require('./tasks');

const channelId1 = '@polyctf_team';
const channelId2 = '@polyctf';


const bot = new TelegramBot(process.env.API_KEY_BOT, {
  polling: {
    autoStart: true
  }
});

function rollDice() {
  return Math.floor(Math.random() * 5);
}

async function checkSubscriptionStatus(userId) {
  try {
    const chatMember = await bot.getChatMember(channelId1, userId);
    return chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

function sendKeyboard(chatId, text, buttons) {
  const keyboard = {
    reply_markup: {
      keyboard: [buttons],
      resize_keyboard: true,
      one_time_keyboard: true
    },
    parse_mode: 'HTML'
  };
  bot.sendMessage(chatId, text, keyboard);
}

bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  switch (text) {
    case '/start':
      if (await checkSubscriptionStatus(userId)) {
        sendKeyboard(chatId, 'Вы подписались на канал <a href="https://t.me/polyctf">PolyCTF</a> и <a href="https://t.me/polyctf_team">PolyCTF Team</a>. Спасибо!', [{ text: '/task' }]);
      } else {
        sendKeyboard(chatId, 'Для того чтобы выиграть приз, необходимо подписаться на каналы <a href="https://t.me/polyctf">PolyCTF</a> и <a href="https://t.me/polyctf_team">PolyCTF Team</a>',[{ text: '/check' }]);
      }
      break;

    case '/check':
      if (await checkSubscriptionStatus(userId)) {
        sendKeyboard(chatId, 'Теперь можно выиграть приз!', [{ text: '/task' }]);
      } else {
        sendKeyboard(chatId, 'Вы не подписаны на каналы <a href="https://t.me/polyctf">PolyCTF</a> и <a href="https://t.me/polyctf_team">PolyCTF Team</a>', [{ text: '/check' }]);
      }
      break;

    case '/task':
      if (await checkSubscriptionStatus(userId)) {
        const msgWait = await bot.sendMessage(chatId, 'Бот генерирует таск...');
        setTimeout(() => {
          bot.deleteMessage(chatId, msgWait.message_id);
          const randomNumber = rollDice();
          let task;
          if(randomNumber === 0) {
            task = taskStega;
          } else if(randomNumber === 1) {
            task = taskCrypto;
          } else if(randomNumber === 2) {
            task = taskOsint;
          } else if(randomNumber === 3) {
            task = taskPPC;
          } else if(randomNumber === 4) {
            task = taskForensics;
          }
  
          const formattedMessage = task.map(t => `<b>${t.type}</b>\n${t.text}`).join('\n\n');
          bot.sendMessage(chatId, "Для получения приза необходимо ответить на следующие вопросы: (интернетом пользоваться можно)\n\n" + formattedMessage, { parse_mode: 'HTML' });
        }, 3000);
      } else {
        sendKeyboard(chatId, 'Вы не подписаны на каналы <a href="https://t.me/polyctf">PolyCTF</a> и <a href="https://t.me/polyctf_team">PolyCTF Team</a>', [{ text: '/check' }]);
      }
      break;

    default:
      bot.sendMessage(chatId, 'Неизвестная команда. Попробуйте /start, /check или /task.');
      break;
  }
});

bot.on("polling_error", (err) => console.log(err.message));
