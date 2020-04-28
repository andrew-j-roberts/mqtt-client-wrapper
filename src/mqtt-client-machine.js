/**
 * mqtt-client-machine.js
 * @author Andrew Roberts
 */

import produce from "immer";
import { Machine, assign, interpret } from "xstate";

export const createMqttClientMachine = (send) => {
  /**
   * actions
   */
  const addEventHandler = assign((context, event) => {
    return {
      eventHandlers: {
        ...produce(context.eventHandlers, (draft) => {
          draft[event.topic] = event.eventHandler;
        }),
      },
    };
  });

  const removeEventHandler = assign((context, event) => {
    return {
      eventHandlers: {
        ...produce(context.eventHandlers, (draft) => {
          delete draft[event.topic];
        }),
      },
    };
  });

  /**
   * Return a running instance of a MQTT client statechart called a "service"
   * A service persists current state, executes side-effects, and handles events.
   */
  return interpret(
    Machine(
      {
        id: "mqttClientMachine",
        context: {
          /**
           * Event handler functions keyed by topic.
           * I.e. { "topic/A": function eventHandlerA(event){...}, ... }
           */
          eventHandlers: {},
        },
        initial: "idle",
        states: {
          idle: {
            on: {
              CONNACK: { target: "connected" },
            },
          },
          connected: {
            on: {
              MESSAGE: {
                actions: ["dispatchEvent"],
              },
              CLOSE: {
                target: "disconnected",
              },
              OFFLINE: {
                target: "disconnected",
              },
            },
          },
          disconnected: {
            entry: ["handleDisconnect"],
            on: {
              CONNACK: { target: "connected" },
            },
          },
        },
        on: {
          ADD_EVENT_HANDLER: {
            actions: ["addEventHandler"],
          },
          REMOVE_EVENT_HANDLER: {
            actions: ["removeEventHandler"],
          },
        },
      },
      {
        actions: {
          addEventHandler,
          removeEventHandler,
          handleDisconnect,
        },
      }
    )
  )
    .onTransition((state) => {
      console.log(`messageMachine { state: ${state.value} }`);
    })
    .start();
};
