require('dotenv').config();
const runConsumer = require('./kafkaConsumer');

runConsumer().catch(console.error);
