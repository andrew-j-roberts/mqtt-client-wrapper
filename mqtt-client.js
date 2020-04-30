/**
 * mqtt-client.js
 * @author Andrew Roberts
 */

import mqtt from "mqtt";
import produce from "immer";

/**
 * A factory function that returns a client object that wraps MQTT.js.
 * If hostUrl or options are not provided, the client will attempt to
 * connect using sensible defaults.
 * @param {string} hostUrl
 * @param {object} options
 */
export function createMqttClient(
  hostUrl = "ws://localhost:8000",
  {
    username = "default",
    password = "",
    clientId = `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
    ...rest
  }
) {
  /**
   * Private reference to the client connection object
   */
  let client = null;

  /**
   * Private variable to store topic subscriptions and their associated handler callbacks.
   * Messages are dispatched to all topic subscriptions that match the incoming message's topic.
   * subscribe and unsubscribe modify this object.
   */
  let subscriptions = produce({}, () => {});

  /**
   * event handlers
   *
   * MQTT.js exposes client events, or callbacks related to the session with the broker.
   * The methods below are sensible defaults, and can be modified using the exposed setters.
   * Source documentation here: https://github.com/mqttjs/MQTT.js#event-connect
   */

  let onConnect = () => {
    const log = {
      clientId,
      username,
      time: new Date().toISOString,
      msg: `Connected`,
    };
    console.log(JSON.stringify(log));
  };

  let onReconnect = () => {
    const log = {
      clientId,
      username,
      time: new Date().toISOString,
      msg: `Attempting to reconnect`,
    };
    console.log(JSON.stringify(log));
  };

  let onClose = () => {
    const log = {
      clientId,
      username,
      time: new Date().toISOString,
      msg: `Disconnected`,
    };
    console.log(JSON.stringify(log));
  };

  let onOffline = () => {
    const log = {
      clientId,
      username,
      time: new Date().toISOString,
      msg: `Connectivity lost`,
    };
    console.log(JSON.stringify(log));
  };

  let onError = (error) => {
    const errorLog = {
      clientId,
      username,
      time: new Date().toISOString,
      error: error,
    };
    console.error(JSON.stringify(errorLog));
  };

  let onEnd = (error) => {
    const log = {
      clientId,
      username,
      time: new Date().toISOString,
      msg: `client.end was called and no onEnd behavior is configured, disconnecting without performing any final actions`,
    };
    console.log(JSON.stringify(log));
  };

  // onMessage handler configured to dispatch incoming messages to
  // the associated handlers of all matching topic subscriptions.
  const onMessage = (topic, message, packet) => {
    for (const topicSubscription of Object.keys(subscriptions)) {
      if (topicMatchesTopicFilter(topicSubscription, topic)) {
        subscriptions[topicSubscription](topic, message, packet);
      }
    }
  };

  /**
   * event handler setters
   */

  function setOnConnect(_onConnect) {
    onConnect = _onConnect;
  }

  function setOnReconnect(_onReconnect) {
    onReconnect = _onReconnect;
  }

  function setOnClose(_onClose) {
    onClose = _onClose;
  }

  function setOnOffline(_onOffline) {
    onOffline = _onOffline;
  }

  function setOnError(_onError) {
    onError = _onError;
  }

  function setOnEnd(_onEnd) {
    onEnd = _onEnd;
  }

  // resolve with connected client session object on connack, reject on connection error
  async function connect() {
    return new Promise((resolve, reject) => {
      client = mqtt.connect(hostUrl, {
        username,
        password,
        clientId,
        ...rest,
      });
      client.on("reconnect", onReconnect);
      client.on("close", onClose);
      client.on("offline", onOffline);
      client.on("end", onEnd);
      client.on("message", onMessage);
      client.on("connect", (connack) => {
        onConnect();
        // resolve with mqtt.js client object enhanced with convenience functions
        resolve(
          produce({}, (draft) => {
            // overloaded MQTT.js Client methods
            draft.subscribe = subscribe;
            draft.unsubscribe = unsubscribe;
            draft.publish = publish;
            // MQTT.js Client methods
            draft.end = client.end;
            draft.removeOutgoingMessage = client.removeOutgoingMessage;
            draft.reconnect = client.reconnect;
            draft.handleMessage = client.handleMessage;
            draft.connected = client.connected;
            draft.reconnecting = client.reconnecting;
            draft.getLastMessageId = client.getLastMessageId;
            // MQTT.js Client event handler setters
            draft.setOnConnect = setOnConnect;
            draft.setOnError = setOnError;
            draft.setOnReconnect = setOnReconnect;
            draft.setOnOffline = setOnOffline;
            draft.setOnEnd = setOnEnd;
            draft.setOnClose = setOnClose;
          })
        );
      });
      client.on("error", (error) => {
        onError(error);
        reject();
      });
    });
  }

  /**
   * async wrapper around publish
   * https://github.com/mqttjs/MQTT.js/blob/master/README.md#publish
   * @param {string} topic
   * @param {object} message
   * @param {object} options
   */
  async function publish(topic, message, options) {
    return new Promise((resolve, reject) => {
      // guard: prevent attempting to interact with client that does not exist
      if (!client) {
        const errorLog = {
          clientId,
          username,
          time: new Date().toISOString,
          error: error,
        };
        console.error(JSON.stringify(errorLog));
        reject();
      }

      // otherwise publish message using
      client.publish(
        topic,
        publishSafeMessage,
        options, // options
        function onPubAck(err) {
          // guard: err != null indicates client is disconnecting
          if (err) reject(err);
          resolve();
        }
      );
    });
  }

  /**
   *
   */
  async function subscribe(topic, options, handler) {}

  /**
   *
   */
  async function unsubscribe(topic) {}

  /**
   *
   */
  async function logInfo(message) {}

  /**
   *
   */
  async function logError(error) {}


  /**
   * This factory function returns an object that only exposes methods to configure and connect the client.
   * Methods to add subscriptions (and all others) are exposed in the client the connect method resolves with.
   */
  return produce({}, (draft) => {
    // overloaded MQTT.js methods
    draft.connect = connect;
    // MQTT.js Client event handler setters
    draft.setOnConnect = setOnConnect;
    draft.setOnReconnect = setOnReconnect;
    draft.setOnClose = setOnClose;
    draft.setOnOffline = setOnOffline;
    draft.setOnError = setOnError;
    draft.setOnEnd = setOnEnd;
  });
}

/**
 * Determine whether a topic filter matches a provided
 * @param {string} topicFilter
 * @param {string} topic
 */
export function topicMatchesTopicFilter(topicFilter, topic) {}

/**
 * Convert MQTT topic filter wildcards and system symbols into regex
 * Useful resource for learning: https://regexr.com/
 * @param {string} topicFilter
 */
export function convertMqttTopicFilterToRegex(topicFilter) {
  // convert single-level wildcard + to .*, or "any character, zero or more repetitions"
  let regex = topicFilter.replace(/\+/g, ".*").replace(/\$/g, ".*");
  // convert multi-level wildcard # to .* if it is in a valid position in the topic filter
  if (sub.lastIndexOf("#") == sub.length - 1) {
    regexdSub = regexdSub.substring(0, regexdSub.length - 1).concat(".*");
  }
}

/**
 * Attempt to serialize provided message.
 * Logs and rejects on errors, resolves with publish-safe string on success.
 * @param {object|string|number|null} message
 */
export function serializeMessage(message) {
  return new Promise((resolve, reject) => {
    try {
      // handle non-null objects
      if (typeof message === "object" && message !== null) {
        resolve(JSON.stringify(message));
      }

      // handle numbers
      if (typeof message === "number") {
        resolve(message.toString());
      }

      // handle booleans
      if (typeof message === "boolean") {
        resolve(String.valueOf(message));
      }
      // handle strings
      if (typeof message === "string") {
        resolve(message);
      }

      // handle null
      if (message === null) {
        resolve("");
      }
    } catch (err) {
      /**
       * if you pass an object to this function that can't be stringified,
       * this catch block will catch and log the error
       */
      reject();
    }
  });
}

function log 

























//  //Iterate over all subscriptions in the subscription map
//  for (let sub of Array.from(Object.keys(eventHandlers))) {

//   let matchRegex = new RegExp(regexdSub);
//   let matched = topic.match(matchRegex);

//   //if the matched index starts at 0, then the topic is a match with the topic filter
//   if (matched && matched.index == 0) {
//     //Edge case if the pattern is a match but the last character is a *
//     if (regexdSub.lastIndexOf("*") == sub.length - 1) {
//       //Check if the number of topic sections are equal
//       if (regexdSub.split("/").length != topic.split("/").length) {
//         return;
//       }
//     }
//     eventHandlers[sub]({ topic, message });
//   } else {
//     console.error(
//       `Received messages on topic ${topic}, but no corresponding handler is set.`
//     );
//   }
// }
