const Sequelize = require('sequelize');
const queuing = require("./queue.js");
const dbQueue = new queuing();

const sequelize = new Sequelize('database', 'Hot123', '132435465768798', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: 'database.sqlite',
});

const DB = sequelize.define('Economy', {
  userID: {
    type: Sequelize.STRING,
    unique: true,
  },
  balance: Sequelize.INTEGER,
  daily: Sequelize.INTEGER,
});

DB.sync()

console.log('\x1b[32m%s\x1b[0m', `═[Discord-Economy Database Loaded -V1.2.2]═[Support server: https://discord.gg/eBFKDbx]=`);

module.exports = {

  SetBalance: function(UserID, toSet) {
    return dbQueue.addToQueue({
      "value": this._SetBalance.bind(this),
      "args": [UserID, toSet]
    });
  },

  _SetBalance: async function(UserID, toSet) {
    if (!UserID) throw new Error('SetBalance function is missing parameters!')
    if (!toSet && toSet != 0) throw new Error('SetBalance function is missing parameters!')
    if (!parseInt(toSet)) throw new Error('SetBalance function parameter toSet needs to be a number!')
    toSet = parseInt(toSet)

    return new Promise(async (resolve, error) => {

      const Info = await DB.update({
        balance: toSet
      }, {
        where: {
          userID: UserID
        }
      });
      if (Info > 0) {
        return resolve({
          userid: UserID,
          balance: toSet
        })
      } else {

        try {
          const Info2 = await DB.create({
            userID: UserID,
            balance: 0,
            daily: 0
          });
          return resolve({
            userid: UserID,
            balance: toSet
          })
        } catch (e) {
          if (e.name === 'SequelizeUniqueConstraintError') {
            return resolve(`Duplicate Found, shouldn\'t happen in this function, check typo\'s`)
          }
          return error(e)
        }

      }

    });
  },

  AddToBalance: function(UserID, toAdd) {
    return dbQueue.addToQueue({
      "value": this._AddToBalance.bind(this),
      "args": [UserID, toAdd]
    });
  },

  _AddToBalance: async function(UserID, toAdd) {
    if (!UserID) throw new Error('AddToBalance function is missing parameters!')
    if (!toAdd && toAdd != 0) throw new Error('AddToBalance function is missing parameters!')
    if (!parseInt(toAdd)) throw new Error('AddToBalance function parameter toAdd needs to be a number!')
    toAdd = parseInt(toAdd)

    return new Promise(async (resolve, error) => {

      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {

        const Info2 = await DB.update({
          balance: Info.balance + toAdd
        }, {
          where: {
            userID: UserID
          }
        });
        if (Info2 > 0) {
          return resolve({
            userid: UserID,
            oldbalance: Info.balance,
            newbalance: Info.balance + toAdd,
          })
        }
        return error('Something went wrong in function AddToBalance')
      }

      return resolve('User has no record in database!')

    });
  },

  SubtractFromBalance: function(UserID, toSubtract) {
    return dbQueue.addToQueue({
      "value": this._SubtractFromBalance.bind(this),
      "args": [UserID, toSubtract]
    });
  },

  _SubtractFromBalance: async function(UserID, toSubtract) {
    if (!UserID) throw new Error('SubtractFromBalance function is missing parameters!')
    if (!toSubtract && toSubtract != 0) throw new Error('SubtractFromBalance function is missing parameters!')
    if (!parseInt(toSubtract)) throw new Error('SubtractFromBalance function parameter toSubtract needs to be a number!')
    toSubtract = parseInt(toSubtract)

    return new Promise(async (resolve, error) => {

      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {

        const Info2 = await DB.update({
          balance: Info.balance - toSubtract
        }, {
          where: {
            userID: UserID
          }
        });
        if (Info2 > 0) {
          return resolve({
            userid: UserID,
            oldbalance: Info.balance,
            newbalance: Info.balance - toSubtract
          })
        }
        return error('Something went wrong in function SubtractFromBalance')
      }

      return resolve('User has no record in database!')

    });
  },

  FetchBalance: function(UserID) {
    return dbQueue.addToQueue({
      "value": this._FetchBalance.bind(this),
      "args": [UserID]
    });
  },

  _FetchBalance: async function(UserID) {
    if (!UserID) throw new Error('FetchBalance function is missing parameters!')
    return new Promise(async (resolve, error) => {

      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {
        return resolve({
          userid: Info.userID,
          balance: Info.balance
        })
      }
      try {
        const Info2 = await DB.create({
          userID: UserID,
          balance: 0,
          daily: 0
        });
        return resolve({
          userid: UserID,
          balance: 0
        })
      } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
          return resolve(`Duplicate Found, shouldn\'t happen in this function, check typo\'s`)
        }
        return error(e)
      }
    });
  },

  Leaderboard: function(data = {}) {
    return dbQueue.addToQueue({
      "value": this._Leaderboard.bind(this),
      "args": [data]
    });
  },

  _Leaderboard: async function(data) {
    if (data.limit && !parseInt(data.limit)) throw new Error('Leaderboard function parameter obj.limit needs to be a number!')
    if (data.limit) data.limit = parseInt(data.limit)
    if (data.filter && !data.filter instanceof Function) throw new Error('Leaderboard function parameter obj.filter needs to be a function!')
    if (!data.filter) data.filter = x => x;
    return new Promise(async (resolve, error) => {

      if (data.search) {

        const Info = await DB.findAll({
          where: {
            balance: {
              [Sequelize.Op.gt]: 0
            }
          }
        })

        let output = Info.map(l => l.userID + ' ' + l.balance).sort((a, b) => b.split(' ')[1] - a.split(' ')[1]).map(l => new Object({
          userid: l.split(' ')[0],
          balance: l.split(' ')[1]
        })).filter(data.filter).slice(0, data.limit).findIndex(l => l.userid == data.search)

        if (output == -1) return resolve('Not found')
        return resolve(output + 1)

      } else {

        const Info = await DB.findAll({
          where: {
            balance: {
              [Sequelize.Op.gt]: 0
            }
          }
        })

        let output = Info.map(l => l.userID + ' ' + l.balance).sort((a, b) => b.split(' ')[1] - a.split(' ')[1]).map(l => new Object({
          userid: l.split(' ')[0],
          balance: l.split(' ')[1]
        })).filter(data.filter).slice(0, data.limit)

        return resolve(output)

      }

    });
  },

  Daily: function(UserID) {
    return dbQueue.addToQueue({
      "value": this._Daily.bind(this),
      "args": [UserID]
    });
  },

  _Daily: async function(UserID) {
    if (!UserID) throw new Error('Daily function is missing parameters!')
    return new Promise(async (resolve, error) => {

      var today = new Date();
      var dd = today.getDate();
      var mm = today.getMonth() + 1; //Januari is 0;
      var yyyy = today.getFullYear();

      var now = new Date(`${mm} ${dd}, ${yyyy}`)
      var nextDay = now.setDate(now.getDate() + 1);

      var difference = nextDay - today.getTime();

      var days = Math.floor(difference / (1000 * 60 * 60 * 24));
      var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;
      today = mm + dd + yyyy;


      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {

        if (Info.daily != today) {
          const Info2 = await DB.update({
            daily: today
          }, {
            where: {
              userID: UserID
            }
          });
          if (Info2 > 0) {
            return resolve({
              userid: Info.userID,
              updated: true
            })
          }
        } else {
          return resolve({
            userid: Info.userID,
            updated: false,
            timetowait: days + "d " + hours + "h " + minutes + "m " + seconds + "s"
          })
        }
      }
      try {
        const Info3 = await DB.create({
          userID: UserID,
          balance: 0,
          daily: today
        });
        return resolve({
          userid: UserID,
          updated: true
        })
      } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
          return resolve(`Duplicate Found, shouldn\'t happen in this function, check typo\'s`)
        }
        return error(e)
      }
    });
  },

  Transfer: function(FromUser, ToUser, Amount) {
    return dbQueue.addToQueue({
      "value": this._Transfer.bind(this),
      "args": [FromUser, ToUser, Amount]
    });
  },

  _Transfer: async function(FromUser, ToUser, Amount) {
    if (!FromUser || !ToUser || !Amount) throw new Error('Transfer function is missing parameters!')
    if (!parseInt(Amount)) throw new Error('Transfer function parameter Amount needs to be a number!')
    Amount = parseInt(Amount)

    return new Promise(async (resolve, error) => {

      const Info = await DB.findOne({
        where: {
          userID: FromUser
        }
      });
      if (Info) {

        if (Info.balance < Amount) {
          throw new Error('The user that transfers has insufficient funds.')
          return
        }

        const Info6 = await DB.update({
          balance: Info.balance - Amount
        }, {
          where: {
            userID: FromUser
          }
        });

        const Info2 = await DB.findOne({
          where: {
            userID: ToUser
          }
        });
        if (Info2) {

          const Info3 = await DB.update({
            balance: Info2.balance + Amount
          }, {
            where: {
              userID: ToUser
            }
          });
          if (Info3 > 0) {

            return resolve({
              FromUser: Info.balance - Amount,
              ToUser: Info2.balance + Amount
            })
          }
          return error('Something went wrong in function Transfer')
        } else {
          try {
            const Info5 = await DB.create({
              userID: ToUser,
              balance: Amount,
              daily: 0
            });
            return resolve({
              FromUser: Info.balance - Amount,
              ToUser: Amount
            })
          } catch (e) {
            if (e.name === 'SequelizeUniqueConstraintError') {
              return resolve(`Duplicate Found, shouldn\'t happen in this function, check typo\'s`)
            }
            return error(e)
          }
        }
      }
      throw new Error('The user that transfers has insufficient funds.')
    });
  },

  Coinflip: function(UserID, Flip, Input) {
    return dbQueue.addToQueue({
      "value": this._Coinflip.bind(this),
      "args": [UserID, Flip, Input]
    });
  },

  _Coinflip: async function(UserID, Flip, Input) {
    Flip = Flip.toLowerCase()
    if (!UserID || !Flip || !Input) throw new Error('Coinflip function is missing parameters!')
    if (Flip != 'cruz' && Flip != 'cara') throw new Error('Coinflip second parameter needs to be [cruz  or cara]')
    if (!parseInt(Input)) throw new Error('Coinflip function parameter Input needs to be a number!')
    Input = parseInt(Input)

    return new Promise(async (resolve, error) => {

      const random = ['cruz', 'cara']
      const output = random[Math.floor(Math.random() * 2)]

      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {

        if (Info.balance < Input) {
          throw new Error('The user has insufficient funds.')
          return
        }

        if (Flip != output) {
          const Info2 = await DB.update({
            balance: Info.balance - Input
          }, {
            where: {
              userID: UserID
            }
          });
          if (Info2 > 0) {
            return resolve({
              userid: UserID,
              oldbalance: Info.balance,
              newbalance: Info.balance - Input,
              output: 'Perdiste'
            })
          }
          return error('Something went wrong in function Coinflip')
        } else {
          const Info3 = await DB.update({
            balance: Info.balance + Input
          }, {
            where: {
              userID: UserID
            }
          });
          if (Info3 > 0) {

            return resolve({
              userid: UserID,
              oldbalance: Info.balance,
              newbalance: Info.balance + Input,
              output: 'Ganaste'
            })
          }
          return error('Something went wrong in function Coinflip')
        }

      }
      throw new Error('The user has insufficient funds.')

    });
  },

  Dice: function(UserID, DiceNumber, Input) {
    return dbQueue.addToQueue({
      "value": this._Dice.bind(this),
      "args": [UserID, DiceNumber, Input]
    });
  },

  _Dice: async function(UserID, DiceNumber, Input) {
    if (!UserID || !DiceNumber || !Input) throw new Error('Dice function is missing parameters!')
    if (!parseInt(DiceNumber) || ![1, 2, 3, 4, 5, 6].includes(parseInt(DiceNumber))) throw new Error('The Dice number should be 1-6')
    if (!parseInt(Input)) throw new Error('Dice function parameter Input needs to be a number!')
    Input = parseInt(Input)
    DiceNumber = parseInt(DiceNumber)

    return new Promise(async (resolve, error) => {

      const output = Math.floor((Math.random() * 6) + 1);

      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {

        if (Info.balance < Input) {
          throw new Error('The user has insufficient funds.')
          return
        }

        if (DiceNumber != output) {
          const Info2 = await DB.update({
            balance: Info.balance - Input
          }, {
            where: {
              userID: UserID
            }
          });
          if (Info2 > 0) {
            return resolve({
              userid: UserID,
              oldbalance: Info.balance,
              newbalance: Info.balance - Input,
              guess: DiceNumber,
              dice: output,
              output: 'Perdiste'
            })
          }
          return error('Something went wrong in function Dice')
        } else {
          const Info3 = await DB.update({
            balance: Info.balance + Input
          }, {
            where: {
              userID: UserID
            }
          });
          if (Info3 > 0) {

            return resolve({
              userid: UserID,
              oldbalance: Info.balance,
              newbalance: Info.balance + Input,
              guess: DiceNumber,
              dice: output,
              output: 'Ganaste'
            })
          }
          return error('Something went wrong in function Dice')
        }

      }
      throw new Error('The user has insufficient funds.')

    });
  },

  Delete: function(UserID) {
    return dbQueue.addToQueue({
      "value": this._Delete.bind(this),
      "args": [UserID]
    });
  },

  _Delete: async function(UserID) {
    if (!UserID) throw new Error('Delete function is missing parameters!')

    return new Promise(async (resolve, error) => {

      const Info = await DB.destroy({
        where: {
          userID: UserID
        }
      });
      if (Info) {
        return resolve({
          deleted: true
        })
      }

      return resolve({
        deleted: false
      })

    });
  },

  ResetDaily: function(UserID) {
    return dbQueue.addToQueue({
      "value": this._ResetDaily.bind(this),
      "args": [UserID]
    });
  },

  _ResetDaily: async function(UserID) {
    if (!UserID) throw new Error('ResetDaily function is missing parameters!')

    return new Promise(async (resolve, error) => {

      const Info = await DB.update({
        daily: 0
      }, {
        where: {
          userID: UserID
        }
      });
      if (Info > 0) {
        return resolve(`Daily Reset.`);
      } else {

        try {
          const Info2 = await DB.create({
            userID: UserID,
            balance: 0,
            daily: 0
          });
          return resolve(`Daily Reset.`)
        } catch (e) {
          if (e.name === 'SequelizeUniqueConstraintError') {
            return resolve(`Duplicate Found, shouldn\'t happen in this function, check typo\'s`)
          }
          return error(e)
        }

      }

    });
  },

  Work: function(UserID, data = {}) {
    return dbQueue.addToQueue({
      "value": this._Work.bind(this),
      "args": [UserID, data]
    });
  },

  _Work: async function(UserID, data = {}) {
    if (!UserID) throw new Error('Work function is missing parameters!')
    if (data.jobs && !Array.isArray(data.jobs)) throw new Error('Work function parameter data.jobs is not an array!')
    if (data.money && !parseInt(data.money)) throw new Error('Work function parameter data.money needs to be a number!')
    if (data.failurerate && !parseInt(data.failurerate)) throw new Error('Work function parameter data.failurerate needs to be a number!')
    if (data.failurerate) data.failurerate = parseInt(data.failurerate)
    if (data.failurerate && data.failurerate < 0 || data.failurerate > 100) throw new Error('Work function parameter data.failurerate needs to be a number! between 0-100')
    if (data.money) data.money = parseInt(data.money)

    if (!data.jobs) data.jobs = ["Miner", "Bartender", "Cashier", "Cleaner", "Drugdealer", "Assistant", "Nurse", "Cleaner", "Teacher", "Accountants", "Security Guard", "Sheriff", "Lawyer", "Dishwasher", "Electrician", "Singer", "Dancer"];
    if (!data.money) data.money = Math.floor(Math.random() * 101)
    if (!data.failurerate) data.failurerate = 50

    var success = true;

    var randomnumber = Math.random()
    if (randomnumber <= data.failurerate / 100) success = false;

    return new Promise(async (resolve, error) => {

      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {

        if (success) {

          const Info2 = await DB.update({
            balance: Info.balance + data.money
          }, {
            where: {
              userID: UserID
            }
          });

          if (Info2 > 0) {
            return resolve({
              userid: Info.userID,
              earned: data.money,
              job: data.jobs[Math.floor(Math.random() * data.jobs.length)],
              balance: Info.balance + data.money
            })
          }

        } else {
          return resolve({
            userid: Info.userID,
            earned: 0,
            job: data.jobs[Math.floor(Math.random() * data.jobs.length)],
            balance: Info.balance
          })
        }

      }

      try {
        if (!success) data.money = 0;

        const Info3 = await DB.create({
          userID: UserID,
          balance: data.money,
          daily: 0
        });
        return resolve({
          userid: UserID,
          earned: data.money,
          job: data.jobs[Math.floor(Math.random() * data.jobs.length)],
          balance: data.money
        })
      } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
          return resolve(`Duplicate Found, shouldn\'t happen in this function, check typo\'s`)
        }
        return error(e)
      }
    });
  },

  Slots: function(UserID, Input, data = {}) {
    return dbQueue.addToQueue({
      "value": this._Slots.bind(this),
      "args": [UserID, Input, data]
    });
  },

  _Slots: async function(UserID, Input, data = {}) {
    if (!UserID || !Input) throw new Error('Slots function is missing parameters!')
    if (data.emojis && !Array.isArray(data.emojis)) throw new Error('Slots function parameter data.emojis needs to be an array!')
    if (!parseInt(Input)) throw new Error('Slots function parameter Input needs to be a number!')
    if (!data.width) data.width = 5
    if (!data.height) data.height = 3
    if (!data.emojis) data.emojis = ['🍎', '🍒', '🍉']
    if (parseInt(Input) < 0) throw new Error('Slots function parameter Input needs to be greater than 0')
    Input = parseInt(Input)

    return new Promise(async (resolve, error) => {

      var grid = [];
      for (r = 0; r < data.height; r++) {
        var row = []
        for (l = 0; l < data.width; l++) {
          row.push(data.emojis[Math.floor(Math.random() * data.emojis.length)])
        }
        grid.push(row)
      }

      const Info = await DB.findOne({
        where: {
          userID: UserID
        }
      });
      if (Info) {
        if (Info.balance < Input) {
          throw new Error('The user has insufficient funds.')
          return
        }

        function checkWin(board) {
          for (let r = 0; r < data.height; r++) //Horizontal
            if (data.width > 1 && board[r].every((val, i, arr) => val === arr[0])) return true;

          for (let r = 0; r < data.width; r++) //Vertical
            if (data.height > 1 && board.map(n => n[r]).every((val, i, arr) => val === arr[0])) return true;

          return false;
        }

        var win = await checkWin(grid)
        if (!win) {
          const Info2 = await DB.update({
            balance: Info.balance - Input
          }, {
            where: {
              userID: UserID
            }
          });
          if (Info2 > 0) {
            return resolve({
              userid: UserID,
              oldbalance: Info.balance,
              newbalance: Info.balance - Input,
              grid: grid,
              output: 'Perdiste'
            })
          }
          return error('Something went wrong in function Slots')
        } else {
          const Info3 = await DB.update({
            balance: Info.balance + Input
          }, {
            where: {
              userID: UserID
            }
          });
          if (Info3 > 0) {
            return resolve({
              userid: UserID,
              oldbalance: Info.balance,
              newbalance: Info.balance + Input,
              grid: grid,
              output: 'Ganaste'
            })
          }
          return error('Something went wrong in function Slots')
        }
      }
      throw new Error('The user has insufficient funds.')
    });
  }

}
