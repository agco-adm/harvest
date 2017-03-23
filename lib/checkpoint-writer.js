const EventEmitter = require('events');

let writerLoopStopped = true;
let lastDoc;
let lastCheckpointId;
let harvesterApp;
const writeInterval = 100;

const checkpointEvent = new EventEmitter();

checkpointEvent.on('newCheckpoint', (checkpointId, doc) => {
  lastCheckpointId = checkpointId;
  lastDoc = doc;
});

const persistLastCheckpoint = () => {
  if(lastDoc && lastCheckpointId) {
    harvesterApp.adapter.update('checkpoint', lastCheckpointId, {ts: lastDoc.ts})
    .then(() => {
      console.log('persisted')
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
