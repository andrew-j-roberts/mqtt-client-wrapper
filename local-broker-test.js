import { createMqttClient } from "./mqtt-client";

async function runLocalBrokerTest() {
  let mqttClient = createMqttClient({ options: { password: "default" } });

  mqttClient = await mqttClient.connect().catch((err) => console.log(err));

  console.dir(mqttClient);

  let res = await mqttClient.publish("T/test", "Hello? World?", { qos: 0 });
}

runLocalBrokerTest();
