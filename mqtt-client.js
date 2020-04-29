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
   * lifecycle event handlers
   * https://github.com/mqttjs/MQTT.js#event-connect
   */

  let onConnect = () => {
    const log = {
      clientId,
      username,
      time: new Date().toISOString,
      msg: `Connected to broker`,
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
      msg: `Disconnected from broker`,
    };
    console.log(JSON.stringify(log));
  };

  let onOffline = () => {
    const log = {
      clientId,
      username,
      time: new Date().toISOString,
      msg: `Client is offline`,
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
      msg: `Client end called and no onEnd behavior is configured, disconnecting without performing any final actions`,
    };
    console.log(JSON.stringify(log));
  };

  const onMessage = (topic, message, packet) => {
    // dispatch message to matching topic subscription handlers
    for (const topicSubscription of Object.keys(subscriptionHandlers)) {
      if (checkIfWildcardMatch(topicSubscription, topic)) {
        subscriptionHandlers[topicSubscription](topic, message, packet);
      }
    }
  };

  /**
   * client methods
   */

  async function connect() {
    return new Promise((resolve, reject) => {
      client = mqtt.connect(hostUrl, {
        username,
        password,
        clientId,
        ...rest,
      });
      client.on("message", onMessage);
      client.on("reconnect", onReconnect);
      client.on("close", onClose);
      client.on("offline", onOffline);
      client.on("end", onEnd);
      client.on("connect", (connack) => {
        onConnect();
        // resolve with mqtt.js client object enhanced with convenience functions
        resolve(
          produce({}, (draft) => {
            // wrapper client methods
            draft.subscribeWithHandler = subscribeWithHandler;
            draft.unsubscribe = unsubscribe;
            draft.publish = publish;
            // mqtt.js client methods
            draft.subscribe = client.subscribe;
            draft.end = client.end;
            draft.removeOutgoingMessage = client.removeOutgoingMessage;
            draft.reconnect = client.reconnect;
            draft.handleMessage = client.handleMessage;
            draft.connected = client.connected;
            draft.reconnecting = client.reconnecting;
            draft.getLastMessageId = client.getLastMessageId;
            // client lifecycle event handler setters (map to https://github.com/mqttjs/MQTT.js#event-connect)
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

  async function subscribeWithHandler() {}

  async function unsubscribe() {}

  /**
   * return a client object that can be configured before connecting
   */
  return produce({}, (draft) => {
    // wrapper client methods
    draft.connect = connect;
    // client lifecycle events handler setters (map to https://github.com/mqttjs/MQTT.js#event-connect)
    draft.setOnConnect = setOnConnect;
    draft.setOnError = setOnError;
    draft.setOnReconnect = setOnReconnect;
    draft.setOnOffline = setOnOffline;
    draft.setOnEnd = setOnEnd;
    draft.setOnClose = setOnClose;
  });
}

function checkIfWildcardMatch({ wildcardTopic, topic }) {}

//  //Iterate over all subscriptions in the subscription map
//  for (let sub of Array.from(Object.keys(eventHandlers))) {
//   //Replace all * in the topic filter with a .* to make it regex compatible
//   let _tmp = sub.replace(/\+/g, ".*");
//   //Replace all $ in the topic filter with a .* to make it regex compatible
//   let regexdSub = _tmp.replace(/\$/g, ".*");
//   //if the last character is a '>', replace it with a .* to make it regex compatible
//   if (sub.lastIndexOf("#") == sub.length - 1) {
//     regexdSub = regexdSub.substring(0, regexdSub.length - 1).concat(".*");
//   }
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
