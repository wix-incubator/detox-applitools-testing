export interface Config {
  apiKey: string;
  appName: string;
  batchId: string;
  serverUrl?: string;
  branchName?: string;
  parentBranchName?: string;
  reportFailuresAfterAll?: boolean;
  waitAfterMismatch?: boolean;
  approveTimeout?: number;
  approveCheckInterval?: number;
}

export interface ScreenshotOptions {
  screenshotPath?: string;
  ignoredTopHeight?: number;
}

export interface TestStartDetails {
  name: string;
}

export interface TestEndDetails extends TestStartDetails {
  passed: boolean;
  batchUrl?: string;
  message?: string;
}

export interface TestReporter {
  reportTestStart?(details: TestStartDetails);
  reportTestDone?(details: TestEndDetails);
  reportAllTestsStart?();
  reportAllTestsDone?(results: TestEndDetails[]);
  reportMismatchTests?(results: TestEndDetails[]);
}
