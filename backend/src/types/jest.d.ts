/// <reference types="jest" />

declare global {
  var beforeAll: typeof jest.beforeAll;
  var afterAll: typeof jest.afterAll;
  var beforeEach: typeof jest.beforeEach;
  var afterEach: typeof jest.afterEach;
  var describe: typeof jest.describe;
  var it: typeof jest.it;
  var test: typeof jest.test;
  var expect: typeof jest.expect;
}