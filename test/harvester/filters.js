var inflect= require('i')();
var should = require('should');
var _ = require('lodash');
var RSVP = require('rsvp');
var request = require('supertest');
var Promise = RSVP.Promise;

module.exports = function(baseUrl,keys,ids) {

    describe("filters", function() {
        it("should allow top-level resource filtering for collection routes", function (done) {
            request(baseUrl).get('/people?name=Dilbert')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (error, response) {
                    should.not.exist(error);
                    var body = JSON.parse(response.text);
                    body.people.length.should.equal(1);
                    done();
                });
        });

        it("should allow top-level resource filtering based on a numeric value", function (done) {
            request(baseUrl).get('/people?appearances=1934')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (error, response) {
                    should.not.exist(error);
                    var body = JSON.parse(response.text);
                    body.people.length.should.equal(1);
                    done();
                });
        });
        it("should allow combining top-level resource filtering for collection routes based on string & numeric values", function (done) {
            request(baseUrl).get('/people?name=Dilbert&appearances=3457')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (error, response) {
                    should.not.exist(error);
                    var body = JSON.parse(response.text);
                    body.people.length.should.equal(1);
                    done();
                });
        });
        it.skip("should allow resource sub-document filtering based on a numeric value", function (done) {
            request(baseUrl).get("/people?links.pets=2")
                .end(function (err, res) {
                    var body = JSON.parse(res.text);

                    body.cars.length.should.be.equal(1);
                    body.cars[0].id.should.be.equal('XYZ890');
                    done();
                });
        });
        it.skip('should be possible to filter related resources by ObjectId', function (done) {
            var cmd = [
                {
                    op: 'replace',
                    path: '/people/0/pets',
                    value: [ids.pets[0], ids.pets[1]]
                }
            ];
            //Give a man a pet
            request(baseUrl).patch('/people/' + ids.people[0])
                .set('Content-Type', 'application/vnd.api+json')
                .send(JSON.stringify(cmd))
                .expect(200)
                .end(function (err) {
                    should.not.exist(err);
                    request(baseUrl).get('/people?filter[pets]=' + ids.pets[0])
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            var data = JSON.parse(res.text);
                            (data.people).should.be.an.Array;
                            //Make sure filtering was run by ObjectId
                            (/[0-9a-f]{24}/.test(ids.pets[0])).should.be.ok;
                            (/[0-9a-f]{24}/.test(data.people[0].links.pets[0])).should.be.ok;
                            done();
                        });
                });
        });
        it.skip('should support filtering by id for one-to-one relationships', function (done) {
            new Promise(function (resolve) {
                var upd = [{
                    op: 'replace',
                    path: '/people/0/soulmate',
                    value: ids.people[1]
                }];
                request(baseUrl).patch('/people/' + ids.people[0])
                    .set('content-type', 'application/json')
                    .send(JSON.stringify(upd))
                    .expect(200)
                    .end(function (err) {
                        should.not.exist(err);
                        resolve();
                    });
            })
                .then(function () {
                    request(baseUrl).get('/people?filter[soulmate]=' + ids.people[1])
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            var body = JSON.parse(res.text);
                            (body.people[0].id).should.equal(ids.people[0]);
                            done();
                        });
                });
        });
        it.skip('should support `in` query', function (done) {
            new Promise(function (resolve) {
                var upd = [{
                    op: 'add',
                    path: '/people/0/links/houses/-',
                    value: ids.houses[0]
                }, {
                    op: 'add',
                    path: '/people/0/links/houses/-',
                    value: ids.houses[1]
                }];
                request(baseUrl).patch('/people/' + ids.people[0])
                    .set('content-type', 'application/json')
                    .send(JSON.stringify(upd))
                    .expect(200)
                    .end(function (err, res) {
                        should.not.exist(err);
                        resolve();
                    });
            })
                .then(function () {
                    return new Promise(function (resolve) {
                        var upd = [{
                            op: 'add',
                            path: '/people/0/links/houses/-',
                            value: ids.houses[1]
                        }, {
                            op: 'add',
                            path: '/people/0/links/houses/-',
                            value: ids.houses[2]
                        }];
                        request(baseUrl).patch('/people/' + ids.people[1])
                            .set('content-type', 'application/json')
                            .send(JSON.stringify(upd))
                            .expect(200)
                            .end(function (err, res) {
                                should.not.exist(err);
                                resolve();
                            });
                    });
                })
                .then(function () {
                    request(baseUrl).get('/people?filter[houses][in]=' + ids.houses[0] + ',' + ids.houses[1])
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            var body = JSON.parse(res.text);
                            (body.people.length).should.equal(2);
                            done();
                        });
                });
        });
        it.skip('should support $in query against one-to-one refs', function (done) {
            new Promise(function (resolve) {
                request(baseUrl).patch("/people/robert@mailbert.com")
                    .set("content-type", "application/json")
                    .send(JSON.stringify([
                        {
                            path: '/people/0/soulmate',
                            op: 'replace',
                            value: 'dilbert@mailbert.com'
                        }
                    ]))
                    .end(function (err) {
                        should.not.exist(err);
                        resolve();
                    });
            }).then(function () {
                    request(baseUrl).get("/people?filter[soulmate][$in]=robert@mailbert.com&filter[soulmate][$in]=dilbert@mailbert.com")
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            var body = JSON.parse(res.text);
                            (body.people.length).should.equal(2);
                            done();
                        });
                });
        });
        it.skip('should support $in query against many-to-many refs', function (done) {
            new Promise(function (resolve) {
                request(baseUrl).patch("/people/robert@mailbert.com")
                    .set("content-type", "application/json")
                    .send(JSON.stringify([
                        {
                            path: '/people/0/lovers',
                            op: 'replace',
                            value: ['dilbert@mailbert.com']
                        }
                    ]))
                    .end(function (err) {
                        should.not.exist(err);
                        resolve();
                    });
            }).then(function () {
                    request(baseUrl).get("/people?filter[lovers][$in]=robert@mailbert.com&filter[lovers][$in]=dilbert@mailbert.com")
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            var body = JSON.parse(res.text);
                            (body.people.length).should.equal(2);
                            done();
                        });
                });
        });
        it.skip('should support $in query against external refs values', function (done) {
            new Promise(function (resolve) {
                request(baseUrl).patch("/cars/" + ids.cars[0])
                    .set("content-type", "application/json")
                    .send(JSON.stringify([{
                        path: "/cars/0/MOT",
                        op: "replace",
                        value: "Pimp-my-ride"
                    }]))
                    .end(function (err) {
                        should.not.exist(err);
                        resolve();
                    });
            }).then(function () {
                    request(baseUrl).get("/cars?filter[MOT][$in]=Pimp-my-ride")
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            var body = JSON.parse(res.text);
                            (body.cars.length).should.equal(1);
                            done();
                        });
                });
        });
        it.skip('should be able to run $in query against nested fields', function (done) {
            request(baseUrl).get("/cars?filter[additionalDetails.seats][in]=2")
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var body = JSON.parse(res.text);
                    (body.cars[0].additionalDetails.seats).should.equal(2);
                    (body.cars.length).should.equal(1);
                    done();
                });
        });
        it.skip('should be able to run in query against links', function (done) {
            new Promise(function (resolve) {
                request(baseUrl).patch("/people/" + ids.people[1])
                    .set('content-type', 'application/json')
                    .send(JSON.stringify([
                        {op: "replace", path: '/people/0/soulmate', value: ids.people[0]}
                    ]))
                    .end(function (err) {
                        should.not.exist(err);
                        resolve();
                    });
            }).then(function () {
                    request(baseUrl).get("/people?filter[soulmate][in]=" + ids.people[0] + "," + ids.people[1])
                        .expect(200)
                        .end(function (err, res) {
                            should.not.exist(err);
                            var body = JSON.parse(res.text);
                            body.people.length.should.equal(2);
                            done();
                        });
                });
        });
        it.skip('should support or query', function (done) {
            request(baseUrl).get('/people?(name=Dilbert|name=Ratbert)&sort=name')
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var body = JSON.parse(res.text);
                    (body.people.length).should.equal(2);
                    (body.people[0].name).should.equal('Dilbert');
                    done();
                });
        });
        it('should support lt query', function (done) {
            request(baseUrl).get('/people?appearances=lt=1935')
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var body = JSON.parse(res.text);
                    (body.people.length).should.equal(1);
                    (body.people[0].name).should.equal('Wally');
                    done();
                });
        });
        it('should support le query', function (done) {
            request(baseUrl).get('/people?appearances=le=1934')
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var body = JSON.parse(res.text);
                    (body.people.length).should.equal(1);
                    (body.people[0].name).should.equal('Wally');
                    done();
                });
        });
        it('should support gt query', function (done) {
            request(baseUrl).get('/people?appearances=gt=1935')
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var body = JSON.parse(res.text);
                    (body.people.length).should.equal(1);
                    (body.people[0].name).should.equal('Dilbert');
                    done();
                });
        });
        it('should support ge query', function (done) {
            request(baseUrl).get('/people?appearances=ge=3457')
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var body = JSON.parse(res.text);
                    (body.people.length).should.equal(1);
                    (body.people[0].name).should.equal('Dilbert');
                    done();
                });
        });
        it('should have id filter', function (done) {
            request(baseUrl).get('/people?id=' + ids.people[0])
                .expect(200)
                .end(function (err, res) {
                    should.not.exist(err);
                    var body = JSON.parse(res.text);
                    (body.people[0].id).should.equal(ids.people[0]);
                    done();
                });
        });
    });
};