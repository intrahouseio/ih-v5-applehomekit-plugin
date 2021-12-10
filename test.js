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
  {"unit":"applehomekit","_id":"64dgRsyGCL","id":"C0:B0:6D:D7:86:DF/Contact Sensor-lumi.158d00016c3dea/Window and Door Sensor/ContactSensorState","parent":"OFSAa-b97L","title":"ContactSensorState","r":1,"did":"d0140","prop":"state"},
  {"unit":"applehomekit","_id":"JnZnghsLGM","id":"C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 1/On","parent":"Txe9z87YMD","title":"On","r":1,"w":1,"did":"d0130","prop":"state"},
  {"unit":"applehomekit","_id":"agyVJcIvFp","id":"C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 2/On","parent":"YhuABL_J7e","title":"On","r":1,"w":1,"did":"d0131","prop":"state"},
  {"unit":"applehomekit","_id":"9c5tj7N8s","id":"C0:B0:6D:D7:86:DF/Outlet-lumi.158d00019c9f2b/Outlet/On","parent":"tmyRAeq7sh","title":"On","r":1},
  {"unit":"applehomekit","_id":"rWFPA-UmiF","id":"C0:B0:6D:D7:86:DF/Outlet-lumi.158d00019c9f2b/Outlet/OutletInUse","parent":"tmyRAeq7sh","title":"OutletInUse","r":1,"w":1,"did":"","prop":""},
  {"unit":"applehomekit","_id":"rWFPA-UmiF","id":"C0:B0:6D:D7:86:DF/Outlet-lumi.158d00019c9f2b/Outlet/OutletInUse","parent":"tmyRAeq7sh","title":"OutletInUse","r":1,"w":0,"did":"","prop":""},
  {"unit":"applehomekit","_id":"9c5tj7N8s","id":"C0:B0:6D:D7:86:DF/Outlet-lumi.158d00019c9f2b/Outlet/On","parent":"tmyRAeq7sh","title":"On","r":1,"w":1},
  {"unit":"applehomekit","_id":"9c5tj7N8s","id":"C0:B0:6D:D7:86:DF/Outlet-lumi.158d00019c9f2b/Outlet/On","parent":"tmyRAeq7sh","title":"On","r":1,"w":1,"did":"d0132","prop":"state"},
  {"unit":"applehomekit","_id":"3MytZFo6pG","id":"C0:B0:6D:D7:86:DF/Temperature-Humidity Sensor-lumi.158d0001fa8897/Temperature Sensor/CurrentTemperature","parent":"K9zkay6gkd","title":"CurrentTemperature","r":1,"did":"d0143","prop":"value"},
  {"unit":"applehomekit","_id":"ThGBsRGWrA","id":"C0:B0:6D:D7:86:DF/Temperature-Humidity Sensor-lumi.158d0001fa8897/Humidity Sensor/CurrentRelativeHumidity","parent":"SWgar4nfEs","title":"CurrentRelativeHumidity","r":1,"did":"d0144","prop":"value"},
  {"unit":"applehomekit","_id":"PNg4taIByL","id":"EF:E4:3F:8F:2A:76/YLBulbColor1s-4DD8-393869045/YL bulb color 1s/Saturation","parent":"HQTknnkMpa","title":"Saturation","r":1,"w":1},
  {"unit":"applehomekit","_id":"T7GYmjdc6f","id":"EF:E4:3F:8F:2A:76/YLBulbColor1s-4DD8-393869045/YL bulb color 1s/Hue","parent":"HQTknnkMpa","title":"Hue","r":1,"w":1},
  {"unit":"applehomekit","_id":"gWb9qnjC0q","id":"EF:E4:3F:8F:2A:76/YLBulbColor1s-4DD8-393869045/YL bulb color 1s/Brightness","parent":"HQTknnkMpa","title":"Brightness","r":1,"w":1},
  {"unit":"applehomekit","_id":"9c5tj7N8s","id":"C0:B0:6D:D7:86:DF/Outlet-lumi.158d00019c9f2b/Outlet/On","parent":"tmyRAeq7sh","title":"On","r":1,"w":1,"did":"","prop":""}
]
     
const persistents = {
  '8F:96:59:2D:1F:A7': `{
    "AccessoryPairingID":"38463a39363a35393a32443a31463a4137","AccessoryLTPK":"b6f0339f980028a367030d9c93c7759b7f433bb90a85dfdc122552671642af58","iOSDevicePairingID":"65303936336631612d666564372d346366322d396531622d316262313930633166373062","iOSDeviceLTSK":"09e84c0e2b606452dbc71811fb6570a3872df6f2e72e83c1af9fea30e93c17dcaab96901e8513da2052c52a5b3753ea92632fd2dbbca1da913f919d0068fdc5e","iOSDeviceLTPK":"aab96901e8513da2052c52a5b3753ea92632fd2dbbca1da913f919d0068fdc5e"
  }`,
  'C0:B0:6D:D7:86:DF': `{
    "AccessoryPairingID":"43303a42303a36443a44373a38363a4446","AccessoryLTPK":"89d1423b7229b6e2b6d67b6a15c822e4dac29ded8fcc54a0c21e99cbbaf3ede9","iOSDevicePairingID":"63366365666330392d653766362d346338342d393630312d633864383437356564343330","iOSDeviceLTSK":"f483b4d7ba558fb632175e68c3d4b607b82f71f244bc17a7fb5366d57a955826dafa64de3b390cab16fc2a333ffc94a11ad9496e740449ec0ab12dbe039ad4ca","iOSDeviceLTPK":"dafa64de3b390cab16fc2a333ffc94a11ad9496e740449ec0ab12dbe039ad4ca"
  }`,
  'EF:E4:3F:8F:2A:76': `{
    "AccessoryPairingID":"45463a45343a33463a38463a32413a3736","AccessoryLTPK":"85498b69a9f4e98de671552c4c968d7442b13817266711574fd6340f433d0510","iOSDevicePairingID":"38356230373165322d383763302d343235342d613233322d333738316364643366653536","iOSDeviceLTSK":"45e96293e7d0405baa857f1fab4cca38dd2739b03c7ee97560bb640fc5ab151fc01a3a8277991a7fe34f5e02c8f5bdd3cab9e47f69e71390b3f6704c424144dd","iOSDeviceLTPK":"c01a3a8277991a7fe34f5e02c8f5bdd3cab9e47f69e71390b3f6704c424144dd"
  }`
}
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
  } else if (msg.type === 'get' && msg.name === 'persistent') {
    forked.send({ ...msg, response: 1, data: persistents })
  } else {
    console.log(msg);
  }
});

forked.on('error', (e) => {
  console.log('process error ' + e);
});


forked.on('uncaughtException', e => console.log('ERROR: uncaughtException: ' + util.inspect(e)));

forked.on('unhandledRejection', (reason, promise) =>
    console.log('ERROR: unhandledRejection: Reason ' + util.inspect(reason) + '. Promise ' + util.inspect(promise))
  );


setTimeout(() => {
  
  forked.send({
    type: 'act',
    data: [{
      chan: 'C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 1/On',
      r: 1,
      w: 1,
      did: 'd0130',
      prop: 'state',
      chanId: 'C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 1/On',
      value: 1, // Math.round(Math.random()),
      id: 'C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 1/On'
    }]
  })
  
  forked.send({
    type: 'act',
    data: [{
      chan: 'C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 2/On',
      r: 1,
      w: 1,
      did: 'd0130',
      prop: 'state',
      chanId: 'C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 2/On',
      value: 1, // Math.round(Math.random()),
      id: 'C0:B0:6D:D7:86:DF/Switch-lumi.158d00054ab741/Switch 2/On'
    }]
  })
}, 4000)



setTimeout(() => {
  console.log('try exit...')
  forked.kill('SIGTERM');
}, 10000)