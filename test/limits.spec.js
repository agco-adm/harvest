'use strict';
let request = require('supertest');
let should = require('should');

let seeder = require('./seeder.js');

describe('limits', function() {
  var config;
  beforeEach(function() {
    config = this.config;
    return seeder(this.harvesterApp).dropCollectionsAndSeed('people', 'pets');
  });

  describe('limits', function() {
    it('should be possible to tell how many documents to return', function(
      done
    ) {
      request(config.baseUrl)
        .get('/people?limit=1')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          var body = JSON.parse(res.text);
          body.people.length.should.equal(1);
          done();
        });
    });
  });
});
