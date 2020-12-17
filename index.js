const config = require('./config');
var auth = config.token;
var Discord = require('discord.io');
var logger = require('winston');
var rollers = [];
var selecteds = [];
const keepAlive = require('./server');

keepAlive();
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
    game:{
      type: 0,
      name: 'Botting Around The Christmas Tree (v1.0.0)'
    }
  })
});

fs.readFile('guild.json', 'utf8', function(err,data){
  if(err){
    console.log(err);
  } else {
    rollers = JSON.parse(data);
  }
});

class roller {
  constructor(name, id, dice, health) {
    var args = dice.substring(1, dice.length).split('+');
    this.name = name;
    this.id = id;
    this.dice = parseInt(args[0]);
    this.adder = parseInt(args[1]);
    this.health = health;
    this.maxhealth = health;
  }
}

function rollDice(adder = 0, dice) {
  return (Math.floor(Math.random() * dice) + 1 + parseInt(adder));
}

bot.on('message', function(user, userID, channelID, message, evt){
  if ((message.substring(0,2) == '!g') || (message.substring(0,2) == '!G')){
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
                    if (rollers[i].name == args[0]) {
                        selecteds[userID] = rollers[i];
                    }
                }
                bot.sendMessage({
                    to: channelID,
                    message: 'You selected - `' + args[0] + '` - I\'ll use them until you tell me to do someone else :).'
                });
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
            case 'Add':
            case 'ADd':
            case 'ADD':
            case 'AdD':
            case 'aDD':
            case 'adD':
            case 'add':
                logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: add');
                newRoller = new roller(args[0], userID, args[1], args[2]);
                rollers.push(newRoller);
                bot.sendMessage({
                    to: channelID,
                    message: 'Added! You are: ' + newRoller.name + '. Your dice is: d' + newRoller.dice +'. Your health is: ' + newRoller.health + '.'
                });
                const json = JSON.stringify(rollers);
                        fs.writeFile('guild.json', json, 'utf8', function (err) {
                            if (err) {
                                console.log(err);
                            } else {}
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
                                fs.writeFile('guild.json', json, 'utf8', function (err) {
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
                                rollers[parseInt(updatee)].adder = parseInt(targs[1]);
                                selecteds[userID].dice = parseInt(targs[0]);
                                selecteds[userID].adder = parseInt(targs[1]);
                                bot.sendMessage({
                                    to: channelID,
                                    message: 'Your dice has been updated! It is now: ' + args[1]
                                });
                                const json = JSON.stringify(rollers);
                                fs.writeFile('guild.json', json, 'utf8', function (err) {
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
                                fs.writeFile('guild.json', json, 'utf8', function (err) {
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
                                    fs.writeFile('guild.json', json, 'utf8', function (err) {
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
                                    rollers[i].adder = parseInt(targs[1]);
                                    bot.sendMessage({
                                        to: channelID,
                                        message: 'Your dice has been updated! It is now: ' + args[1]
                                    });
                                    const json = JSON.stringify(rollers);
                                    fs.writeFile('guild.json', json, 'utf8', function (err) {
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
                                    fs.writeFile('guild.json', json, 'utf8', function (err) {
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
            case 'Roll':
            case 'ROll':
            case 'ROLl':
            case 'ROLL':
            case 'RoLL':
            case 'RolL':
            case 'rolL':
            case 'roLL':
            case 'rOLL':
            case 'roll':
                logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: roll');
                if (args[0]) {
                    var rolling = args[0].split('+');
                    var value;
                    if (rolling[0].substring(0, 1) != 'd') {
                        var count = parseInt(rolling[0].substring(0, 1));
                        rolling[0] = rolling[0].substring(1, rolling[0].length);
                        var output = '';
                        if (rolling[1]) {
                            for (var i = 0; i < count; i++) {
                                if (i == 0) {
                                    output += (Math.floor(Math.random() * parseInt(rolling[0].substring(1, rolling[0].length))) + 1 + parseInt(rolling[1]));
                                }
                                else {
                                    output += ' | ' + (Math.floor(Math.random() * parseInt(rolling[0].substring(1, rolling[0].length))) + 1 + parseInt(rolling[1]));
                                }
                            }
                            bot.sendMessage({
                                to: channelID,
                                message: 'Results: `' + count + 'd' + rolling[0].substring(1, rolling[0].length) + '+' + rolling[1] +' - ' + output + '`'
                            });
                        } else {
                            for (var i = 0; i < count; i++) {
                                if (i = 0) {
                                    output += (Math.floor(Math.random() * parseInt(rolling[0].substring(1, rolling[0].length))) + 1);
                                } else {
                                    output += ' | ' + (Math.floor(Math.random() * parseInt(rolling[0].substring(1, rolling[0].length))) + 1);
                                }
                            }
                            bot.sendMessage({
                                to: channelID,
                                message: 'Results: `' + count + 'd' + rolling[0].substring(1, rolling[0].length) + ' - ' + output + '`'
                            });
                        }
                        
                        break;
                    } else {
                        if (rolling[1]) {
                            value = (Math.floor(Math.random() * parseInt(rolling[0].substring(1, rolling[0].length))) + 1 + parseInt(rolling[1]));
                            bot.sendMessage({
                                to: channelID,
                                message: 'Result: `' + rolling[0] + ' + ' + rolling[1] + '` ' + value
                            });
                            break;
                        }
                        else {
                            value = (Math.floor(Math.random() * parseInt(rolling[0].substring(1, rolling[0].length))) + 1);
                            bot.sendMessage({
                                to: channelID,
                                message: 'Result: `' + rolling[0] + ' + 0` ' + value
                            });
                            break;
                        }
                    }
                }
                else {
                    if (selecteds[userID]) {
                        if (selecteds[userID].id == userID) {
                            bot.sendMessage({
                                to: channelID,
                                message: selecteds[userID].name +'\'s Result: `d' + selecteds[userID].dice + ' + ' + selecteds[userID].adder + '` ' + rollDice(parseInt(selecteds[userID].adder), parseInt(selecteds[userID].dice))
                            });
                        }
                        break;
                    }
                    else {
                        for (var i = 0; i < rollers.length; i++) {
                            if (rollers[i].id == userID) {
                                bot.sendMessage({
                                    to: channelID,
                                    message: rollers[i].name + '\'s Result: `d' + rollers[i].dice + ' + ' + rollers[i].adder + '` ' + rollDice(parseInt(rollers[i].adder), parseInt(rollers[i].dice))
                                });
                            }
                        }
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
                                message: selecteds[userID].name + '\'s health is at: ' + selecteds[userID].health
                            });
                        }

                }
                else {
                    for (var i = 0; i < rollers.length; i++) {
                        if (rollers[i].id == userID) {
                            bot.sendMessage({
                                to: channelID,
                                message: rollers[i].name + '\'s health is at: ' + rollers[i].health
                            });
                        }
                    }
                }
                break;
            case 'd':
            case 'damage':
                logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: damage');
                if (selecteds[userID]) {
                    if (selecteds[userID].id == userID) {
                        selecteds[userID].health = selecteds[userID].health - parseInt(args[0]);
                        switch (selecteds[userID].health) {
                            case 0:
                                bot.sendMessage({
                                    to: channelID,
                                    message: selecteds[userID].name + '\'s health is at: ' + selecteds[userID].health + '. If you *don\'t* have force body or endurance, you\'re unconscious.'
                                });
                                break;
                            case -1:
                                bot.sendMessage({
                                    to: channelID,
                                    message: selecteds[userID].name + '\'s health is at: ' + selecteds[userID].health + '. If you *don\'t* have force body or endurance, you\'re dead :(.'
                                });
                                break;
                            default:
                                bot.sendMessage({
                                    to: channelID,
                                    message: selecteds[userID].name + '\'s health is at: ' + selecteds[userID].health
                                });
                        }
                    }
                } else {
                    for (var i = 0; i < rollers.length; i++) {
                        if (rollers[i].id == userID) {
                            rollers[i].health = rollers[i].health - parseInt(args[0]);
                            switch (rollers[i].health) {
                                case 0:
                                    bot.sendMessage({
                                        to: channelID,
                                        message: rollers[i].name + '\'s health is at: ' + rollers[i].health + '. If you *don\'t* have force body or endurance, you\'re unconscious.'
                                    });
                                    break;
                                case -1:
                                    bot.sendMessage({
                                        to: channelID,
                                        message: rollers[i].name + '\'s health is at: ' + rollers[i].health + '. If you *don\'t* have force body or endurance, you\'re dead :(.'
                                    });
                                    break;
                                default:
                                    bot.sendMessage({
                                        to: channelID,
                                        message: rollers[i].name + '\'s health is at: ' + rollers[i].health
                                    });
                            }
                        }
                    }
                }
                break;
            case 'h':
            case 'heal':
                logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: heal');
                if (selecteds[userID]) {
                    if (selecteds[userID].id == userID) {
                        if (selecteds[userID].health + parseInt(args[0]) > selecteds[userID].maxhealth) {
                            selecteds[userID].health = selecteds[userID].maxhealth;
                            bot.sendMessage({
                                to: channelID,
                                message: 'You tried healing over your max, so I set your health to maximum (' + selecteds[userID].maxhealth + ')'
                            });
                        }
                        else {
                            selecteds[userID].health = selecteds[userID].health + parseInt(args[0]);
                            bot.sendMessage({
                                to: channelID,
                                message: selecteds[userID].name + '\'s health is at: ' + selecteds[userID].health
                            });
                        }
                    }
                } else {
                    for (var i = 0; i < rollers.length; i++) {
                        if (rollers[i].id == userID) {
                            if (rollers[i].health + parseInt(args[0]) > rollers[i].maxhealth) {
                                rollers[i].health = rollers[i].maxhealth;
                                bot.sendMessage({
                                    to: channelID,
                                    message: 'You tried healing over your max, so I set your health to maximum (' + rollers[i].maxhealth + ')'
                                });
                            }
                            else {
                                rollers[i].health = rollers[i].health + parseInt(args[0]);
                                bot.sendMessage({
                                    to: channelID,
                                    message: rollers[i].name + '\'s health is at: ' + rollers[i].health
                                });
                            }
                        }
                    }
                }
                break;
            case 'shutdown':
                logger.info(Date() + ' - ' + user + '(' + userID + ')' + ' did command: shutdown');
                if (user = 'Lanidae') {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Shutting down!'
                    });
                    var t = Math.floor(Math.random() * 1000) + 750;
                    setTimeout(() => {
                        bot.sendMessage({
                            to: channelID,
                            message: 'Powered down, goodbye!'
                        });
                    }, t);
                    const json = JSON.stringify(rollers);
                    fs.writeFile('guild.json', json, 'utf8', function (err) {
                        if (err) {
                            console.log(err);
                        } else { }
                    });
                    setTimeout(() => { process.exit(1); }, 2000);
                    break;
                }
                else {
                    bot.sendMessage({
                        to: channelID,
                        message: 'Sorry, only the creator (Theo) can shut me down!'
                    });
                }
                break;
        }
  }
});