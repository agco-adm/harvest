'use strict'
const EventEmitter = require('events');
const _ = require('lodash');
const debug = require('debug')('events-reader');
let writerLoopStopped = true;
let lastDoc;
let lastCheckpointId;
let harvesterApp;

const checkpointEvent = new EventEmitter();

checkpointEvent.on('newCheckpoint', (checkpointId, doc) => {
  lastCheckpointId = checkpointId;
  lastDoc = doc;
});

const persistLastCheckpoint = () => {
  if(lastDoc && lastCheckpointId) {
    harvesterApp.adapter.update('checkpoint', lastCheckpointId, {ts: lastDoc.ts})
      .then(checkpoint => {
        debug('last written checking point ' + checkpoint.ts);
      })
      .catch(error => {
        console.log(error);
        process.exit(1);
      });
  };
  lastCheckpointId = undefined;
  lastDoc = undefined;
};

const persistInInterval = (ms) => {
  setInterval(() => {
    persistLastCheckpoint();
  }, ms);
};

const startWriterLoop = app => {
  harvesterApp = app;
  const writeInterval = parseInt(_.get(harvesterApp, 'options.eventsReaderDebounceWait')) || 1;
  if(writerLoopStopped) {
    persistInInterval(writeInterval);
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
