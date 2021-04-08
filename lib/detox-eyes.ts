import {Eyes} from '@applitools/eyes-images';
import {ScreenshotOptions} from './types';

export class DetoxEyes extends Eyes {
  private screenshotOptions?: ScreenshotOptions;

  constructor(serverUrl: string, isDisabled: boolean) {
    super(serverUrl, isDisabled);
  }

  setScreenshotOptions = (options: ScreenshotOptions) => {
    this.screenshotOptions = {...this.screenshotOptions, ...options};
  };

  testScreenshot = (id: string, path: string) => {
    const regionTop = this.screenshotOptions.ignoredTopHeight ?? 0;
    const region = {left: 0, top: regionTop, width: 5000, height: 5000};

    return this.checkRegion(path, region, id);
  };

  getUpdatedTestResult = async (testResult: any, screenshotPath: string) => {
    // Applitools does not support obtaining updated test status after test finishes running :(
    // Current implementation is based on retesting same screenshot again and then deleting the new result

    await this.open(this.getAppName(), testResult.getName());
    await this.testScreenshot(testResult.getName(), screenshotPath);

    const newResult = await this.close(false);
    await newResult.deleteSession();

    return newResult;
  };
}
