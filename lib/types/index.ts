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

export enum TestStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export interface TestStartDetails {
  name: string;
}

export interface TestEndDetails extends TestStartDetails {
  status: TestStatus;
  duration: number;
  batchUrl?: string;
  message?: string;
}

export interface TestReporter {
  reportTestStart?(details: TestStartDetails);
  reportTestDone?(details: TestEndDetails);
  reportAllTestsStart?();
  reportAllTestsDone?();
  reportMismatchTests?(results: TestEndDetails[]);
}
