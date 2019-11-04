const path = require('path');
const packageJSON = require(path.resolve(process.cwd(), './package.json'));
const argparse = require('detox/src/utils/argparse');

module.exports = {
  _testDisabled: false,
  _eyes: null,
  _config: null,

  setup: (config) => {
    if (!config) {
      throw new Error('Detox applitools configuration is missing! \n Necessary configuration params: batchId, apiKey, appName, serverUrl');
    }

    const {batchId, apiKey, appName, serverUrl} = config;

    this._config = config;

    if (!apiKey) {
      console.warn('Screenshot testing is disabled');

      this._testDisabled = true;
      return;
    }


    const configurationName = argparse.getArgValue('configuration');
    const detox = packageJSON.detox.configurations[configurationName];
    this._eyes = require('./eyes')({batchId, appName, apiKey, serverUrl, hostOS: detox.type, hostApp: detox.name || (typeof detox.device === 'string' ? detox.device : detox.device.name)});
  },

  testScreenshot: async (id, options = {}) => {
    if (this._testDisabled) {
      return;
    }

    const screenshotPath = await device.takeScreenshot(id);

    await this._eyes.open(this._config.appName || 'APP_NAME_NOT_SET', id);

    await this._eyes.checkRegion(screenshotPath, {
      left: 0,
      top: options.ignoredTopHeight === undefined ? 44 : options.ignoredTopHeight,
      width: 5000,
      height: 5000,
    }, id);

    await this._eyes.close();
  }
};
