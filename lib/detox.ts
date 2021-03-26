import * as path from 'path';
import {device} from 'detox';
import * as argparse from 'detox/src/utils/argparse';
import {statusBarHeights, defaultHeight} from './status-bar';

export const getDeviceType = (): string => {
  const config = getDetoxConfig();
  return config.type;
};

export const getDeviceName = (): string => {
  const {name, device} = getDetoxConfig();
  return name || (typeof device === 'string' ? device : device.name);
};

export const getStatusBarHeight = (): number => {
  const deviceName = getDeviceName();
  const deviceInfo = Object.entries(statusBarHeights).find(([_height, devices]) => devices.indexOf(deviceName) !== -1);
  return deviceInfo ? Number(deviceInfo[0]) : defaultHeight;
};

export const takeScreenshot = (name: string): Promise<string> => {
  return (device.takeScreenshot(name) as unknown) as Promise<string>;
};

const getDetoxConfig = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJSON = require(path.resolve(process.cwd(), './package.json'));
  const configurationName = argparse.getArgValue('configuration');
  return packageJSON.detox.configurations[configurationName];
};
