![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js](http://senecajs.org) plugin

# seneca-jsonfile-store

[![npm version](https://img.shields.io/npm/v/seneca-jsonfile-store.svg)](https://npmjs.com/package/seneca-jsonfile-store)
[![build](https://github.com/senecajs/seneca-jsonfile-store/actions/workflows/build.yml/badge.svg)](https://github.com/senecajs/seneca-jsonfile-store/actions/workflows/build.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/senecajs/seneca-jsonfile-store/badge.svg)](https://snyk.io/test/github/senecajs/seneca-jsonfile-store)

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

A [Seneca.js](http://senecajs.org) entity store using JSON files.

## Install

```sh
npm install seneca
npm install seneca-jsonfile-store
```

## Quick Example

```js
var seneca = require('seneca')()
seneca.use('jsonfile-store', {
  folder:'/path/to/my-db-folder'
})
.use('entity')

var apple = seneca.make$('fruit')
apple.name  = 'Pink Lady'
apple.price = 0.99
apple.save$(function (err, apple) {
  console.log("apple.id = " + apple.id)
})
```

## More Examples

See [test/](test/) for more usage examples.

## Motivation

A storage engine that uses JSON files to persist data. Not appropriate for production usage — intended for low workloads and as an example of a storage plugin.

## Support

If you're using this module and need help, you can:

- Post a [github issue](https://github.com/senecajs/seneca-jsonfile-store/issues)
- Tweet to [@senecajs](http://twitter.com/senecajs)
- Ask on the [Gitter](https://gitter.im/senecajs/seneca)

## API

You don't use this module directly. It provides an underlying data storage engine for the Seneca entity API:

```js
var entity = seneca.make$('typename')
entity.someproperty = "something"
entity.anotherproperty = 100

entity.save$(function (err, entity) { ... })
entity.load$({id: ... }, function (err, entity) { ... })
entity.list$({property: ... }, function (err, entity) { ... })
entity.remove$({id: ... }, function (err, entity) { ... })
```

### Query Support

The standard Seneca query format is supported:

- `.list$({f1:v1, f2:v2, ...})` implies pseudo-query `f1==v1 AND f2==v2, ...`.
- `.list$({f1:v1,...}, {sort$:{field1:1}})` means sort by f1, ascending.
- `.list$({f1:v1,...}, {sort$:{field1:-1}})` means sort by f1, descending.
- `.list$({f1:v1,...}, {limit$:10})` means only return 10 results.
- `.list$({f1:v1,...}, {skip$:5})` means skip the first 5.
- `.list$({f1:v1,...}, {fields$:['fd1','f2']})` means only return the listed fields.

Note: you can use `sort$`, `limit$`, `skip$` and `fields$` together.

## Contributing

The [Senecajs org](https://github.com/senecajs/) encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

## Background

This plugin stores data as JSON files on disk. Supports Seneca versions **1.x** - **3.x**.

All Seneca data store supported functionality is implemented in [seneca-store-test](https://github.com/senecajs/seneca-store-test) as a test suite. The tests represent the store functionality specifications.
