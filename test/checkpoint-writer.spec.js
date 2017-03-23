'use strict'
const expect = require('chai').expect;
const Joi = require('joi');
const sinon = require('sinon');
const checkpointWriter = require('../lib/checkpoint-writer');
const Promise = require('bluebird');

describe('checkpoint writer', function () {

  describe('timeout', function () {
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
      harvestApp.adapter.update.returns(new Promise.resolve());
      checkpointWriter.startWriterLoop(harvestApp, true);
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
      expect(checkpointWriter.getLastDoc()).to.be.null;
      expect(checkpointWriter.getLastCheckpointId()).to.be.null;
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

});
