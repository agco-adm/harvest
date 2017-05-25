'use strict';
// eslint-disable-next-line
let harvester = require('../lib/harvester');

let dockerHostURL = process.env.DOCKER_HOST;
let mongodbHostname;
// if Mongodb is being run from Docker the DOCKER_HOST env variable should be set
// use this value to derive the hostname for the Mongodb connection params
if (dockerHostURL) {
  mongodbHostname = require('url').parse(dockerHostURL).hostname;
} else {
  // fallback if Mongodb is being run from the host machine
  mongodbHostname = '127.0.0.1';
}

let apiPort = process.argv[2] || 1337;
let apiHost = 'http://localhost:' + apiPort;

// boot up harvester
harvester({
  adapter: 'mongodb',
  connectionString: 'mongodb://' + mongodbHostname + ':27017/test',
  oplogConnectionString: 'mongodb://' + mongodbHostname + ':27017/local',
})
  .resource('artists', {
    name: String,
  })
  .listen(apiPort);

// subscribe to the artists change events stream (SSE)
let ess = require('agco-event-source-stream');

ess(apiHost + '/artists/changes/stream').on('data', function(data) {
  console.log('recevied artist change event', data);
});

// add some data
let $http = require('http-as-promised');

let sepultura = {
  artists: [
    {
      name: 'Sepultura',
    },
  ],
};

// wait a bit for the event stream to open before posting the artist
setTimeout(function() {
  $http
    .post(apiHost + '/artists', { json: sepultura })
    .spread(function(response, body) {
      console.log(body);
    })
    .catch(function(error) {
      console.error(error);
    });
}, 2000);
