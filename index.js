const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const pvp = require('mineflayer-pvp').plugin;
const autobot = require('mineflayer-autobot');
const readline = require('readline');
const fs = require('fs');

// Create a readline interface for reading input from console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Set your password here
const password = 'your_password_here';

// Create a new mineflayer bot instance
const bot = mineflayer.createBot({
  host: 'localhost',
  username: 'bot',
  version: '1.19.3'
});

// Load required plugins
bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);
bot.loadPlugin(autobot);

// Listen for chat messages
bot.on('chat', (username, message) => {
  console.log(`${username}: ${message}`);

  // Handle #goto command
  if (message.startsWith('#goto')) {
    const parts = message.split(' ');
    const target = bot.entity.position.offset(
      parseInt(parts[1], 10),
      parseInt(parts[2], 10),
      parseInt(parts[3], 10)
    );

    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);

    // Avoid hostile mobs and TNT while pathfinding
    defaultMove.allowDangerous = false;

    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new GoalBlock(target.x, target.y, target.z));
  }

  // Handle #hunt command
  if (message.startsWith('#hunt')) {
    const parts = message.split(' ');
    for (let i = 1; i < parts.length; i++) {
      const playerToAttackName = parts[i];
      const playerToAttackEntity =
        bot.players[playerToAttackName] && bot.players[playerToAttackName].entity;

      if (!playerToAttackEntity) {
        console.log(`Cannot find player ${playerToAttackName}`);
        continue;
      }

      console.log(`Attacking ${playerToAttackName}`);
      bot.pvp.attack(playerToAttackEntity);
    }
  }

// Handle #eat command
if (message === '#eat true') {
console.log(`Auto-eating enabled`);
bot.autobot.eat(true);
} else if (message === '#eat false') {
console.log(`Auto-eating disabled`);
bot.autobot.eat(false);
}

// Handle "leave me alone" message from other players in chat
if (message === 'leave me alone' && username !== bot.username) {
console.log(`Leaving server...`);
bot.quit();
}
});

// Listen for input from console and send it as chat messages in-game
rl.on('line', (input) => {
bot.chat(input);
});

// When the bot spawns...
bot.on('spawn', () => {

// Log all usernames to username.txt file
let usernamesStr ='';

for(let playerName in bot.players){
usernamesStr += playerName + '\n';
}

fs.writeFileSync('./username.txt', usernamesStr);

console.log(`Logged all usernames to username.txt`);

// Login with password if required by server
bot.chat(`/login ${password}`);
});

// Listen for path updates while pathfinding to log status messages to console.
bot.on('path_update', (r) => {
if(r.status === 'noPath'){
console.log('[pathfinder] No path to target!');
return;
}

if(r.status === 'success'){
console.log('[pathfinder] Path found!');
return;
}
});

// Listen for goal_reached event while pathfinding to log status messages to console.
bot.on('goal_reached', () => {
console.log('[pathfinder] Goal reached!');
});
