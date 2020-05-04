/**
 * mqtt-client.test.js
 * @author Andrew Roberts
 */

import {
  topicMatchesTopicFilter,
  convertMqttTopicFilterToRegex,
  serializeMessage,
} from "./mqtt-client";

describe(`topicMatchesTopicFilter`, () => {
  describe(`topics with no wildcards`, () => {
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
  describe(`topics with single level wildcard: +`, () => {});
  describe(`topics with multi level wildcard: #`, () => {});
  describe(`topics with system symbol: $`, () => {});
});

describe(`convertMqttTopicFilterToRegex`, () => {
  describe(`topics with no wildcards`, () => {});
  describe(`topics with single level wildcard: +`, () => {});
  describe(`topics with multi level wildcard: #`, () => {});
  describe(`topics with system symbol: $`, () => {});
  describe(`topics with system symbol: $`, () => {});
});

describe(`serializeMessage`, () => {
  describe(`topics with no wildcards`, () => {});
  describe(`topics with single level wildcard: +`, () => {});
  describe(`topics with multi level wildcard: #`, () => {});
  describe(`topics with system symbol: $`, () => {});
});
