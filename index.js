const { Telegraf } = require("telegraf");
const cron = require("node-cron");

require("dotenv").config();

const workers = require("./workers");

console.log(workers)
const bot = new Telegraf(process.env.TELEGRAM_API_TOKEN);
const chat_id = -872858162

//back 10-14
//front 10-16, 10-14
//test 15-19

let checkMessages = false;
const wellDone = [];

function checkTime(time) {
  const hour = new Date().getHours();

  return time.start <= hour && time.end > hour;
}

cron.schedule(
  "0 9-19 * * 1-5",
  () => {
    const day = new Date().getDay();

    const currentWorkers = workers.filter((worker) =>
      worker.all ? checkTime(worker.work) : checkTime(worker.days[day])
    );

    console.log('CURRENT WORKERS', currentWorkers)

    if (currentWorkers.length > 0) {
      const markWorkers = currentWorkers.map((worker) => `@${worker.user}`).join(", ");
      const message = `${markWorkers} напишите в чат своё текущее задание. \nЕсли задания нет, то возьмите его у Максима, далее уведомите о нём в текущий чат.`;
  
      bot.telegram.sendMessage(chat_id, message);

      checkMessages = true;
    }

  },
  {
    scheduled: true,
    timezone: "Europe/Moscow",
  }
);

cron.schedule(
  "15 9-19 * * 1-5",
  () => {

    const day = new Date().getDay();

    const currentWorkers = workers.filter((worker) =>
      worker.all ? checkTime(worker.work) : checkTime(worker.days[day])
    );

    const badUsers = currentWorkers.filter((worker) => !wellDone.includes(worker.user))

    if (badUsers.length > 0) {
      const badUsersStr = badUsers.map(worker => `@${worker.user}`).join(', ')
      const message = `${badUsersStr} - не написали ничего в чат.\n Отмечаю @kawasakime`;
  
      bot.telegram.sendMessage(chat_id, message);
    }

    checkMessages = false;
  },
  {
    scheduled: true,
    timezone: "Europe/Moscow",
  }
);

bot.start((ctx) => ctx.reply("Привет."));
bot.on("message", (ctx) => {
  if (checkMessages) {
    const user = ctx.message.from.username;

    if (workers.map((worker) => worker.user).includes(user)) {
      wellDone.push(user);
    }
  }
});
bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
