'use strict'
const EventEmitter = require('events');
const debug = require('debug')('events-reader');
let writerLoopStopped = true;
let lastDoc;
let lastCheckpointId;
let harvesterApp;

const checkpointEventEmitter = new EventEmitter();

checkpointEventEmitter.on('newCheckpoint', (checkpointId, doc) => {
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
  const defaultWriteInterval = 1;
  const writeInterval = parseInt((harvesterApp.options && harvesterApp.options.eventsReaderDebounceWait) || defaultWriteInterval);
  if(writerLoopStopped) {
    persistInInterval(writeInterval);
    writerLoopStopped = false;
  };
};

const getLastCheckpointId = () => lastCheckpointId;

const getLastDoc = () => lastDoc;

const setWriterLoopStopped = shouldStop => writerLoopStopped = shouldStop;

module.exports = {
  startWriterLoop: startWriterLoop,
  checkpointEventEmitter: checkpointEventEmitter,
  getLastCheckpointId: getLastCheckpointId,
  getLastDoc: getLastDoc,
  setWriterLoopStopped: setWriterLoopStopped
};
