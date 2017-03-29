var request = require('supertest');
var should = require('should');
var Joi = require('joi');
var _ = require('lodash');
var harvester = require('../lib/harvester');

var config = require('./config.js');

var seeder = require('./seeder.js');

describe('API starts up without oplog connection string', function () {
    var baseUrl = 'http://localhost:2427';
    before(function () {
        var customConfig = _.cloneDeep(config.harvester.options)
        delete customConfig.oplogConnectionString;
        var app = harvester(customConfig);
        app.resource('pets', {
            name: Joi.string()
        });
        app.listen(2427);
        this.harvesterApp = app;
    });

    beforeEach(function () {
        return seeder(this.harvesterApp).dropCollectionsAndSeed('pets')
    });


    it('should be able to hit an endpoint successfully', function (done) {
        request(baseUrl).get('/pets').expect('Content-Type', /json/).expect(200).end(function (error, response) {
            should.not.exist(error);
            var body = JSON.parse(response.text);
            body.pets.length.should.equal(3);
            done();
        });
    });
});
