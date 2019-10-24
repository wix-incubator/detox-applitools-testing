const {execSync} = require('child_process');
const {existsSync} = require('fs');
const path = require('path');
const screenshotUtilsFactory = require('./screenshots');
const packageJSON = require(path.resolve(process.cwd(), './package.json'));

module.exports = {
  _testDisabled: false,
  _eyes: null,
  _config: null,
  _screenshotPath: null,
  _screenshotUtils: null,

  setup: (config) => {
    if (!config) {

      throw new Error('Detox applitools configuration is missing! \n Necessary configuration params: detoxConfig, batchId, apiKey, appName, serverUrl');
    }

    const {detoxConfig, batchId, apiKey, appName, serverUrl} = config;

    this._config = config;

    if (!apiKey) {
      console.warn('Screenshot testing is disabled');

      this._testDisabled = true;
      return;
    }

    if (!detoxConfig) {
      throw new Error('Detox cofiguration is missing');
    }

    const detox = packageJSON.detox.configurations[detoxConfig];
    this._eyes = require('./eyes')({batchId, appName, apiKey, serverUrl, hostOS: detox.type, hostApp: detox.name});

    this._screenshotPath = execSync('mktemp -t dat -d').toString().trim();
    this._screenshotUtils = screenshotUtilsFactory(this._screenshotPath);
  },

  cleanup: () => {
    if (existsSync(this._screenshotPath)) {
      execSync('rm -rf ' + this._screenshotPath);
    }
  },

  testScreenshot: async (id, options = {}) => {
    if (this._testDisabled) {
      return;
    }

    await this._screenshotUtils.takeStoryScreenshot(id);
    await this._eyes.open(this._config.appName || 'APP_NAME_NOT_SET', id);

    await this._eyes.checkRegion(this._screenshotUtils.getScreenshot(id), {
      left: 0,
      top: options.ignoredTopHeight === undefined ? 44 : options.ignoredTopHeight,
      width: 5000,
      height: 5000,
    }, id);

    await this._eyes.close();
  }
};
