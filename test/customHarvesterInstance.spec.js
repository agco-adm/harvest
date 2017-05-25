'use strict';
let request = require('supertest');
let should = require('should');
let Joi = require('joi');
let harvester = require('../lib/harvester');

let config = require('./config.js');

let seeder = require('./seeder.js');

/**
 * This test case demonstrates how to setup test with custom harvester on different port
 */
describe('Custom harvester demo', function() {
  var baseUrl = 'http://localhost:8001';
  before(function() {
    var app = harvester(config.harvester.options);
    app.resource('pets', {
      name: Joi.string(),
    });
    app.listen(8001);
    this.harvesterApp = app;
  });

  beforeEach(function() {
    return seeder(this.harvesterApp).dropCollectionsAndSeed('pets');
  });

  it('should hit custom resource', function(done) {
    request(baseUrl)
      .get('/pets')
      .expect('Content-Type', /json/)
      .expect(200)
      .end(function(error, response) {
        should.not.exist(error);
        var body = JSON.parse(response.text);
        body.pets.length.should.equal(3);
        done();
      });
  });
});
