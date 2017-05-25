'use strict';
let should = require('should');
let _ = require('lodash');
let request = require('supertest');
let Promise = require('bluebird');

let seeder = require('./seeder.js');

describe('includes', function() {
  var config, ids;

  function setupLinks(_ids) {
    ids = _ids;

    function link(resource, resourceId, link, linkId) {
      const url = `/${resource}/${resourceId}`;

      return new Promise(function(resolve) {
        var data = {
          [resource]: [
            {
              links: {
                [link]: linkId,
              },
            },
          ],
        };
        request(config.baseUrl)
          .put(url)
          .set('Content-Type', 'application/json')
          .send(JSON.stringify(data))
          .end(function(err, res) {
            res.statusCode.should.be.equal(200);
            should.not.exist(err);
            setTimeout(resolve, 100); //sometimes tests fail if resolve is called immediately, probably mongo has problems indexing concurrently
          });
      });
    }

    return Promise.all([
      link('people', ids.people[0], 'soulmate', ids.people[1]),
      link('people', ids.people[1], 'soulmate', ids.people[0]),
      link('people', ids.people[0], 'lovers', [ids.people[1]]),
      link('pets', ids.pets[0], 'owner', ids.people[0]),
      link('pets', ids.pets[0], 'food', ids.foobars[0]),
      link('collars', ids.collars[0], 'collarOwner', ids.pets[0]),
    ]);
  }

  beforeEach(function() {
    config = this.config;
    return seeder(this.harvesterApp)
      .dropCollectionsAndSeed('people', 'pets', 'collars', 'foobars')
      .then(setupLinks);
  });

  describe('many to many', function() {
    it('should include referenced lovers when querying people', function(done) {
      request(config.baseUrl)
        .get('/people?include=lovers')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          var body = JSON.parse(res.text);
          should.exist(body.linked);
          body.linked.should.be.an.Object;
          body.linked.people.should.be.an.Array;
          body.linked.people.length.should.be.above(0);
          done();
        });
    });
  });
  describe('one to one', function() {
    it('should include soulmate when querying people', function(done) {
      request(config.baseUrl)
        .get('/people?include=soulmate')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          var body = JSON.parse(res.text);
          body.linked.should.be.an.Object;
          body.linked.people.should.be.an.Array;
          body.linked.people.length.should.equal(2);
          done();
        });
    });
  });
  // Todo: add test for "," support.

  describe('repeated entities', function() {
    it('should deduplicate included soulmate & lovers when querying people', function(
      done
    ) {
      request(config.baseUrl)
        .get('/people?include=soulmate,lovers')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          var body = JSON.parse(res.text);
          body.linked.should.be.an.Object;
          body.linked.people.should.be.an.Array;
          var log = {};
          _.each(body.linked.people, function(person) {
            should.not.exist(log[person.id]);
            log[person.id] = person;
          });
          done();
        });
    });
  });

  describe('compound documents', function() {
    it('should include pet and person when querying collars', function(done) {
      request(config.baseUrl)
        .get(
          '/collars?include=collarOwner.owner.soulmate,collarOwner.food,collarOwner,collarOwner.owner'
        )
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          var body = JSON.parse(res.text);
          should.exist(body.linked);
          body.linked.should.be.an.Object;
          body.linked.pets.should.be.an.Array;
          body.linked.pets.length.should.be.equal(1);
          body.linked.people.should.be.an.Array;
          body.linked.people.length.should.be.equal(2);
          body.linked.foobars.should.be.an.Array;
          body.linked.foobars.length.should.be.equal(1);
          done();
        });
    });
  });

  describe('empty inclusion array', function() {
    it('should NOT throw error', function() {
      var includes = require('../lib/includes.js')(
        this.harvesterApp,
        this.harvesterApp._schema
      );
      includes.linked({ people: [] }, []);
    });
  });
});
