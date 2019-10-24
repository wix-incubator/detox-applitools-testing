const path = require('path');
const {spawn} = require('child_process');

module.exports = (screenshotsPath) => {
  return {
    getScreenshot: (id) => {
      return path.resolve(screenshotsPath, `./${id}.png`);
    },

    takeStoryScreenshot: (id) => {
      const screenshotFilePath = path.resolve(screenshotsPath, `./${id}.png`);

      const command = 'xcrun';
      const args = ['simctl', 'io', 'booted', 'screenshot', screenshotFilePath];
      return new Promise((resolve, reject) => {
        spawn(command, args).on('close', (code) => {
          if (code) {
            reject(new Error(`Command "${command} ${args.join(' ')}" exited with code ${code}`));
          }
          resolve(screenshotFilePath);
        });
      });
    },
  };
};

