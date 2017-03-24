'use strict'
const expect = require('chai').expect;
const Joi = require('joi');
const sinon = require('sinon');
const checkpointWriter = require('../lib/events-reader-checkpoint-writer');
const Promise = require('bluebird');

describe('checkpoint writer', function () {

  describe('timeout', function () {
    context('when using the default config options', () => {
      const harvestApp = {
        adapter: {
          update: () => {}
        }
      };
      const fakeDoc = {ts: 1};
      const checkpointEvent = checkpointWriter.checkpointEvent;

      let clock;

      beforeEach(() => {
        clock = sinon.useFakeTimers();
        sinon.stub(harvestApp.adapter, 'update');
        harvestApp.adapter.update.returns(new Promise.resolve(fakeDoc));
        checkpointWriter.startWriterLoop(harvestApp);
        checkpointWriter.setWriterLoopStopped(true);
        checkpointEvent.emit('newCheckpoint', 1, fakeDoc);
      });

      afterEach(() => {
        harvestApp.adapter.update.restore();
        clock.restore();
      });

      it('should clean last doc and checkpoint after handled', done => {
        clock.tick(1);
        expect(harvestApp.adapter.update.callCount).to.be.eql(1);
        clock.tick(1);
        expect(checkpointWriter.getLastDoc()).to.be.undefined;
        expect(checkpointWriter.getLastCheckpointId()).to.be.undefined;
        expect(harvestApp.adapter.update.calledOnce).to.be.true;

        done();
      });

      it('should write a checkpoint in a given interval', done => {
        clock.tick(1);
        expect(harvestApp.adapter.update.callCount).to.be.eql(1);

        checkpointEvent.emit('newCheckpoint', 1, fakeDoc);
        clock.tick(1);
        expect(harvestApp.adapter.update.callCount).to.be.eql(2);

        done();
      });
    });

    context('when passing the option eventsReaderDebounceWait', () => {
      const eventsReaderDebounceDelay = 1000;
      const harvestApp = {
        adapter: {
          update: () => {}
        },
        options: {
          eventsReaderDebounceWait: eventsReaderDebounceDelay
        }
      };
      const fakeDoc = {ts: 1};
      const checkpointEvent = checkpointWriter.checkpointEvent;

      let clock;

      beforeEach(() => {
        clock = sinon.useFakeTimers();
        sinon.stub(harvestApp.adapter, 'update');
        harvestApp.adapter.update.returns(new Promise.resolve(fakeDoc));
        checkpointWriter.startWriterLoop(harvestApp);
        checkpointWriter.setWriterLoopStopped(true);
        checkpointEvent.emit('newCheckpoint', 1, fakeDoc);
      });

      afterEach(() => {
        harvestApp.adapter.update.restore();
        clock.restore();
      });

      it('should write a checkpoint in a given interval', done => {
        clock.tick(eventsReaderDebounceDelay);
        expect(harvestApp.adapter.update.callCount).to.be.eql(1);

        checkpointEvent.emit('newCheckpoint', 1, fakeDoc);
        clock.tick(eventsReaderDebounceDelay);
        expect(harvestApp.adapter.update.callCount).to.be.eql(2);

        done();
      });
    });

  });

});
