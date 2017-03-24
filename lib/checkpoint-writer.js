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
      })
      .catch(error => {
        console.log(error);
        process.exit(1);
      });
  };
  lastCheckpointId = null;
  lastDoc = null;
};

const persistInInterval = () => {
  setInterval(() => {
    persistLastCheckpoint();
  }, writeInterval);
};

const startWriterLoop = app => {
  harvesterApp = app;
  writeInterval = parseInt(_.get(harvesterApp, 'options.eventsReaderDebounceWait')) || writeInterval;
  if(writerLoopStopped) {
    persistInInterval();
    writerLoopStopped = false;
  };
};

const getLastCheckpointId = () => lastCheckpointId;

const getLastDoc = () => lastDoc;

const setWriterLoopStopped = loopStopped => writerLoopStopped = loopStopped;

module.exports = {
  startWriterLoop: startWriterLoop,
  persistLastCheckpoint: persistLastCheckpoint,
  checkpointEvent: checkpointEvent,
  getLastCheckpointId: getLastCheckpointId,
  getLastDoc: getLastDoc,
  setWriterLoopStopped: setWriterLoopStopped
};
