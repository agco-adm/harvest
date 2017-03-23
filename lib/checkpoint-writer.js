'use strict'
const EventEmitter = require('events');
const _ = require('lodash');
let writerLoopStopped = true;
let lastDoc;
let lastCheckpointId;
let harvesterApp;
let writeInterval = 100;
const log = require('agco-logger')({
  logger: {
    log: {
      level: process.env.LOG_LEVEL || 'debug',
      showLevel: process.env.LOG_SHOW_LEVEL || false,
      showTimestamps: process.env.LOG_SHOW_TIMESTAMPS || false
    }
  }
});

const checkpointEvent = new EventEmitter();

checkpointEvent.on('newCheckpoint', (checkpointId, doc) => {
  lastCheckpointId = checkpointId;
  lastDoc = doc;
});

const persistLastCheckpoint = () => {
  if(lastDoc && lastCheckpointId) {
    const profileMessage = 'updateCheckpointAndReshedule ' + lastDoc.ts;
    log.profile(profileMessage);
    harvesterApp.adapter.update('checkpoint', lastCheckpointId, {ts: lastDoc.ts})
    .then(data => {
      log.profile(profileMessage);
    });
  };
  lastCheckpointId = null;
  lastDoc = null;
};

const persistInInterval = () => {
  setTimeout(() => {
    persistLastCheckpoint();
    persistInInterval();
  }, writeInterval);
};

const startWriterLoop = (app, loopStopped = writerLoopStopped) => {
  harvesterApp = app;
  writeInterval = parseInt(_.get(harvesterApp, 'options.eventsReaderDebounceWait')) || writeInterval;
  if(loopStopped) {
    persistInInterval();
    writerLoopStopped = false;
  };
};

const getLastCheckpointId = () => lastCheckpointId;

const getLastDoc = () => lastDoc;

module.exports = {
  startWriterLoop: startWriterLoop,
  persistLastCheckpoint: persistLastCheckpoint,
  checkpointEvent: checkpointEvent,
  getLastCheckpointId: getLastCheckpointId,
  getLastDoc: getLastDoc
};
