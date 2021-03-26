declare module 'detox/src/utils/argparse';

declare module '@applitools/eyes-images' {
  export abstract class Eyes {
    constructor(serverUrl: string, isDisabled?: boolean);

    getAppName: () => string;
    getIsDisabled: () => boolean;

    setApiKey: (value: string) => void;
    setAppName: (value: string) => void;
    setHostOS: (value: string) => void;
    setHostApp: (value: string) => void;
    setBatch: (appName: string, batchId: string) => void;
    setLogHandler: (value: unknown) => void;
    setBranchName: (value: string) => void;
    setParentBranchName: (value: string) => void;

    open(appName: string, testName: string, imageSize?: unknown): Promise<void>;
    close(throwEx: boolean): Promise<ITestResults>;
    checkRegion(image: string, region: unknown, name: string, ignoreMismatch?: boolean, retryTimeout?: number);
  }
}

declare module '@applitools/eyes-sdk-core' {
  export type TestResults = ITestResults;
}

interface ITestResults {
  getId: () => string;
  getName: () => string;
  isPassed: () => boolean;
  deleteSession: () => Promise<boolean>;
  getAppUrls: () => ISessionUrls;
}

interface ISessionUrls {
  getBatch: () => string;
  getSession: () => string;
}
