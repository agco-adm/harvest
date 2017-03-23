'use strict'
const EventEmitter = require('events');
const _ = require('lodash');
let writerLoopStopped = true;
let lastDoc;
let lastCheckpointId;
let harvesterApp;
let writeInterval = 1;
const log = require('agco-logger')({});
const shouldLog =  (process.env.LOG_EVENTS_READER=="true") ||false;

const checkpointEvent = new EventEmitter();

checkpointEvent.on('newCheckpoint', (checkpointId, doc) => {
  lastCheckpointId = checkpointId;
  lastDoc = doc;
});

const persistLastCheckpoint = () => {
  if(lastDoc && lastCheckpointId) {
    const profileMessage = 'writing new checkpoint to database ' + lastDoc.ts;
    shouldLog && log.profile(profileMessage);
    harvesterApp.adapter.update('checkpoint', lastCheckpointId, {ts: lastDoc.ts})
    .then(() => {
      shouldLog && log.profile(profileMessage);
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

const startWriterLoop = (app, loopStopped) => {
  loopStopped = loopStopped || writerLoopStopped;
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
