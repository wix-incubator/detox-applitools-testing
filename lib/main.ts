import * as fs from 'fs';
import * as path from 'path';
import {ConsoleLogHandler} from '@applitools/eyes-common';
import {DetoxEyes} from './detox-eyes';
import {Config, ScreenshotOptions, TestReporter} from './types';
import {getDeviceName, getDeviceType, getStatusBarHeight, takeScreenshot} from './detox';

const ONE_MINUTE = 60 * 1000;
const DEFAULT_APPROVE_TIMEOUT = 10 * ONE_MINUTE;
const DEFAULT_APPROVE_CHECK_INTERVAL = ONE_MINUTE;

export interface TestDetails {
  screenshotPath: string;
  result: any;
  message?: string;
  options?: ScreenshotOptions;
}

export class DetoxApplitoolsTesting {
  private deviceName: string;
  private deviceType: string;
  private statusBarHeight = 0;
  private finishedTests: TestDetails[] = [];

  constructor(private config: Config, private reporter?: TestReporter) {
    if (!config) {
      throw new Error(
        'Detox applitools configuration is missing! \n Necessary configuration params: batchId, apiKey, appName, serverUrl',
      );
    }

    this.deviceType = getDeviceType();
    this.deviceName = getDeviceName();
    this.statusBarHeight = getStatusBarHeight();
  }

  setup = () => {
    this.reporter?.reportAllTestsStart?.();
  };

  testScreenshot = async (id: string, options?: ScreenshotOptions) => {
    const eyes = this.buildEyes();
    eyes.setScreenshotOptions(options);

    if (eyes.getIsDisabled()) {
      return;
    }

    const {appName, reportFailuresAfterAll} = this.config;
    if (!reportFailuresAfterAll) {
      this.onTestStart(id);
    }

    await eyes.open(appName || 'APP_NAME_NOT_SET', id);

    const screenshotPath = options.screenshotPath || (await takeScreenshot(id));
    await eyes.testScreenshot(id, screenshotPath);

    let message = '';

    const result = await eyes.close(false);
    const testFailed = !result.isPassed();
    if (testFailed) {
      message = `--- Failed test ended. See details at ${result.getAppUrls().getBatch()}`;
    }

    if (reportFailuresAfterAll) {
      const imagePath = path.resolve(process.cwd(), './artifacts/', `${id}.png`);
      fs.copyFileSync(screenshotPath, imagePath);
      this.finishedTests.push({screenshotPath: imagePath, result, options, message});
    } else {
      this.onTestDone(id, result.isPassed(), message);
      if (testFailed) {
        throw new Error(message);
      }
    }
  };

  close = async () => {
    const {waitAfterMismatch} = this.config;
    const hasMismatches = !this.allTestsPassed();

    if (hasMismatches && waitAfterMismatch) {
      this.reportMismatches();
      await this.waitForApproval();
    }

    this.onAllTestsDone();
  };

  private buildEyes = (): DetoxEyes => {
    const {serverUrl, apiKey, branchName, parentBranchName, appName, batchId} = this.config;

    const isDisabled = !apiKey;
    const eyes = new DetoxEyes(serverUrl, isDisabled);

    if (apiKey) {
      eyes.setApiKey(apiKey);
    }

    eyes.setAppName(appName);
    eyes.setHostOS(this.deviceType);
    eyes.setHostApp(this.deviceName);
    eyes.setBatch(appName, batchId);
    eyes.setLogHandler(new ConsoleLogHandler(false));
    eyes.setScreenshotOptions({ignoredTopHeight: this.statusBarHeight});

    if (branchName) {
      eyes.setBranchName(branchName);
    }

    if (parentBranchName) {
      eyes.setParentBranchName(parentBranchName);
    }

    return eyes;
  };

  private waitForApproval = async () => {
    const {
      approveTimeout = DEFAULT_APPROVE_TIMEOUT,
      approveCheckInterval = DEFAULT_APPROVE_CHECK_INTERVAL,
    } = this.config;

    let updateInterval;

    const testUntilApproved = new Promise<void>((resolve) => {
      let isTesting = false;
      updateInterval = setInterval(async () => {
        if (!isTesting) {
          isTesting = true;
          await this.refreshTestsStatus();
          isTesting = false;

          if (this.allTestsPassed()) {
            resolve();
          }
        }
      }, approveCheckInterval);
    });

    const resolveAfterTimeout = new Promise((resolve) => setTimeout(resolve, approveTimeout));

    await Promise.race([testUntilApproved, resolveAfterTimeout]);

    clearInterval(updateInterval);
  };

  private onTestStart = (name: string) => {
    this.reporter?.reportTestStart?.({name});
  };

  private onTestDone = (name: string, passed: boolean, message?: string) => {
    this.reporter?.reportTestDone?.({name, passed, message});
  };

  private onAllTestsDone = () => {
    if (this.reporter?.reportAllTestsDone) {
      const details = this.finishedTests.map(({result: testResult, message}) => ({
        name: testResult.getName(),
        passed: testResult.isPassed(),
        message,
      }));
      this.reporter.reportAllTestsDone(details);
    }

    if (this.config.reportFailuresAfterAll) {
      this.throwFailedTestsError();
    }
  };

  private throwFailedTestsError = () => {
    const failedTests = this.getUnresolvedTests();

    if (failedTests.length) {
      let errorMessage = 'The following tests have failed:\n';
      failedTests.forEach(({result: testResult, message}) => {
        errorMessage += `${testResult.getName()} - ${message}`;
      });

      throw new Error(errorMessage);
    }
  };

  private reportMismatches = () => {
    if (this.reporter?.reportMismatchTests) {
      const mismatchDetails = this.getUnresolvedTests().map(({result: testResult}) => ({
        name: testResult.getName(),
        batchUrl: testResult.getAppUrls().getBatch(),
        passed: false,
      }));
      this.reporter.reportMismatchTests(mismatchDetails);
    }
  };

  private refreshTestsStatus = async () => {
    const updatedTests = await Promise.all(
      this.finishedTests.map((test) => (test.result.isPassed() ? test : this.updateTestResult(test))),
    );
    this.finishedTests = updatedTests;
  };

  private updateTestResult = async (unresolvedTest: TestDetails): Promise<TestDetails> => {
    const {result: testResult, screenshotPath, options} = unresolvedTest;
    const eyes = this.buildEyes();
    eyes.setScreenshotOptions(options);

    const newResult = await eyes.getUpdatedTestResult(testResult, screenshotPath);
    return {...unresolvedTest, result: newResult};
  };

  private getUnresolvedTests = () => {
    return this.finishedTests.filter(({result: testResult}) => !testResult.isPassed());
  };

  private allTestsPassed = () => {
    return this.getUnresolvedTests().length === 0;
  };
}
