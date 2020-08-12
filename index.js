const path = require('path');
const packageJSON = require(path.resolve(process.cwd(), './package.json'));
const argparse = require('detox/src/utils/argparse');

const statusBarHeights = {
  44: ['iPhone 5', 'iPhone 5S', 'iPhone 5C', 'iPhone SE', 'iPhone 4', 'iPhone 4S','iPhone 6', 'iPhone 6S', 'iPhone 7', 'iPhone 8', 'iPhone 6 Plus', 'iPhone 6S Plus', 'iPhone 7 Plus', 'iPhone 8 Plus'],
  62: ['iPhone Xʀ', 'iPhone 11'],
  87: ['iPhone Xs Max', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone X', 'iPhone Xs'],
};

module.exports = {
  _testDisabled: false,
  _eyes: null,
  _config: null,
  _statusBarHeight: 0,

  setup: (config) => {
    if (!config) {
      throw new Error('Detox applitools configuration is missing! \n Necessary configuration params: batchId, apiKey, appName, serverUrl');
    }

    const {batchId, apiKey, appName, serverUrl, branchName, parentBranchName} = config;

    this._config = config;

    if (!apiKey) {
      console.warn('Screenshot testing is disabled');

      this._testDisabled = true;
      return;
    }

    const configurationName = argparse.getArgValue('configuration');
    const detox = packageJSON.detox.configurations[configurationName];

    this._deviceName = detox.name || (typeof detox.device === 'string' ? detox.device : detox.device.name);
    const deviceInfo = Object.entries(statusBarHeights).find(([_height, devices]) => devices.indexOf(this._deviceName) !== -1);

    this._statusBarHeight = deviceInfo ? deviceInfo[0] : 44;
    this._eyes = require('./eyes')({batchId, appName, apiKey, serverUrl, branchName, parentBranchName, hostOS: detox.type, hostApp: this._deviceName});
  },

  testScreenshot: async (id, options = {}) => {
    if (this._testDisabled) {
      return;
    }

    const screenshotPath = options.screenshotPath || await device.takeScreenshot(id);

    await this._eyes.open(this._config.appName || 'APP_NAME_NOT_SET', id);

    await this._eyes.checkRegion(screenshotPath, {
      left: 0,
      top: parseInt(options.ignoredTopHeight === undefined ? this._statusBarHeight : options.ignoredTopHeight),
      width: 5000,
      height: 5000,
    }, id);

    await this._eyes.close();
  }
};
