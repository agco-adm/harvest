var $http = require('http-as-promised');
var harvester = require('../lib/harvester');
var baseUrl = 'http://localhost:' + 8002;
var chai = require('chai');
var expect = chai.expect;
var ess = require('event-source-stream');
var _ = require('lodash');
var config = require('./config.js');
var seeder = require('./seeder.js');
var util = require('./util.js');

describe('EventSource implementation for resource changes', function () {

    var harvesterApp;
    describe('Server Sent Events', function () {
        this.timeout(30000);
        var lastEventId;

        before(function () {
            var options = util.generateCustomHarvesterOptions("test");

            harvesterApp = harvester(options).resource('book', {
                title: String,
                author: String
            });

            harvesterApp.listen(8002);

            return seeder(harvesterApp, baseUrl).dropCollections('books')
        });

        describe('When I post to the newly created resource', function () {
            it('Then I should receive a change event with data but not the one before it', function (done) {
                var that = this;
                var dataReceived;

                ess(baseUrl + '/books/changes/stream', {retry : false})
                .on('data', function(data) {

                    lastEventId = data.id;
                    var data = JSON.parse(data.data);
                    //ignore ticker data
                    if(_.isNumber(data)) {
                        //post data after we've hooked into change events and receive a ticker
                        return seeder(harvesterApp, baseUrl).seedCustomFixture({
                            books: [
                                {
                                    title: 'test title 2'
                                }
                            ]
                        });
                    }
                    if (dataReceived) return;
                    expect(_.omit(data, 'id')).to.deep.equal({title : 'test title 2'});
                    dataReceived = true;
                    done();
                });
            }
              );
        });

        describe('when I ask for events with ids greater than a certain id', function () {
            it('I should get only one event without setting a limit', function (done) {
                seeder(harvesterApp, baseUrl).seedCustomFixture({
                    books: [
                        {
                            title: 'test title 3'
                        }
                    ]
                });
                ess(baseUrl + '/books/changes/stream', {retry : false, headers : {
                    'Last-Event-ID' : lastEventId
                }}).on('data', function(data) {
                    var data = JSON.parse(data.data);
                    //ignore ticker data
                    if(_.isNumber(data)) return;
                    expect(_.omit(data, 'id')).to.deep.equal({title : 'test title 3'});
                    dataReceived = true;
                    done();
                });
            });
        });

        describe('when I ask for events with ids greater than a certain id with filters enabled', function () {
            it('I should get only one event without setting a limit', function (done) {
                seeder(harvesterApp, baseUrl).seedCustomFixture({
                    books: [
                        {
                            title: 'test title 3'
                        },
                        {
                            title: 'filtered'
                        },
                        {
                            title: 'filtered',
                            author: 'Asimov'
                        }
                    ]
                });
                ess(baseUrl + '/books/changes/stream?title=filtered&author=Asimov&limit=100', {retry : false, headers : {
                    'Last-Event-ID' : lastEventId
                }}).on('data', function(data) {
                    var data = JSON.parse(data.data);
                    //ignore ticker data
                    if(_.isNumber(data)) return;
                    expect(_.omit(data, 'id')).to.deep.equal({title : 'filtered', author : 'Asimov'});
                    dataReceived = true;
                    done();
                });
            });
        });
    });
});
