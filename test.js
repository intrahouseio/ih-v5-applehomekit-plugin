const { fork } = require('child_process');
const os = require('os');


const options = {
  port: 8088,
  syspath: '/opt/ih-v5',
  hwid: '23a2cab6b81b02d18668fa676e8f3c4eb68577cb33f02be50774b4bfa742ae09-1110',
  logfile: '/opt/ih-v5/log/ih_apple_homekit.log',
  temppath: os.tmpdir(),
}

const params = { };
const channels = [
 
]

const devices = [];
const types = [];

const forked = fork('index.js', [JSON.stringify(options), 'debug']);

forked.on('message', (msg) => {
  if (msg.type === 'get' && msg.name === 'params') {
    forked.send({ ...msg, response: 1, data: params })
  } else if (msg.type === 'get' && msg.name === 'channels') {
    forked.send({ ...msg, response: 1, data: channels })
  } else if (msg.type === 'get' && msg.name === 'devices') {
    forked.send({ ...msg, response: 1, data: JSON.parse(devices) })
  } else if (msg.type === 'get' && msg.name === 'types') {
    forked.send({ ...msg, response: 1, data: JSON.parse(types) })
  } else {
    console.log(msg);
  }
});