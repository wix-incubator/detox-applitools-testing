import {device} from 'detox';
import {statusBarHeights, defaultHeight} from './status-bar';

export const getDeviceType = (): string => {
  return device.getPlatform();
};

export const getDeviceName = (): string => {
  return extractDeviceName(device.name);
};

export const getStatusBarHeight = (): number => {
  const deviceName = getDeviceName();
  const deviceInfo = Object.entries(statusBarHeights).find(([_height, devices]) => devices.indexOf(deviceName) !== -1);
  return deviceInfo ? Number(deviceInfo[0]) : defaultHeight;
};

export const takeScreenshot = (name: string): Promise<string> => {
  return device.takeScreenshot(name) as unknown as Promise<string>;
};

const DEVICE_NAME_REGEXP = new RegExp(/\((.*?)\)/);

const extractDeviceName = (fullDeviceName): string => {
  const matches = fullDeviceName.match(DEVICE_NAME_REGEXP);

  if (matches && matches.length === 2) {
    return matches[1];
  }

  console.error('Could not parse device name', fullDeviceName);
  return 'unknown';
};
