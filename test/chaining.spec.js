'use strict';
let should = require('should');
let Joi = require('joi');

let seeder = require('./seeder.js');

describe('chaining', function() {
  beforeEach(function() {
    return seeder(this.harvesterApp).dropCollectionsAndSeed('people', 'pets');
  });
  describe('resource returns chainable functions', function() {
    it('should return httpMethods on last resource', function(done) {
      var plant = this.harvesterApp.resource('plant', {
        name: Joi.string().required().description('name'),
        appearances: Joi.string().required().description('appearances'),
        links: {
          pets: ['pet'],
          soulmate: { ref: 'person', inverse: 'soulmate' },
          lovers: [{ ref: 'person', inverse: 'lovers' }],
        },
      });

      [
        'get',
        'post',
        'put',
        'delete',
        'getById',
        'putById',
        'deleteById',
        'getChangeEventsStreaming',
      ].forEach(function(httpMethod) {
        should.exist(plant[httpMethod]().before);
        should.exist(plant[httpMethod]().after);
        should.exist(plant[httpMethod]().disableAuthorization);
      });

      done();
    });
  });
});
