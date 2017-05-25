'use strict';
let should = require('should');
let supertest = require('supertest');
let Joi = require('joi');
let harvester = require('../lib/harvester');
let seeder = require('./seeder.js');

describe('ReadOnly', function() {
  var config;
  var ids;
  var seedingPort = 8010;

  before(function() {
    config = this.config;
    var seedingHarvesterInstance = harvester(config.harvester.options);
    seedingHarvesterInstance.resource('readers', {
      name: Joi.string().description('name'),
    });
    seedingHarvesterInstance.listen(seedingPort);
    this.seedingHarvesterInstance = seedingHarvesterInstance;
  });

  beforeEach(function() {
    return seeder(
      this.seedingHarvesterInstance,
      'http://localhost:' + seedingPort
    )
      .dropCollectionsAndSeed('readers')
      .then(function(_ids) {
        ids = _ids;
      });
  });

  it('should NOT be possible to post', function(done) {
    var data = {
      readers: [{ name: 'Jack' }],
    };
    supertest(config.baseUrl)
      .post('/readers')
      .send(data)
      .expect('Content-Type', /json/)
      .expect(405)
      .end(function(error) {
        should.not.exist(error);
        done();
      });
  });

  it('should be possible to get', function(done) {
    supertest(config.baseUrl)
      .get('/readers')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error) {
        should.not.exist(error);
        done();
      });
  });

  it('should be possible to getById', function(done) {
    supertest(config.baseUrl)
      .get('/readers/' + ids.readers[0])
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error) {
        should.not.exist(error);
        done();
      });
  });

  it('should NOT be possible to deleteById', function(done) {
    supertest(config.baseUrl)
      .delete('/readers/' + ids.readers[0])
      .expect('Content-Type', /json/)
      .expect(405)
      .end(function(error) {
        should.not.exist(error);
        done();
      });
  });

  it('should NOT be possible to putById', function(done) {
    var data = {
      readers: [{ name: 'Duck' }],
    };
    supertest(config.baseUrl)
      .put('/readers/' + ids.readers[0])
      .send(data)
      .expect('Content-Type', /json/)
      .expect(405)
      .end(function(error) {
        should.not.exist(error);
        done();
      });
  });
});
