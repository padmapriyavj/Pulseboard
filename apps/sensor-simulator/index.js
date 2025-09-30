require("dotenv").config();
const chalk = require("chalk");
const simulateSensorData = require("./src/simulate");

const ORG_ID = process.env.ORG_ID || "apple";

async function main() {
  console.log(chalk.blueBright(`Starting simulator for org: ${ORG_ID}`));

  const simulated = simulateSensorData(ORG_ID);
  console.log(chalk.green("Sample Data"), simulated);
}

main();
