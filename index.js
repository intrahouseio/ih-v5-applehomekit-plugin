const util = require('util');
const plugin = require('ih-plugin-api')();
const Scanner = require('./lib/scanner');

const { IPDiscovery, HttpClient } = require('hap-controller');
const { parseDevice, parseChannels } = require('./tools');

let scanner;
let isScan = false;

let opt = {};
let settings = {};
let channels = {};

let mainData = {};
let mainSubs = {};

let scanData = {};
let scanSubs = {};
let scanConnections = [];

let pairingStore = {};


const ipDiscovery = new IPDiscovery();
const scanDiscovery = new IPDiscovery();


async function main() {
  opt = plugin.opt;
  scanner = new Scanner(plugin);
  settings = await plugin.params.get();
  channels = parseChannels(await plugin.channels.get());

  const persistents = await plugin.persistent.get('all');
  
  Object
    .keys(persistents)
    .forEach(key => {
      try {
        pairingStore[key] = JSON.parse(persistents[key]);
      } catch {

      }
    });

  ipDiscovery.on('serviceUp', (device) => {
    if (channels[device.id] && mainData[device.id] === undefined) {
      mainData[device.id] = device;

      if (device.availableToPair) {
        plugin.log(`Device found ${device.id} - ${device.name}`);
        plugin.log(`  error: Device pairing has been reset!`);
      } else {
        if (pairingStore[device.id]) {
          parseDevice(device, pairingStore[device.id])
            .then(item => {
              plugin.log(`Device connected ${device.id} - ${device.name}`);
              plugin.log(`  data: accessories - ${item.accessories.length}, services - ${item.services.length}, characteristics - ${Object.keys(item.characteristics).length}`);
              
              mainData[device.id] = {
                ...mainData[device.id],
                ...item,
              };

              subDevice(device.id)
            })
            .catch((e) => {
              plugin.log(`Device found ${device.id} - ${device.name}`)
              plugin.log(`  error: Connection response failed (${e.message}) or wrong pairing data!`);
            }); 
        } else {
          plugin.log(`Device found ${device.id} - ${device.name}`);
          plugin.log(`  error: Device is not paired!`);
        }
      } 
      checkDiscovery();
    }
  })

  ipDiscovery.start();
}

function checkDiscovery() {
  let isStop = true;

  Object
    .keys(channels)
    .forEach(did => {
      if (mainData[did] === undefined) {
        isStop = false;
      }
    })

  if (isStop) {
    ipDiscovery.stop();
  }
}

function disconnectDevice(did) {
  const device = mainData[did];

  plugin.log(`Device disconnect ${device.id} - ${device.name}`);

  delete mainData[device.id];
  ipDiscovery.start();
}

function subDevice(did) {
  const values = [];
  const sub = [];
  const device = mainData[did];

  const ipClient = new HttpClient(device.id, device.address, device.port, pairingStore[device.id]);

  Object
    .keys(device.characteristics)
    .forEach(iid => {
      const characteristic = device.characteristics[iid];
      if (channels[device.id][characteristic.topic]) {
        if (characteristic.perms.ev) {
          mainSubs[`${device.id}_${characteristic.aid}_${characteristic.iid}`] = device.characteristics[iid];
          sub.push(`${characteristic.aid}.${characteristic.iid}`)
        }
        const value = characteristic.format === 'bool' ? (characteristic.value ? 1 : 0) : characteristic.value
        values.push({ id: characteristic.topic, value: value });
      }
    })

  ipClient.on('event', (e) => {
    if (e.characteristics !== undefined) {
      e.characteristics
        .forEach(item => {
          const characteristic = mainSubs[`${device.id}_${item.aid}_${item.iid}`];
          if (characteristic !== undefined) {
            characteristicDeviceData(device, characteristic, item.value);
          }
        });
    }
  });
  
  ipClient.on('event-disconnect', (list) => {
    disconnectDevice(device.id);
  });

  ipClient.subscribeCharacteristics(sub)
    .then((conn) => {
      plugin.log(`Device sub ${device.id} - ${device.name}: OK!`);
      plugin.log(`  quantity: characteristics - ${sub.length}`);
    })
    .catch((e) => {
      plugin.log(`Device sub   ${device.id} - ${device.name}: FAILED!`);
      plugin.log(`  error: ${e.message}`);
    });
  plugin.sendData(values);
}

function characteristicDeviceData(device, characteristic, v) {
  const value = characteristic.format === 'bool' ? (v ? 1 : 0) : v
  plugin.sendData([{ id: characteristic.topic, value: value }]);
}

plugin.onAct(message => {
  if (!message.data) return;
    message.data.forEach(item => {
      try {
        plugin.log('PUBLISH command ' + util.inspect(item));

        if (item.id) {
          const did = item.id.split('/')[0];
          if (mainData[did] !== undefined) {
            const device = mainData[did];

            Object
              .keys(device.characteristics)
              .forEach(key => {
                const characteristic = device.characteristics[key];
                if (characteristic.topic === item.id) {
                  if (mainData[did].connection === undefined) {
                    mainData[did].connection = new HttpClient(device.id, device.address, device.port, pairingStore[device.id]);
                  }
                  const ipClient = mainData[did].connection;
                  ipClient
                    .setCharacteristics({ [`${characteristic.aid}.${characteristic.iid}`]: item.value })
                    .then(() => {})
                    .catch((e) => plugin.log(e.message));
                }
              })
          }
        }
      } catch (e) {
        const errStr = 'ERROR Act: ' + util.inspect(e) + ' /n message.data item: ' + util.inspect(item);
        plugin.log(errStr);
      }
    });
});

plugin.onScan(scanObj => {
  if (scanObj.uuid && scanObj.start) {
    scanner.request(scanObj);
    scannerStart();
  }

  if (scanObj.stop) {
    scannerStop();
    scanner.stop();
  }

  if (scanObj.method === 'scandata' && scanObj.button) {
    if (scanObj.button.prop === 'pair') {
      pairingDevice(scanObj);
    }
    if (scanObj.button.prop === 'unpair') {
      unpairingDevice(scanObj);
    }
    if (scanObj.button.prop === 'clearpair') {
      clearpairingDevice(scanObj);
    }
  }
});

scanDiscovery.on('serviceUp', (device) => {
  if (device.availableToPair) {
    scanDiscovery
      .getPairMethod(device)
      .then(pairMethod => {
        device.pairMethod = pairMethod;
        device.pairToPlugin = pairingStore[device.id] ? true : false;
        device.pincode = '000-00-00';
        scanData[device.id] = device;
        foundScanDevice(device.id);
      });
  } else {
    device.pairToPlugin = pairingStore[device.id] ? true : false;
    device.pincode = '000-00-00';
    scanData[device.id] = device;
    foundScanDevice(device.id);
  }
});

function scannerStart() {
  if (isScan === false) {
    isScan = true;
    scanDiscovery.start();
  } else {
    
  }
}

function scannerStop() {
  isScan = false;
  scanDiscovery.stop();

  scanConnections.forEach(i => {
    i.removeAllListeners();
  })

  scanData = {};
  scanConnections = [];
}

function checkPinCode(code = '') {
  const str = code.trim().replace(/-/g, '');
  return `${str.slice(0, 3)}-${str.slice(3, 5)}-${str.slice(5, 8)}` ;
}

async function pairingDevice(data) {
  if (scanData[data.payload.p1.id]) {
    const device = scanData[data.payload.p1.id];
    const pincode = data.payload.p2.pincode;
  
    plugin.send({ 
      type:'scan', scanid:'root', op:'form_update',
      nodeid: data.nodeid,
      data: { ispair: true } 
    })
  
    try {
       const pairMethod = await scanDiscovery.getPairMethod(device);
  
       const client = new HttpClient(device.id, device.address, device.port);
       await client.pairSetup(checkPinCode(pincode), pairMethod)
  
       pairingStore[device.id] = client.getLongTermData();

       
       device.pairToPlugin = true;
       device.availableToPair = false;

       plugin.persistent.set({ file: device.id, data: JSON.stringify(pairingStore[device.id]) });
       plugin.log(`Pair device complete ${device.id} - ${device.name}`);

       plugin.send({ uuid: data.uuid, type:'scan', scanid:'root', op:'alert', variant: 'success', message: `Pair device complete ${device.id} - ${device.name}`, data: {} })
       plugin.send({ 
        type:'scan', scanid:'root', op:'form_update',
        nodeid: data.nodeid,
        data: { ispair: false, pairToPlugin: true, availableToPair: false } 
      })

      const items = await parseDevice(device, pairingStore[device.id]);
      scanData[device.id] = { ...scanData[device.id], ...items };

      sendScanData(device.id);
      subScanDevice(device.id);
      
      plugin.send({ type:'scan', scanid:'root', op:'expand', nodeid: data.nodeid, data: {} })
    } catch (e) {
      plugin.log(`Pair device fail ${device.id} - ${device.name}: ${e.message}`);
      plugin.send({ uuid: data.uuid, type:'scan', scanid:'root', op:'alert', variant: 'error', message: `Pair device fail ${device.id} - ${device.name}: ${e.message}`, data: {} })
      plugin.send({ 
        type:'scan', scanid:'root', op:'form_update',
        nodeid: data.nodeid,
        data: { ispair: false } 
      })
    }
  }
}

function unpairingDevice(data) {
  if (scanData[data.payload.p1.id]) {
    const device = scanData[data.payload.p1.id];

    if (pairingStore[device.id]) {
      plugin.send({ 
        type:'scan', scanid:'root', op:'form_update',
        nodeid: data.nodeid,
        data: { ispair: true } 
      })

      const client = new HttpClient(device.id, device.address, device.port, pairingStore[device.id]);

      client
        .removePairing(client.pairingProtocol.iOSDevicePairingID)
        .then(() => {
          delete pairingStore[device.id];
          plugin.persistent.set({ file: device.id, data: '' });

          plugin.log(`Unpair device complete ${device.id} - ${device.name}`);
          plugin.send({ uuid: data.uuid, type:'scan', scanid:'root', op:'alert', variant: 'success', message: `Unpair device complete ${device.id} - ${device.name}`, data: {} })
          plugin.send({ 
            type:'scan', scanid:'root', op:'form_update',
            nodeid: data.nodeid,
            data: { ispair: false, pairToPlugin: false, availableToPair: true } 
          })
          scanner.clearNodeChildren(data.nodeid);
          plugin.send({ type:'scan', scanid:'root', op: 'clear', nodeid: data.nodeid, data: {} })
        })
        .catch((e) => {
          plugin.log(`Unpair device fail ${device.id} - ${device.name}: ${e.message}`);
          plugin.send({ uuid: data.uuid, type:'scan', scanid:'root', op:'alert', variant: 'error', message: `Unpair device fail ${device.id} - ${device.name}: ${e.message}`, data: {} })
          plugin.send({ 
            type:'scan', scanid:'root', op:'form_update',
            nodeid: data.nodeid,
            data: { ispair: false } 
          })
        });
    }
  }
}

function clearpairingDevice(data) {
  if (scanData[data.payload.p1.id]) {
    const device = scanData[data.payload.p1.id];

    if (pairingStore[device.id]) {
      plugin.send({ 
        type:'scan', scanid:'root', op:'form_update',
        nodeid: data.nodeid,
        data: { ispair: true } 
      })

      delete pairingStore[device.id];
      plugin.persistent.set({ file: device.id, data: '' });

      plugin.log(`Clear pair to device ${device.id} - ${device.name}`);

      plugin.send({ uuid: data.uuid, type:'scan', scanid:'root', op:'alert', variant: 'success', message: `Clear pair to device ${device.id} - ${device.name}`, data: {} })
      plugin.send({ 
       type:'scan', scanid:'root', op:'form_update',
       nodeid: data.nodeid,
       data: { ispair: false, pairToPlugin: false } 
     })
    }
  }
}

function sendScanData(did) {
  if (scanner.status > 0) {
    Object
      .keys(scanData)
      .forEach(id => {
        const device = scanData[id];
        if (device.id === did) {
          const payload = {
            name: device.name,
            address: device.address,
            port: device.port,
            id: device.id,
            md: device.md,
            availableToPair: device.availableToPair,
            pairToPlugin: device.pairToPlugin,
            pincode: device.pincode,
          };
          const data = { title: device.name, component:'formPluginHub', payload };

          scanner.process(device.id, data, device.name);

          if (device.characteristics) {
            Object
            .keys(device.characteristics)
            .forEach(cid => {
              const characteristic = device.characteristics[cid];
              const value = characteristic.format === 'bool' ? (characteristic.value ? 1 : 0) : characteristic.value;
              scanner.process(characteristic.topic,  value, characteristic.topic2, plugin);
            })
          }
        }
      })
  }
}

async function foundScanDevice(did) {
  const device = scanData[did];
  plugin.log(`Found device ${device.id} - ${device.name}`);

  if (device.availableToPair == false && device.pairToPlugin) {
    parseDevice(device, pairingStore[device.id])
      .then(items => {
        scanData[did] = {
          ...scanData[did],
          ...items,
        };
        sendScanData(did);
        subScanDevice(did);
      })
      .catch((e) => {
        plugin.log(`Device connection failed ${device.id} - ${device.name}: ${e.message}`);
        delete pairingStore[device.id];
        plugin.persistent.set({ file: device.id, data: '' });
        device.pairToPlugin = false;
        plugin.log(e.message);

        sendScanData(did);
      });
  } else {
    if (device.pairToPlugin) {
    //  delete pairingStore[device.id];
    //  await plugin.persistent.set({ file: device.id, data: '' });
    //  device.pairToPlugin = false;
    }
    sendScanData(did);
  }
}

function subScanDevice(did) {
  const sub = [];
  const device = scanData[did];
  const ipClient = new HttpClient(device.id, device.address, device.port, pairingStore[device.id]);

  Object
    .keys(device.characteristics)
    .forEach(iid => {
      const characteristic = device.characteristics[iid];
      if (characteristic.perms.ev) {
        scanSubs[`${device.id}_${characteristic.aid}_${characteristic.iid}`] = device.characteristics[iid];
        sub.push(`${characteristic.aid}.${characteristic.iid}`)
      }
    })

  ipClient.on('event', (e) => {
    plugin.log('characteristics event: ' + JSON.stringify(e))
    if (e.characteristics !== undefined) {
      e.characteristics
        .forEach(item => {
          const characteristic = scanSubs[`${device.id}_${item.aid}_${item.iid}`];
          if (characteristic !== undefined) {
            characteristicScanDeviceData(device, characteristic, item.value);
          }
        });
    }
  });

  ipClient.subscribeCharacteristics(sub)
    .then((conn) => {
      plugin.log(`Device sub ${device.id} - ${device.name}: OK!`);
      plugin.log(`  quantity: characteristics - ${sub.length}`);
    })
    .catch((e) => {
      plugin.log(`Device sub   ${device.id} - ${device.name}: FAILED!`);
      plugin.log(`  error: ${e.message}`);
    });
  scanConnections.push(ipClient);
}

function characteristicScanDeviceData(device, characteristic, v) {
  const value = characteristic.format === 'bool' ? (v ? 1 : 0) : v

  if (scanner.status > 0) {
    scanner.process(characteristic.topic,  value);
  }
}



main();
