![Seneca](http://senecajs.org/files/assets/seneca-logo.png)

> A [Seneca.js][] data storage plugin

# seneca-jsonfile-store
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter][gitter-badge]][gitter-url]

## Description
This module is a plugin for [Seneca.js][]. It provides a storage engine that uses JSON files to
persist data. This module is not appropriate for production usage, it is intended for very low
workloads, and as a example of a storage plugin code base.

For a gentle introduction to Seneca itself, see the [senecajs.org][seneca.js] site.

### Seneca compatibility
Supports Seneca versions **1.x** and **2.x**

## Install
To install, simply use npm. Remember you will need to install [Seneca.js][] separately.

```sh
npm install seneca
npm install seneca-jsonfile-store
```

## Usage
You don't use this module directly. It provides an underlying data storage engine
for the Seneca entity API:

```js
var entity = seneca.make$('typename')
entity.someproperty = "something"
entity.anotherproperty = 100

entity.save$(function (err, entity) { ... })
entity.load$({ id: ... }, function (err, entity) { ... })
entity.list$({ property: ... }, function (err, entity) { ... })
entity.remove$({ id: ... }, function (err, entity) { ... })
```

## Quick Example
```js
var seneca = require('seneca')()
seneca.use('jsonfile-store', {
  folder:'/path/to/my-db-folder'
})

var apple = seneca.make$('fruit')
apple.name  = 'Pink Lady'
apple.price = 0.99
apple.save$(function (err, apple) {
  console.log("apple.id = " + apple.id )
})
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
The [Senecajs org][] encourages open participation. If you feel you
can help in any way, be it with documentation, examples, extra
testing, or new features please get in touch.

## Test
To run tests, simply use npm:

```sh
npm run test
```

## License
Copyright (c) 2012-2016, Richard Rodger and other contributors.
Licensed under [MIT][].

[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
[npm-badge]: https://img.shields.io/npm/v/seneca-jsonfile-store.svg
[npm-url]: https://npmjs.com/package/seneca-jsonfile-store
[david-badge]: https://david-dm.org/rjrodger/seneca-jsonfile-store.svg
[david-url]: https://david-dm.org/rjrodger/seneca-jsonfile-store
[travis-badge]: https://travis-ci.org/senecajs/seneca-jsonfile-store.svg
[travis-url]: https://travis-ci.org/senecajs/seneca-jsonfile-store
[gitter-badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/senecajs/seneca
