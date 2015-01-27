var inflect= require('i')();
var should = require('should');
var _ = require('lodash');
var RSVP = require('rsvp');
var request = require('supertest');
var Promise = RSVP.Promise;
var fixtures = require('./fixtures.json');
var uuidRegexp = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

module.exports = function(baseUrl,keys,ids) {
    describe('resources', function () {

        describe('getting a list of resources', function () {
            _.each(fixtures, function (resources, collection) {
                var key = keys[collection];

                it('in collection "' + key + '"', function (done) {
                    request(baseUrl)
                        .get('/' + key)
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (error, response) {
                            should.not.exist(error);
                            var body = JSON.parse(response.text);
                            ids[key].forEach(function (id) {
                                _.contains(_.pluck(body[key], 'id'), id).should.equal(true);
                            });
                            done();
                        });
                });
            });
        });

        describe('getting each individual resource', function () {
            _.each(fixtures, function (resources, collection) {
                var key = keys[collection];

                it('in collection "' + key + '"', function (done) {
                    RSVP.all(ids[key].map(function (id) {
                        return new Promise(function (resolve) {
                            request(baseUrl)
                                .get('/' + key + '/' + id)
                                .expect('Content-Type', /json/)
                                .expect(200)
                                .end(function (error, response) {
                                    should.not.exist(error);
                                    var body = JSON.parse(response.text);
                                    body[key].forEach(function (resource) {
                                        (resource.id).should.equal(id);
                                    });
                                    resolve();
                                });
                        });
                    })).then(function () {
                        done();
                    });
                });
            });
        });

        describe('posting a resource', function() {
            it('can post a valid resource and get a UUID', function(done) {
                var payload = {};
                payload.cars = [{name : 'coche'}];
                request(baseUrl)
                    .post('/cars')
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(201)
                    .end(function (error, response) {
                        should.not.exist(error);
                        var body = JSON.parse(response.text);
                        body.cars[0].id.should.match(uuidRegexp);
                        done();
                });
            });

            it('can post a valid resource with id and return same id', function(done) {
                var payload = {};
                payload.cars = [{
                    id : '11111111-a60f-11e4-b798-673bc6ad4dd9',
                    name : 'coche'
                }];
                request(baseUrl)
                    .post('/cars')
                    .send(payload)
                    .expect('Content-Type', /json/)
                    .expect(201)
                    .end(function (error, response) {
                        should.not.exist(error);
                        var body = JSON.parse(response.text);
                        body.cars[0].id.should.equal(payload.cars[0].id);
                        done();
                });
            });
        });

        describe('posting a duplicate resource', function () {
            it('in collection \'people\'', function (done) {
                var body = {people:[]};
                body.people.push(_.cloneDeep(fixtures["person"][0]));
                body.people[0].id=ids["people"][0];
                RSVP.all([ids["people"][0]].map(function (id) {
                    return new Promise(function (resolve) {
                        request(baseUrl)
                            .post('/people/')
                            .send(body)
                            .expect('Content-Type', /json/)
                            .expect(409)
                            .end(function (error, response) {
                                should.not.exist(error);
                                should.exist(response.error);
                                resolve();
                            });
                    });
                })).then(function () {
                    done();
                });
            });
        });
    });
}