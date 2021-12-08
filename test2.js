const { HttpClient, IPDiscovery } = require('hap-controller');
const { parseDevice, parseChannels } = require('./tools');

const discovery = new IPDiscovery();

const pairingData = {
  "AccessoryPairingID":"44433a32373a44453a32443a32453a3245","AccessoryLTPK":"4e288f03ae1b6458136d81f654cae5bf9d39e9ff82931f7af15f741b7a5daa99","iOSDevicePairingID":"38313438366533662d333763322d343632642d396362612d373863363465376239613737","iOSDeviceLTSK":"85dd15be023c23c19a656e7640cd403f2dc0b33628e51b8cace862d8e95e740e375d6ab82464d9810de82e50a8fbd11ef0d75a4f0852775359e3c315c1ccca4c","iOSDeviceLTPK":"375d6ab82464d9810de82e50a8fbd11ef0d75a4f0852775359e3c315c1ccca4c"
};


function search() {
  discovery.on('serviceUp', (service) => {
      console.log(service.id, service.name, service.address, service.port);

      if (service.id === 'DC:27:DE:2D:2E:2E') {
        console.log('Found device!');
        connect(service);
      }
  });
  discovery.start();
}

function force() {
  const service = {
    name: 'MSL120-2c15',
    id: 'DC:27:DE:2D:2E:2E',
    address: '192.168.0.133',
    port: '52432',
  }
  connect(service);
}

function connect(service) {
  const list = [];
  const client = new HttpClient(service.id, service.address, service.port, pairingData);


  parseDevice(service, pairingData)
    .then(data => {
      Object
        .keys(data.characteristics)
        .forEach(key => {
          const char = data.characteristics[key];

          if (char.perms.ev) {
            list.push(char.aid + '.' + char.iid);
            console.log(char.name, char.aid + '.' + char.iid)
          }
        });
      client.on('event', (ev) => {
        console.log(ev);
      })

      client.on('event-disconnect', (subscribedList) => {
        console.log('event-disconnect');
      });

      client
        .subscribeCharacteristics(list)
        .then((conn) => {
            console.log('Subscribed!');
            cmds(service);
        })
        .catch((e) => console.log(1, e));
    })
    .catch(e => console.log(2, e));
}


function cmds(service) {
  const client = new HttpClient(service.id, service.address, service.port, pairingData);
  client
  .setCharacteristics({
    '1.53': random(0, 360),
  })
  .then(() => {
    console.log('Done!!!')
    setInterval(() => cmd(client), 250);
  })
}

function cmd(client) {
  client
    .setCharacteristics({
      '1.53': random(0, 360),
    })
    .then(() => console.log('Done!'))
    .catch((e) => console.log(3, e));
  client
    .setCharacteristics({
      '1.52': random(10, 100),
    })
    .then(() => console.log('Done!'))
    .catch((e) => console.log(4,e));
  client
    .setCharacteristics({
      '1.54': random(10, 100),
    })
    .then(() => console.log('Done!'))
    .catch((e) => console.log(5,e));
}

function random(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //Максимум и минимум включаются
}


// search();

force();

