const { HttpClient } = require('hap-controller');


function parseDevice(device, pairingData) {
  return new Promise((resolve, reject) => {
    const temp = {};

    const ipClient = new HttpClient(device.id, device.address, device.port, pairingData);
  
    ipClient
      .getAccessories()
      .then((data) => {
        if (data.accessories !== undefined && data.accessories.length) {
          const accessories = data.accessories;
          accessories.forEach(accessory => {
            const aid = accessory.aid;
            if (accessory.services !== undefined && accessory.services.length) {
              accessory.services.forEach(service => {
                if (service.characteristics !== undefined && service.characteristics.length) {
                  service.characteristics.forEach(characteristic => {
                    if (temp[aid] === undefined) {
                      temp[aid] = { services: {} };
                    }
                  
                    if (temp[aid].services[service.iid] === undefined) {
                      temp[aid].services[service.iid] = { props: {}, name: service.description || characteristicNames[service.type.toLocaleLowerCase()] };
                    }
                    const charName = characteristic.description || characteristicNames[characteristic.type.toLocaleLowerCase()];
                    if (service.type === '0000003E-0000-1000-8000-0026BB765291') {
                      if (characteristic.type === '00000023-0000-1000-8000-0026BB765291') {
                        temp[aid].name = characteristic.value;
                      }
                      if (characteristic.type === '00000030-0000-1000-8000-0026BB765291') {
                        temp[aid].serialNumber = characteristic.value;
                      }
                    } else {
                      if (characteristic.type === '00000023-0000-1000-8000-0026BB765291') {
                        temp[aid].services[service.iid].name = characteristic.value;
                      } else {
                        temp[aid].services[service.iid].props[characteristic.iid] = characteristic;
                        temp[aid].services[service.iid].props[characteristic.iid].name = charName || characteristic.type.replace('-0000-1000-8000-0026BB765291', '');
                        temp[aid].services[service.iid].props[characteristic.iid].perms = characteristic.perms.reduce((p, c) => ({ ...p, [c]: true }), {});
                      }
                    }
                  })
                }
              });
            }
          });
        }
        resolve(structData(device.id, device.name, temp));
      })
      .catch((e) => reject(e)); 
  });  
}

function structData(did, dname, data) {
  const checks = {};
  const temp = {
    accessories: [],
    services: [],
    characteristics: {},
  };
  Object
    .keys(data)
    .forEach(aid => {
      if (data[aid].name !== undefined) {
        const accessory = { 
          aid, 
          name: data[aid].name, 
          sn: data[aid].serialNumber 
        };
        Object
        .keys(data[aid].services)
        .forEach(sid => {
          const service = { 
            aid,
            iid: sid, 
            name: data[aid].services[sid].name
          };
          if (data[aid].services[sid].name !== undefined) {
            Object
            .keys(data[aid].services[sid].props)
            .forEach(iid => {
              if (checks[aid] === undefined) {
                checks[aid] = true;
                temp.accessories.push(accessory);
              }
              if (checks[aid + '_' + sid] === undefined) {
                checks[aid + '_' + sid] = true;
                if (accessory.services === undefined) {
                  accessory.services = [];
                }
                accessory.services.push(service);
                temp.services.push(service);
              }
              if (service.characteristics === undefined) {
                service.characteristics = [];
              }
              temp.characteristics[aid + '_' + iid] = data[aid].services[sid].props[iid];
              temp.characteristics[aid + '_' + iid].did = did;
              temp.characteristics[aid + '_' + iid].aid = aid;
              temp.characteristics[aid + '_' + iid].sid = sid;
              temp.characteristics[aid + '_' + iid].accessory = accessory;
              temp.characteristics[aid + '_' + iid].service = service;
              temp.characteristics[aid + '_' + iid].topic = `${cn(did)}/${cn(accessory.name)}-${cn(accessory.sn)}/${cn(service.name)}/${cn(temp.characteristics[aid + '_' + iid].name)}`,
              temp.characteristics[aid + '_' + iid].topic2 = `${cn(dname)}/${cn(accessory.name)}-${cn(accessory.sn)}/${cn(service.name)}/${cn(temp.characteristics[aid + '_' + iid].name)}`,
              service.characteristics.push(temp.characteristics[aid + '_' + iid])
            });
          }
        });
      }
    });
  return temp;
}

function parseChannels(data) {
  const temp = {};

  data.forEach(i => {
    const parse = i.id.split('/');
    const did = parse[0];

    if (temp[did] === undefined) {
      temp[did] = {};
    }

    temp[did][i.id] = true;
  })

  return temp;
}

const suffix = '-0000-1000-8000-0026BB765291'.toLocaleLowerCase();

const characteristicNames = {
  ['00000001' + suffix]: 'AdministratorOnlyAccess',
  ['00000005' + suffix]: 'AudioFeedback',
  ['00000008' + suffix]: 'Brightness',
  ['0000000d' + suffix]: 'CoolingThresholdTemperature',
  ['0000000e' + suffix]: 'CurrentDoorState',
  ['0000000f' + suffix]: 'CurrentHeatingCoolingState',
  ['00000010' + suffix]: 'CurrentRelativeHumidity',
  ['00000011' + suffix]: 'CurrentTemperature',
  ['00000012' + suffix]: 'HeatingThresholdTemperature',
  ['00000013' + suffix]: 'Hue',
  ['00000014' + suffix]: 'Identify',
  ['00000019' + suffix]: 'LockControlPoint',
  ['0000001a' + suffix]: 'LockManagementAutoSecurityTimeout',
  ['0000001c' + suffix]: 'LockLastKnownAction',
  ['0000001d' + suffix]: 'LockCurrentState',
  ['0000001e' + suffix]: 'LockTargetState',
  ['0000001f' + suffix]: 'Logs',
  ['00000020' + suffix]: 'Manufacturer',
  ['00000021' + suffix]: 'Model',
  ['00000022' + suffix]: 'MotionDetected',
  ['00000023' + suffix]: 'Name',
  ['00000024' + suffix]: 'ObstructionDetected',
  ['00000025' + suffix]: 'On',
  ['00000026' + suffix]: 'OutletInUse',
  ['00000028' + suffix]: 'RotationDirection',
  ['00000029' + suffix]: 'RotationSpeed',
  ['0000002f' + suffix]: 'Saturation',
  ['00000030' + suffix]: 'SerialNumber',
  ['00000032' + suffix]: 'TargetDoorState',
  ['00000033' + suffix]: 'TargetHeatingCoolingState',
  ['00000034' + suffix]: 'TargetRelativeHumidity',
  ['00000035' + suffix]: 'TargetTemperature',
  ['00000036' + suffix]: 'TemperatureDisplayUnits',
  ['00000037' + suffix]: 'Version',
  ['0000004c' + suffix]: 'PairSetup',
  ['0000004e' + suffix]: 'PairVerify',
  ['0000004f' + suffix]: 'PairingFeatures',
  ['00000050' + suffix]: 'PairingPairings',
  ['00000052' + suffix]: 'FirmwareRevision',
  ['00000053' + suffix]: 'HardwareRevision',
  ['00000064' + suffix]: 'AirParticulateDensity',
  ['00000065' + suffix]: 'AirParticulateSize',
  ['00000066' + suffix]: 'SecuritySystemCurrentState',
  ['00000067' + suffix]: 'SecuritySystemTargetState',
  ['00000068' + suffix]: 'BatteryLevel',
  ['00000069' + suffix]: 'CarbonMonoxideDetected',
  ['0000006a' + suffix]: 'ContactSensorState',
  ['0000006b' + suffix]: 'CurrentAmbientLightLevel',
  ['0000006c' + suffix]: 'CurrentHorizontalTiltAngle',
  ['0000006d' + suffix]: 'CurrentPosition',
  ['0000006e' + suffix]: 'CurrentVerticalTiltAngle',
  ['0000006f' + suffix]: 'HoldPosition',
  ['00000070' + suffix]: 'LeakDetected',
  ['00000071' + suffix]: 'OccupancyDetected',
  ['00000072' + suffix]: 'PositionState',
  ['00000073' + suffix]: 'ProgrammableSwitchEvent',
  ['00000075' + suffix]: 'StatusActive',
  ['00000076' + suffix]: 'SmokeDetected',
  ['00000077' + suffix]: 'StatusFault',
  ['00000078' + suffix]: 'StatusJammed',
  ['00000079' + suffix]: 'StatusLowBattery',
  ['0000007a' + suffix]: 'StatusTampered',
  ['0000007b' + suffix]: 'TargetHorizontalTiltAngle',
  ['0000007c' + suffix]: 'TargetPosition',
  ['0000007d' + suffix]: 'TargetVerticalTiltAngle',
  ['0000008e' + suffix]: 'SecuritySystemAlarmType',
  ['0000008f' + suffix]: 'ChargingState',
  ['00000090' + suffix]: 'CarbonMonoxideLevel',
  ['00000091' + suffix]: 'CarbonMonoxidePeakLevel',
  ['00000092' + suffix]: 'CarbonDioxideDetected',
  ['00000093' + suffix]: 'CarbonDioxideLevel',
  ['00000094' + suffix]: 'CarbonDioxidePeakLevel',
  ['00000095' + suffix]: 'AirQuality',
  ['000000a5' + suffix]: 'ServiceSignature',
  ['000000a6' + suffix]: 'AccessoryFlags',
  ['000000a7' + suffix]: 'LockPhysicalControls',
  ['000000a8' + suffix]: 'TargetAirPurifierState',
  ['000000a9' + suffix]: 'CurrentAirPurifierState',
  ['000000aa' + suffix]: 'CurrentSlatState',
  ['000000ab' + suffix]: 'FilterLifeLevel',
  ['000000ac' + suffix]: 'FilterChangeIndication',
  ['000000ad' + suffix]: 'ResetFilterIndication',
  ['000000af' + suffix]: 'CurrentFanState',
  ['000000b0' + suffix]: 'Active',
  ['000000b1' + suffix]: 'CurrentHeaterCoolerState',
  ['000000b2' + suffix]: 'TargetHeaterCoolerState',
  ['000000b3' + suffix]: 'CurrentHumidifierDehumidifierState',
  ['000000b4' + suffix]: 'TargetHumidifierDehumidifierState',
  ['000000b5' + suffix]: 'WaterLevel',
  ['000000b6' + suffix]: 'SwingMode',
  ['000000bf' + suffix]: 'TargetFanState',
  ['000000c0' + suffix]: 'SlatType',
  ['000000c1' + suffix]: 'CurrentTiltAngle',
  ['000000c2' + suffix]: 'TargetTiltAngle',
  ['000000c3' + suffix]: 'OzoneDensity',
  ['000000c4' + suffix]: 'NitrogenDioxideDensity',
  ['000000c5' + suffix]: 'SulphurDioxideDensity',
  ['000000c6' + suffix]: 'PM2_5Density',
  ['000000c7' + suffix]: 'PM10Density',
  ['000000c8' + suffix]: 'VOCDensity',
  ['000000c9' + suffix]: 'RelativeHumidityDehumidifierThreshold',
  ['000000ca' + suffix]: 'RelativeHumidityHumidifierThreshold',
  ['000000cb' + suffix]: 'ServiceLabelIndex',
  ['000000cd' + suffix]: 'ServiceLabelNamespace',
  ['000000ce' + suffix]: 'ColorTemperature',
  ['000000d1' + suffix]: 'ProgramMode',
  ['000000d2' + suffix]: 'InUse',
  ['000000d3' + suffix]: 'SetDuration',
  ['000000d4' + suffix]: 'RemainingDuration',
  ['000000d5' + suffix]: 'ValveType',
  ['000000d6' + suffix]: 'IsConfigured',
  ['000000e7' + suffix]: 'ActiveIdentifier',
  ['00000114' + suffix]: 'SupportedVideoStreamConfiguration',
  ['00000115' + suffix]: 'SupportedAudioStreamConfiguration',
  ['00000116' + suffix]: 'SupportedRTPConfiguration',
  ['00000117' + suffix]: 'SelectedRTPStreamConfiguration',
  ['00000118' + suffix]: 'SetupEndpoints',
  ['00000119' + suffix]: 'Volume',
  ['0000011a' + suffix]: 'Mute',
  ['0000011b' + suffix]: 'NightVision',
  ['0000011c' + suffix]: 'OpticalZoom',
  ['0000011d' + suffix]: 'DigitalZoom',
  ['0000011e' + suffix]: 'ImageRotation',
  ['0000011f' + suffix]: 'ImageMirroring',
  ['00000120' + suffix]: 'StreamingStatus',
  ['00000123' + suffix]: 'TargetControlSupportedConfiguration',
  ['00000124' + suffix]: 'TargetControlList',
  ['00000126' + suffix]: 'ButtonEvent',
  ['00000128' + suffix]: 'SelectedAudioStreamConfiguration',
  ['00000130' + suffix]: 'SupportedDataStreamTransportConfiguration',
  ['00000131' + suffix]: 'SetupDataStreamTransport',
  ['00000132' + suffix]: 'SiriInputType',
  ['0000003e' + suffix]: 'AccessoryInformation',
  ['00000041' + suffix]: 'GarageDoorOpener',
  ['00000043' + suffix]: 'LightBulb',
  ['00000043' + suffix]: 'Lightbulb',
  ['00000044' + suffix]: 'LockManagement',
  ['00000045' + suffix]: 'LockMechanism',
  ['00000047' + suffix]: 'Outlet',
  ['00000049' + suffix]: 'Switch',
  ['0000004a' + suffix]: 'Thermostat',
  ['00000055' + suffix]: 'Pairing',
  ['0000007e' + suffix]: 'SecuritySystem',
  ['0000007f' + suffix]: 'CarbonMonoxideSensor',
  ['00000080' + suffix]: 'ContactSensor',
  ['00000081' + suffix]: 'Door',
  ['00000082' + suffix]: 'HumiditySensor',
  ['00000083' + suffix]: 'LeakSensor',
  ['00000084' + suffix]: 'LightSensor',
  ['00000085' + suffix]: 'MotionSensor',
  ['00000086' + suffix]: 'OccupancySensor',
  ['00000087' + suffix]: 'SmokeSensor',
  ['00000089' + suffix]: 'StatelessProgrammableSwitch',
  ['0000008a' + suffix]: 'TemperatureSensor',
  ['0000008b' + suffix]: 'Window',
  ['0000008c' + suffix]: 'WindowCovering',
  ['0000008d' + suffix]: 'AirQualitySensor',
  ['00000096' + suffix]: 'BatteryService',
  ['00000097' + suffix]: 'CarbonDioxideSensor',
  ['000000a2' + suffix]: 'HAPProtocolInformation',
  ['000000b7' + suffix]: 'Fan',
  ['000000b7' + suffix]: 'FanV2',
  ['000000b9' + suffix]: 'Slat',
  ['000000ba' + suffix]: 'FilterMaintenance',
  ['000000bb' + suffix]: 'AirPurifier',
  ['000000bc' + suffix]: 'HeaterCooler',
  ['000000bd' + suffix]: 'HumidifierDehumidifier',
  ['000000cc' + suffix]: 'ServiceLabel',
  ['000000cf' + suffix]: 'IrrigationSystem',
  ['000000d0' + suffix]: 'Valve',
  ['000000d7' + suffix]: 'Faucet',
  ['00000110' + suffix]: 'CameraRTPStreamManagement',
  ['00000112' + suffix]: 'Microphone',
  ['00000113' + suffix]: 'Speaker',
};

function cn(name) {
  return name.replace(/\//g, '-');
}

module.exports = { 
  parseDevice,
  parseChannels,
  characteristicNames,
};
