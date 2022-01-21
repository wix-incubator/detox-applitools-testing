import * as fs from 'fs';
import * as path from 'path';
import {ConsoleLogHandler} from '@applitools/eyes-common';
import {DetoxEyes} from './detox-eyes';
import {Config, ScreenshotOptions, TestEndDetails, TestReporter, TestStartDetails, TestStatus} from './types';
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

interface Worker {
  count: number;
  queue: Promise<void>;
}

export class DetoxApplitoolsTesting {
  private deviceName: string;
  private deviceType: string;
  private statusBarHeight = 0;
  private finishedTests: TestDetails[] = [];
  private workers: Worker[] = [];

  constructor(private config: Config, private reporter?: TestReporter) {
    if (!config) {
      throw new Error(
        'Detox applitools configuration is missing! \n Necessary configuration params: batchId, apiKey, appName, serverUrl',
      );
    }

    this.deviceType = getDeviceType();
    this.deviceName = getDeviceName();
    this.statusBarHeight = getStatusBarHeight();
    this.workers =
      config.reportFailuresAfterAll && config.parallelVerifications
        ? Array.from(Array(config.parallelVerifications).keys(), () => ({count: 0, queue: Promise.resolve()}))
        : [];
  }

  setup = () => {
    this.reporter?.reportAllTestsStart?.();
  };

  testScreenshot = async (name: string, options?: ScreenshotOptions) => {
    const eyes = this.buildEyes();
    eyes.setScreenshotOptions(options);

    this.onTestStart({name});

    if (eyes.getIsDisabled()) {
      this.onTestDone({name, status: TestStatus.SKIPPED, duration: 0});
      return;
    }

    const {appName, reportFailuresAfterAll} = this.config;

    let screenshotPath = options.screenshotPath || (await takeScreenshot(name));

    const worker = this.workers.reduce((w, i) => (!w ? i : i.count < w.count ? i : w), undefined);

    const verify = async () => {
      await eyes.open(appName || 'APP_NAME_NOT_SET', name);

      await eyes.testScreenshot(name, screenshotPath);

      let message = '';

      const result = await eyes.close(false);
      const testFailed = !result.isPassed();
      if (testFailed) {
        message = `--- Failed test ended. See details at ${result.getAppUrls().getBatch()}`;
      }

      if (reportFailuresAfterAll) {
        const imagePath = path.resolve(process.cwd(), './artifacts/', `${name}.png`);
        fs.copyFileSync(screenshotPath, imagePath);
        screenshotPath = imagePath;
      }

      this.finishedTests.push({screenshotPath, result, options, message});

      if (!reportFailuresAfterAll && testFailed) {
        throw new Error(message);
      }
    };

    if (worker) {
      worker.count += 1;
      worker.queue = worker.queue.then(verify);
    } else {
      await verify();
    }
  };

  close = async () => {
    if (this.workers.length > 0) {
      await Promise.all(this.workers.map((it) => it.queue));
    }
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

  private onTestStart = (details: TestStartDetails) => {
    this.reporter?.reportTestStart?.(details);
  };

  private onTestDone = (details: TestEndDetails) => {
    this.reporter?.reportTestDone?.(details);
  };

  private onAllTestsDone = () => {
    this.finishedTests
      .map(({result, message}) => ({
        name: result.getName(),
        status: result.isPassed() ? TestStatus.PASSED : TestStatus.FAILED,
        duration: result.getDuration(),
        batchUrl: result.getAppUrls().getBatch(),
        message,
      }))
      .map(this.onTestDone);

    if (this.reporter?.reportAllTestsDone) {
      this.reporter.reportAllTestsDone();
    }

    if (this.config.reportFailuresAfterAll) {
      this.throwFailedTestsError();
    }
  };

  private throwFailedTestsError = () => {
    const failedTests = this.getUnresolvedTests();

    if (failedTests.length) {
      let errorMessage = 'The following tests have failed:\n';
      failedTests.forEach(({result, message}) => {
        errorMessage += `${result.getName()} - ${message}`;
      });

      throw new Error(errorMessage);
    }
  };

  private reportMismatches = () => {
    if (this.reporter?.reportMismatchTests) {
      const mismatchDetails = this.getUnresolvedTests().map(({result: testResult, message}) => ({
        name: testResult.getName(),
        batchUrl: testResult.getAppUrls().getBatch(),
        duration: testResult.getDuration(),
        status: TestStatus.FAILED,
        message,
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
