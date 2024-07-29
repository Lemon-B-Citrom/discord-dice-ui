/*
export default function getRandom(maxValue: number, minValue: number = 1) {
  const min = Math.ceil(minValue);
  const max = Math.floor(maxValue);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
*/

const { Random, MersenneTwister19937, nodeCrypto, browserCrypto } = require("random-js");
const random = new Random(MersenneTwister19937.autoSeed());

export default function getRandom(maxValue: number, minValue: number = 1) {
  const min = Math.ceil(minValue);
  const max = Math.floor(maxValue);
  return random.integer(min,max);
}