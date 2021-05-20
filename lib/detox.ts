import {device} from 'detox';
import {statusBarHeights, defaultHeight} from './status-bar';

export const getDeviceType = (): string => {
  return device.getPlatform();
};

export const getDeviceName = (): string => {
  return device.name;
};

export const getStatusBarHeight = (): number => {
  const deviceName = getDeviceName();
  const deviceInfo = Object.entries(statusBarHeights).find(([_height, devices]) => devices.indexOf(deviceName) !== -1);
  return deviceInfo ? Number(deviceInfo[0]) : defaultHeight;
};

export const takeScreenshot = (name: string): Promise<string> => {
  return (device.takeScreenshot(name) as unknown) as Promise<string>;
};
