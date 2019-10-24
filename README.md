<h1 align="center">Detox Applitools Testing</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-0.0.1-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/wix/detox-applitools-testing#readme">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" target="_blank" />
  </a>
  <a href="https://github.com/wix/detox-applitools-testing/graphs/commit-activity">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" target="_blank" />
  </a>
  <a href="https://github.com/wix/detox-applitools-testing/blob/master/LICENSE">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" target="_blank" />
  </a>
</p>

> This is a helper project which allows you to add screeshot tests for your Detox tests using Applitools.

### 🏠 [Homepage](https://github.com/wix/detox-applitools-testing#readme)

## Install

```sh
npm install detox-applitools-testing
```
## Setup

Inside your Detox entry (usually `index.js` file in `e2e/index.js`) add following lines:

```javascript
import {setup, cleanup} from 'detox-applitools-testing';

before(async () => {
  ...
  setup({
    apiKey: 'EYES_API_KEY', //Your key from applitools,
    appName: 'Your app Name',
    serverUrl: 'applitools server url', //Optional, leave empty if not using custom server
    batchId: 'Unique batch number, can simply be uuid.v4()',
    detoxConfig: 'ios-simulator.debug'
  });
});


after(async () => {
  ...
  cleanup();
});

```

## Usage

To use screenshot testing inside your tests:

```javascript
import {testScreenshot} from 'detox-applitools-testing';

describe('...', () => {

  it('...', () => {
    ...
    testScreenshot('Unique test case');
  });

});
```

## testScreenshot
By default testScreenshot cuts off 44 pixels from the screenshot to hide the clock. You can disable it by using: `testScreenshot('TEST_ID', {ignoredTopHeight: 0})`

## 🤝 Contributing
Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/wix/detox-applitools-testing/issues).

## 📝 License

This project is [MIT](https://github.com/wix/detox-applitools-testing/blob/master/LICENSE) licensed.
