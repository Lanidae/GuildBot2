const config = require('./config');
var auth = config.token;
var Discord = require('discord.io');
var logger = require('winston');
var rollers = [];
var selecteds = [];
var tokens = [];
require("http").createServer(async (req,res) => { res.statusCode = 200; res.write("ok"); res.end(); }).listen(3000, () => console.log("Now listening on port 3000"));
let fs = require('fs');

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, { colorize: true });
logger.level = 'debug';

var bot = new Discord.Client({
  token: auth,
  autorun: true
});

bot.on('ready', function(evt) {
  logger.info('Connected');
  logger.info('Logged in as: ' + bot.username + ' - (' + bot.id + ')');
  bot.setPresence({
    game: {
      type: 0,
      name: 'Happy Bot Patrick\'s day! (!ghelp)'
    }
  })
});

fs.readFile('guild.json', 'utf8', function(err, data) {
  if (err) {
    console.log(err);
  } else {
    rollers = JSON.parse(data);
  }
});

fs.readFile('tokens.json', 'utf8', function(err, data) {
  if (err) {
    console.log(err);
  } else {
    tokens = JSON.parse(data);
  }
})

class roller {
  constructor(name, id, dice, health) {
    var args = dice.substring(1, dice.length).split('+');
    this.name = name;
    this.id = id;
    this.dice = parseInt(args[0]);
    this.adder = parseInt(args[1]) || 0;
    this.health = health;
    this.maxhealth = health;
  }
}

class token {
  constructor(name, dice, health) {
    var args = dice.substring(1, dice.length).split('+');
    this.name = name;
    this.health = parseInt(health);
    this.dice = parseInt(args[0]);
    this.adder = parseInt(args[1]) || 0;
  }
}

function titleString(a) {
  var out = a.charAt(0).toUpperCase() + a.slice(1);
  return out;
}
//Tokens
bot.on('message', function(user, userID, channelID, message, evt) {
  if ((message.substring(0, 6).toLowerCase() == '!token')) {
    var args = message.substring(7).split(' ');
    var cmd = args[0];
    args = args.splice(1);
    switch (cmd) {
      case 'add':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: add token');
        newToken = new token(args[0].toLowerCase(), args[1], args[2]);
        tokens.push(newToken);
        bot.sendMessage({
          to: channelID,
          message: 'Added! Your token is a: ' + newToken.name + ' with a ' + args[1] + ' and ' + newToken.health + ' health.'
        });
        const jsontoken = JSON.stringify(tokens);
        fs.writeFile('tokens.json', jsontoken, 'utf8', function(err) {
          if (err) {
            console.log(err);
          } else { }
        });
        break;
      case 'roll':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: roll token');
        var total = parseInt(args[0]);
        var name = args[1].toLowerCase();
        var count = 0;
        var output = '';
        whole:
        for (var i = 0; i < tokens.length; i++) {
          if (tokens[i].name == name) {
            if (count <= total) {
              if (count == 0) {
                output += '```' + titleString(tokens[i].name) + '(' + (count + 1) + ') - ' + Math.floor(Math.random() * parseInt(tokens[i].dice) + 1 + parseInt(tokens[i].adder));
              } else {
                output += '\n' + titleString(tokens[i].name) + '(' + (count + 1) + ') - ' + Math.floor(Math.random() * parseInt(tokens[i].dice) + 1 + parseInt(tokens[i].adder));
              }
              count++;
              if (count == total) {
                break whole;
              }
            } else {

            }
          }
        }

        output += '```';
        bot.sendMessage({
          to: channelID,
          message: output
        });
        break;
      case 'd':
      case 'damage':
        logger.info(Date() + ' - ' + user + '(' + userID + ') did command: damage token');
        var total = parseInt(args[0]);
        var name = args[1].toLowerCase();
        var damage = parseInt(args[2]);
        var count = 0;
        var output = '';
        whole2:
        for (var i = 0; i < tokens.length; i++) {
          whole3:
          if (tokens[i].name == name) {
            if (count < total) {
              if (count == 0) {
                parseInt(tokens[i].health) -= damage;
                output += '```' + titleString(tokens[i].name) + '(' + (count + 1) + ') took ' + damage + ' damage. It has: ' + tokens[i].health + ' left.';
                if (parseInt(tokens[i].health) < 1) {
                  temp = tokens.splice(i + 1, tokens.length);
                  tokens = tokens.splice(0, i);
                  tokens = tokens.concat(temp);
                  i--;
                  count++;
                  break whole3;
                }
              } else {
                parseInt(tokens[i].health) -= damage;
                output += '\n' + titleString(tokens[i].name) + '(' + (count + 1) + ') took ' + damage + ' damage. It has: ' + tokens[i].health + ' left.';
                if (parseInt(tokens[i].health) < 1) {
                  temp = tokens.splice(i + 1, tokens.length);
                  tokens = tokens.splice(0, i);
                  tokens = tokens.concat(temp);
                  i--;
                  count++;
                  break whole3;
                }
              }
            }
            if (count == total) {
              break whole2;
            }
          }

        }
        output += '```';
        bot.sendMessage({
          to: channelID,
          message: output
        });
        const jsontoken2 = JSON.stringify(tokens);
        fs.writeFile('tokens.json', jsontoken2, 'utf8', function(err) {
          if (err) {
            console.log(err);
          } else { }
        });
        break;
      case 'report':
        output = '';
        for (var i = 0; i < tokens.length; i++) {
          if (output == '') {
            output += '```' + titleString(tokens[i].name) + ': ' + tokens[i].dice + '+' + tokens[i].adder + ' | ' + tokens[i].health;
          } else {
            output += '\n' + titleString(tokens[i].name) + ': ' + tokens[i].dice + '+' + tokens[i].adder + ' | ' + tokens[i].health;
          }
        }
        if (output == '') {
          output = 'There are no tokens in the system';
        } else {
          output += '```';
        }
        bot.sendMessage({
          to: channelID,
          message: output
        });
        break;

    }

  }
});

function rollDice(adder = 0, dice) {
  return (Math.floor(Math.random() * dice) + 1 + parseInt(adder));
}
//Conspicuously Not Tokens
bot.on('message', function(user, userID, channelID, message, evt) {
  if ((message.substring(0, 2).toLowerCase() == config.prefix)) {
    var args = message.substring(2).split(' ');
    var cmd = args[0].toLowerCase();
    args = args.splice(1);

    switch (cmd) {
      case 'startup':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: startup');
        bot.sendMessage({
          to: channelID,
          message: 'Booting up! To get yourself added in type \n!gadd <your name> <your dice. If you\'re an acolyte or apprentice do d20+0 or d25+0> <your health>.\nYou can see all the commands with !ghelp'
        });
        break;
      case 'select':
        for (var i = 0; i < rollers.length; i++) {
          var selectee = '';
          if(args[0])
          {
            selectee = args[0].toLowerCase();
          }
          else{
            selectee == 'godfuckingdamnitzana';
          }
          if (rollers[i].name.toLowerCase() == selectee && rollers[i].id == userID) {
            selecteds[userID] = rollers[i];
            bot.sendMessage({
              to: channelID,
              message: 'You selected - `' + args[0] + '` - I\'ll use them until you tell me to do someone else :).'
            });
            break;
          } else if (rollers[i].name == selectee && rollers[i].id != userID) {
            bot.sendMessage({
              to: channelID,
              message: 'Sorry, you can only select your own characters!'
            });
            break;
          } else if (i == (rollers.length - 1)) {
            bot.sendMessage({
              to: channelID,
              message: 'I don\'t see a character by that name. You\'ll have to add yourself in with !gadd'
            });
            break;
          }
        }
        break;
      case 'help':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: help');
        bot.sendMessage({
          to: channelID,
          message: 'Read the wiki if you have any questions! https://github.com/Lanidae/GuildBot2/wiki'

        });
        break;
      case 'report':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: report');
        if (selecteds[userID]) {
          var output = '```\nName:   ' + selecteds[userID].name + '\nDice:   ' + selecteds[userID].dice + ' + ' + selecteds[userID].adder + '\nHealth: ' + selecteds[userID].health + '/' + selecteds[userID].maxhealth + '\n```';
          bot.sendMessage({
            to: channelID,
            message: output
          });
        } else {
          for (var i = 0; i < rollers.length; i++) {
            if (rollers[i].id == userID) {

              var output = '```\nName:   ' + rollers[i].name + '\nDice:   ' + rollers[i].dice + ' + ' + rollers[i].adder + '\nHealth: ' + rollers[i].health + '/' + rollers[i].maxhealth + '\n```';
              bot.sendMessage({
                to: channelID,
                message: output
              });
            }
          }
        }
        break;
      case 'add':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: add');
        newRoller = new roller(args[0], userID, args[1], args[2]);
        rollers.push(newRoller);
        bot.sendMessage({
          to: channelID,
          message: 'Added! You are: ' + newRoller.name + '. Your dice is: d' + newRoller.dice + '+' + newRoller.adder + '. Your health is: ' + newRoller.health + '.'
        });
        const json = JSON.stringify(rollers);
        fs.writeFile('guild.json', json, 'utf8', function(err) {
          if (err) {
            console.log(err);
          } else { }
        });
        break;
      case 'update':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: update');
        if (selecteds[userID]) {
          for (var i = 0; i < rollers.length; i++) {
            if (rollers[i].name == selecteds[userID].name) {
              var updatee = i;
            }
          }
          switch (args[0]) {
            case 'name':
              if (rollers[parseInt(updatee)].id == userID) {
                rollers[parseInt(updatee)].name = args[1];
                selecteds[userID].name = args[1];
                bot.sendMessage({
                  to: channelID,
                  message: 'Your name has been updated! It is now: ' + rollers[parseInt(updatee)].name
                });
                const json = JSON.stringify(rollers);
                fs.writeFile('guild.json', json, 'utf8', function(err) {
                  if (err) {
                    console.log(err);
                  } else { }
                });
              }
              break;
            case 'dice':
              if (rollers[parseInt(updatee)].id == userID) {
                var targs = args[1].substring(1, args[1].length).split('+');
                rollers[parseInt(updatee)].dice = parseInt(targs[0]);
                rollers[parseInt(updatee)].adder = parseInt(targs[1]) || 0;
                selecteds[userID].dice = parseInt(targs[0]);
                selecteds[userID].adder = parseInt(targs[1]) || 0;
                bot.sendMessage({
                  to: channelID,
                  message: 'Your dice has been updated! It is now: ' + args[1]
                });
                const json = JSON.stringify(rollers);
                fs.writeFile('guild.json', json, 'utf8', function(err) {
                  if (err) {
                    console.log(err);
                  } else { }
                });
              }
              break;
            case 'health':
              if (rollers[parseInt(updatee)].id == userID) {
                rollers[parseInt(updatee)].health = args[1];
                rollers[parseInt(updatee)].maxhealth = args[1];
                selecteds[userID].health = args[1];
                selecteds[userID].maxhealth = args[1];
                bot.sendMessage({
                  to: channelID,
                  message: 'Your health has been updated! It is now: ' + rollers[parseInt(updatee)].health
                });
                const json = JSON.stringify(rollers);
                fs.writeFile('guild.json', json, 'utf8', function(err) {
                  if (err) {
                    console.log(err);
                  } else { }
                });
              }
              break;
            default:
              bot.sendMessage({
                to: channelID,
                message: 'Hmmm... it doesn\'t look like that\'s something I can update. Please try again and select either "name" "dice" or "health".\n(Remember dice have to be in the format d30+5. If you don\'t have a modifier, just type +0)'
              });
          }
        } else {
          switch (args[0]) {
            case 'name':
              for (var i = 0; i < rollers.length; i++) {
                if (rollers[i].id == userID) {
                  rollers[i].name = args[1];
                  bot.sendMessage({
                    to: channelID,
                    message: 'Your name has been updated! It is now: ' + rollers[i].name
                  });
                  const json = JSON.stringify(rollers);
                  fs.writeFile('guild.json', json, 'utf8', function(err) {
                    if (err) {
                      console.log(err);
                    } else { }
                  });
                }
              }
              break;
            case 'dice':
              for (var i = 0; i < rollers.length; i++) {
                if (rollers[i].id == userID) {
                  var targs = args[1].substring(1, args[1].length).split('+');
                  rollers[i].dice = parseInt(targs[0]);
                  rollers[i].adder = parseInt(targs[1]) || 0;
                  bot.sendMessage({
                    to: channelID,
                    message: 'Your dice has been updated! It is now: ' + args[1]
                  });
                  const json = JSON.stringify(rollers);
                  fs.writeFile('guild.json', json, 'utf8', function(err) {
                    if (err) {
                      console.log(err);
                    } else { }
                  });
                }
              }
              break;
            case 'health':
              for (var i = 0; i < rollers.length; i++) {
                if (rollers[i].id == userID) {
                  rollers[i].health = args[1];
                  rollers[i].maxhealth = args[1];
                  bot.sendMessage({
                    to: channelID,
                    message: 'Your health has been updated! It is now: ' + rollers[i].health
                  });
                  const json = JSON.stringify(rollers);
                  fs.writeFile('guild.json', json, 'utf8', function(err) {
                    if (err) {
                      console.log(err);
                    } else { }
                  });
                }
              }
              break;
            default:
              bot.sendMessage({
                to: channelID,
                message: 'Hmmm... it doesn\'t look like that\'s something I can update. Please try again and select either "name" "dice" or "health".\n(Remember dice have to be in the format d30+5. If you don\'t have a modifier, just type +0)'
              });
          }
        }
        break;
      case 'roll':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: roll');
        if (args[0]) {
          var tempdice = {};
var count = 1;
var dice = 20;
var adder = 0;
var result = 0;
var output = "";

if(args[0].substr(0,1) == '+')
{
  bot.sendMessage({
    to: channelID,
    message: 'Hey! That\'s not a valid roll format! You can choose from these options ```xdy+z|xdy|dy|dy+z``` or leave it blank for a rank roll'
    });
    break;
}
var tempstring = args[0];
if(tempstring.includes('d'))
{

  if( tempstring.substr(0,1) == 'd')
  {
    count = 1;
    tempstring = tempstring.substr(1,tempstring.length);
  }
  else
  {
    tempdice = tempstring.split('d');
    count = tempdice[0];
  }
  if(tempdice[0])
  {

  }
  else
  {
    tempdice[1] = tempstring.split('+');
  }
  if(tempdice[1].includes('+'))
  {
    tempdice = tempdice[1].split('+');
    dice = tempdice[0];
    adder = tempdice[1];
  }
  else
  {
    dice = tempdice[1];
  }
}
else if(tempstring.includes('+'))
{
  tempdice = tempstring.split('+');
  dice = tempdice[0];
  adder = tempdice[1];
} 
else 
{
  dice = tempstring;
}
count = parseInt(count);
dice = parseInt(dice);
adder = parseInt(adder);

if(count > 1)
{
  var sum = 0;
  for(var i = 0; i < count; i++)
  {
    result = (Math.floor(Math.random() * dice) + 1);
      output += '[' + result + '] - ' + (result + adder);
      sum += result;
      if (result == dice)
      {
          output += ' - [CRIT]';
      }
      output += ' | ';
  }
    bot.sendMessage({
    to: channelID,
    message: '```Results: ' + output + ' |-| ' + sum + '```'
    });
    logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' rolled: ' + output + '')
    break;
}
else
{
  result = (Math.floor(Math.random() * dice) + 1);
    output += '[' + result + '] - ' + (result + adder);
    if (result == dice)
    {
        output += ' - [CRIT]';
    }
    bot.sendMessage({
    to: channelID,
    message: '```Results: 1d' + dice + '+' + adder + ' - ' + output + '```'
    });
    logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' rolled: ' + output + '');
    break;
}
        }
        else {
          if (selecteds[userID]) {
            if (selecteds[userID].id == userID) {
              var result = Math.floor(Math.random() * selecteds[userID].dice) + 1;
              var output = "";
              output += selecteds[userID].name + '\'s Result: `d' + selecteds[userID].dice + ' + ' + selecteds[userID].adder + ' [' + result + ']` - ' + (result + selecteds[userID].adder);
              if (result == selecteds[userID].dice) {
                output += ' - [CRIT]';
              };
              bot.sendMessage({
                to: channelID,
                message: output
              });
            }
            logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' rolled: ' + output + '');
            break;
          }
          else {
            for (var i = 0; i < rollers.length; i++) {
              if (rollers[i].id == userID) {
                var result = Math.floor(Math.random() * rollers[i].dice) + 1;
                var output = "";
                output += rollers[i].name + '\'s Result: `d' + rollers[i].dice + ' + ' + rollers[i].adder + ' [' + result + ']` - ' + (result + rollers[i].adder);
                if (result == rollers[i].dice) {
                  output += ' - [CRIT]';
                }
                bot.sendMessage({
                  to: channelID,
                  message: output
                });
              }
            }
            logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' rolled: ' + output + '');
            break;
          }
        }
      case 'hr':
      case 'healthreport':
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: health report');
        if (selecteds[userID]) {
          if (selecteds[userID].id == userID) {
            bot.sendMessage({
              to: channelID,
              message: selecteds[userID].name + '\'s health is at: ' + parseInt(selecteds[userID].health)
            });
          }

        }
        else {
          for (var i = 0; i < rollers.length; i++) {
            if (rollers[i].id == userID) {
              bot.sendMessage({
                to: channelID,
                message: rollers[i].name + '\'s health is at: ' + parseInt(rollers[i].health)
              });
            }
          }
        }
        break;
      case 'd':
      case 'damage':
       damage = parseInt(args[0]) || 1;
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: damage');
        if (selecteds[userID]) {
          if (selecteds[userID].id == userID) {
            selecteds[userID].health = parseInt(selecteds[userID].health) - damage;
            bot.sendMessage({
              to: channelID,
              message: 'I did ' + damage + ' damage to ' + selecteds[userID].name + '.'
            });
            switch (parseInt(selecteds[userID].health)) {
              case 0:
                bot.sendMessage({
                  to: channelID,
                  message: selecteds[userID].name + '\'s health is at: ' + parseInt(selecteds[userID].health) + '. If you *don\'t* have force body or endurance, you\'re unconscious.'
                });
                break;
              case -1:
                bot.sendMessage({
                  to: channelID,
                  message: selecteds[userID].name + '\'s health is at: ' + parseInt(selecteds[userID].health) + '. If you *don\'t* have force body or endurance, you\'re dead :(.'
                });
                break;
              default:
                bot.sendMessage({
                  to: channelID,
                  message: selecteds[userID].name + '\'s health is at: ' + parseInt(selecteds[userID].health)
                });
            }
          }
        } else {
          for (var i = 0; i < rollers.length; i++) {
            if (rollers[i].id == userID) {
              rollers[i].health = parseInt(rollers[i].health) - damage;
              bot.sendMessage({
              to: channelID,
              message: 'I did ' + damage + ' damage to ' + rollers[i].name + '.'
            });
              switch (parseInt(rollers[i].health)) {
                case 0:
                  bot.sendMessage({
                    to: channelID,
                    message: rollers[i].name + '\'s health is at: ' + parseInt(rollers[i].health) + '. If you *don\'t* have force body or endurance, you\'re unconscious.'
                  });
                  break;
                case -1:
                  bot.sendMessage({
                    to: channelID,
                    message: rollers[i].name + '\'s health is at: ' + parseInt(rollers[i].health) + '. If you *don\'t* have force body or endurance, you\'re dead :(.'
                  });
                  break;
                default:
                  bot.sendMessage({
                    to: channelID,
                    message: rollers[i].name + '\'s health is at: ' + parseInt(rollers[i].health)
                  });
              }
            }
          }
        }
        break;
      case 'h':
      case 'heal':
        healing = parseInt(args[0]) || 1;
        logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: heal');
        if (selecteds[userID]) {
          if (selecteds[userID].id == userID) {
            if (parseInt(selecteds[userID].health) + healing > parseInt(selecteds[userID].maxhealth)) {
              selecteds[userID].health = selecteds[userID].maxhealth;
              bot.sendMessage({
                to: channelID,
                message: 'You tried healing over your max, so I set your health to maximum (' + selecteds[userID].maxhealth + ')'
              });
            }
            else {
              selecteds[userID].health = parseInt(selecteds[userID].health) + healing;
              bot.sendMessage({
                to: channelID,
                message: selecteds[userID].name + '\'s health is at: ' + parseInt(selecteds[userID].health)
              });
            }
          }
        } else {
          for (var i = 0; i < rollers.length; i++) {
            if (rollers[i].id == userID) {
              if (parseInt(rollers[i].health) + healing > parseInt(rollers[i].maxhealth)) {
                rollers[i].health = rollers[i].maxhealth;
                bot.sendMessage({
                  to: channelID,
                  message: 'You tried healing over your max, so I set your health to maximum (' + rollers[i].maxhealth + ')'
                });
              }
              else {
                rollers[i].health = parseInt(rollers[i].health) + healing;
                bot.sendMessage({
                  to: channelID,
                  message: rollers[i].name + '\'s health is at: ' + parseInt(rollers[i].health)
                });
              }
            }
          }
        }
        break;
      case 'shutdown':
        for (var i = 0; i < rollers.length; i++) {
          if (user == 'Lanidae') {
            bot.sendMessage({
              to:channelID,
              message: 'shutting down, byebye!'
            });
            process.exit();
          }

        }
        break;

    }
  }
});