const ORGS = require('./orgs');
const SENSORS = require('./sensors');
const { getKafkaTopicName } = require('./kafkaTopics');

module.exports = {
  ORGS,
  SENSORS,
  getKafkaTopicName,
};
