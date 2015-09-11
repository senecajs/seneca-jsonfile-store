# seneca-jsonfile-store

> A [Seneca.js][] data storage plugin

[![travis][travis-badge]][travis-url]
[![npm][npm-badge]][npm-url]

This module is a plugin for [Seneca.js][]. It provides a storage engine that uses
JSON files to persist data. It is not appropriate for production usage, it is
intended for very low workloads, and as a example of a storage plugin code base.


For a gentle introduction to Seneca itself, see the [senecajs.org][seneca.js] site.

If you're using this plugin module, feel free to contact me on twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)


## Install
To install, simply use npm. Remember you will need to install [Seneca.js][]
seperately.

```
npm install seneca
npm install seneca-jsonfile-store
```

## Test
To run tests, simply use npm:

```
npm run test
```

## Example

```js
var seneca = require('seneca')()
seneca.use('jsonfile-store', { folder:'/path/to/my-db-folder' })

var apple = seneca.make$('fruit')
apple.name  = 'Pink Lady'
apple.price = 0.99
apple.save$(function (err, apple) {
  console.log("apple.id = " + apple.id )
})
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

## Contributing
We encourage participation. If you feel you can help in any way, be it with
examples, extra testing, or new features please get in touch.

## License

Copyright Richard Rodger 2015, Licensed under [MIT][].

[MIT]: ./LICENSE
[Contribution Guide]: ./CONTRIBUTING.md
[eg]: ./eg/basic-usage.js

[travis-badge]: https://img.shields.io/travis/rjrodger/seneca-jsonfile-store.svg?style=flat-square
[travis-url]: https://travis-ci.org/rjrodger/seneca-jsonfile-store
[npm-badge]: https://img.shields.io/npm/v/seneca-jsonfile-store.svg?style=flat-square
[npm-url]: https://npmjs.org/package/seneca-jsonfile-store

[Seneca.js]: https://www.npmjs.com/package/seneca
