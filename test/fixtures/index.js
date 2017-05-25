'use strict';
let _ = require('lodash');
let fs = require('fs');
let path = require('path');

function FixturesSync() {
  let fixtureList = fs
    .readdirSync(path.join(__dirname, './'))
    .filter(function(item) {
      return item !== 'index.js';
    });
  let fixtures;

  if (!fixtures) {
    fixtures = {};
    _.forEach(fixtureList, function A(value) {
      fixtures[path.basename(value, '.js')] = require('./' + value);
    });
  }
  return fixtures;
}

let standardFixture = FixturesSync();

module.exports = function() {
  return _.cloneDeep(standardFixture);
};
