import fs from 'fs';
import http from 'https';
import yargs from 'yargs';

const argv = yargs
  .demandOption(['r', 'd'])
  .describe('r', 'The rate of requests, per second')
  .describe('d', 'The duration of the test, in seconds')
  .alias('r', 'rate')
  .alias('d', 'duration')
  .argv;

const DEFAULT_URL = 'https://api.doublespeakgames.com/google';
const DEFAULT_TEMPLATE = '../request.json';
const DEFAULT_RATE = 10; // per second
const DEFAULT_DURATION = 10; // second
const DEFAULT_PARAMS = {
  'intent': 'Welcome',
  'subject': '',
  'object': ''
};

function loadTemplate(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, buffer) => {
      if (err) {
        reject(err);
        return;
      } 
      resolve(buffer);
    });
  })
}

function makeRequest(body) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timings = { };
    const req = new http.request(DEFAULT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let responseBody = '';
      res
        .once('readable', () => timings.firstByteAt = Date.now() - start)
        .on('data', chunk => responseBody += chunk)
        .on('end', () => {
          timings.endAt = Date.now() - start;
          resolve({ body: responseBody, timings });
        });
    });
    req
      .on('error', err => reject(err))
      .on('socket', (socket) => {
        socket.on('lookup', () => timings.dnsLookupAt = Date.now() - start);
        socket.on('connect', () => timings.tcpConnectionAt = Date.now() - start);
        socket.on('secureConnect', () => timings.tlsHandshakeAt = Date.now() - start);
      });
    req.write(body);
    req.end();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const template = await loadTemplate(DEFAULT_TEMPLATE);
  const body = Object.entries(DEFAULT_PARAMS)
    .reduce((body, pair) => body.replace(`\${${pair[0]}}`, pair[1]), template);

  const start = Date.now();
  const requests = [];
  while ((Date.now() - start) / 1000 < argv.duration) {
    requests.push(makeRequest(body));
    await delay(1000 / argv.rate);
  }

  const responses = await Promise.all(requests);
  const metrics = Object.keys(responses[0].timings);
  const stats = {};
  for (let metric of metrics) {
    const data = stats[metric] = { best: null, worst: null, average: 0 };
    for (let response of responses) {
      const time = response.timings[metric];
      data.average += time / responses.length;
      if (data.best == null || time < data.best) { 
        data.best = time; 
      }
      if (data.worst == null || time > data.worst) {
        data.worst = time;
      }
    }
  }
  console.log(`${responses.length} requests complete.`);
  console.log(stats);
}

run();