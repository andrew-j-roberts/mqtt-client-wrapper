/**
 * mqtt-client.test.js
 * @author Andrew Roberts
 */

import {
  createMqttClient,
  dispatchMessage,
  checkTopicWildcardMatch,
} from "./mqtt-client";

// Tests follow this pattern:
// describe('[unit of work]', () => {
//   describe('when [scenario/context]', () => {
//     it('should [expected behaviour]', () => {});
//   });
// });
// https://github.com/mawrkus/js-unit-testing-guide#name-your-tests-properly

describe(`checkTopicWildcardMatch`, () => {
  describe(`topics with no wildcards`, () => {});
  describe(`topics with single level wildcard: +`, () => {});
  describe(`topics with multi level wildcard: #`, () => {});
  describe(`topics with system symbol: $`, () => {});
});

describe(`dispatchMessage`, () => {
  it("should properly return its id", () => {
    let dummyOptionsObj = {
      "-cip": "localhost",
      "-stl": "foo",
    };
    let dummySdkPerfCommand = SdkPerfCommand("c", dummyOptionsObj);
    let dummyJob = Job(1, "Basic C Consumer", dummySdkPerfCommand);
    expect(dummyJob.id).toBe(1);
  });
});
