# Harvester.js 

Easily create [JSONAPI](http://jsonapi.org/)-compliant APIs on top of node.js and mongoDB.

Pluggable with the [agco JSON-API extension](https://github.com/agco/agco-json-api-profiles) profile implementation : [Elastic Harvester](https://github.com/agco/elastic-harvesterjs), which offers additional features such as [linked resource filtering and aggregation](https://github.com/agco/agco-json-api-profiles/blob/master/public/search-profile.md).

##### Documentation 

Harvesterjs is currently under heavy development, we are reworking the DSL and adding a bunch of big new features. 
   
Documentation is a pretty sparse right now, however when the dust settles a bit we will get this into proper shape with reference docs, tutorials and screencasts.


### JSON-API Features 

- [Resource Relationships](http://jsonapi.org/format/#document-structure-resource-relationships) 
- [URL Templates](http://jsonapi.org/format/#document-structure-url-templates)
- [Filtering](http://jsonapi.org/format/#fetching-filtering)
- [Inclusion of Linked Resources](http://jsonapi.org/format/#fetching-includes)
- [Sparse fieldsets](http://jsonapi.org/format/#fetching-sparse-fieldsets)
- [Sorting](http://jsonapi.org/format/#fetching-sorting)
- [CRUD](http://jsonapi.org/format/#crud)
- [Errors](http://jsonapi.org/format/#errors)

### Other Features 

- Offset based pagination
- node-swagger-express ready
- Extended filter operators : lt, gt, lte, gte
- Mongodb change events - oplog integration 

### Roadmap

* JSON API 1.0 compliance
* validation with [joi](https://github.com/hapijs/joi)
* brand [new DSL](https://github.com/agco/harvesterjs/issues/88) with sensible defaults
* [External links](https://github.com/agco/harvesterjs/issues/69)
* [Bidirectional links](https://github.com/agco/harvesterjs/issues/81)
* [UUIDs](https://github.com/agco/harvesterjs/issues/24)

### References
This project is a fork of [fortune.js](http://fortune.js.org). Decision to fork was driven by the a) desire to keep as JSONAPI compliant as possible and b) the simplification and power derived from focusing exclusively on mongoDB as the data back-end.

[![NPM](https://nodei.co/npm/harvesterjs.png)](https://nodei.co/npm/harvesterjs/)
 
[![Build Status](https://travis-ci.org/agco/harvesterjs.svg?branch=master)](https://travis-ci.org/agco/harvesterjs)
[![Coverage Status](https://coveralls.io/repos/agco/harvesterjs/badge.svg)](https://coveralls.io/r/agco/harvesterjs)
