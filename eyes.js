const {Eyes} = require('@applitools/eyes-images');
const {ConsoleLogHandler} = require('@applitools/eyes-common');

let eyes = null;

module.exports = ({serverUrl, apiKey, batchId, appName, hostOS, hostApp}) => {
  if (!eyes) {
    eyes = new Eyes();

    eyes.setApiKey(apiKey);
    eyes.setHostOS(hostOS);
    eyes.setHostApp(hostApp);

    if (serverUrl) {
      eyes.setServerUrl(serverUrl);
    }

    eyes.setBatch(appName, batchId);
    eyes.setLogHandler(new ConsoleLogHandler(false));
  }

  return eyes;
};

