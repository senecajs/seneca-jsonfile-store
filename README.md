![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] data storage plugin.

# @seneca/jsonfile-store

[![npm version][npm-badge]][npm-url]
[![Gitter][gitter-badge]][gitter-url]

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Description
This module is a plugin for [Seneca.js][]. It provides a storage engine that uses JSON files to
persist data. This module is not appropriate for production usage, it is intended for very low
workloads, and as a example of a storage plugin code base.

For a gentle introduction to Seneca itself, see the [senecajs.org][seneca.js] site.

### Seneca compatibility
Supports Seneca **4** (`seneca` `^4.0.0`) with `@seneca/entity` `^29.0.0`,
on Node.js 24 or later. Seneca 3 users stay on `seneca-jsonfile-store@1`.

### Supported functionality
All Seneca data store supported functionality is implemented in [@seneca/store-test](https://github.com/senecajs/seneca-store-test) as a test suite. The tests represent the store functionality specifications.

## Install

To install, simply use npm. Remember you will need to install [Seneca.js][]
and `@seneca/entity` separately.

```sh
npm install seneca@^4 @seneca/entity @seneca/jsonfile-store
```

## Quick Example

```js
var seneca = require('seneca')()
seneca
  .use('@seneca/entity')
  .use('@seneca/jsonfile-store', {
    folder: '/path/to/my-db-folder'
  })

var apple = seneca.make$('fruit')
apple.name  = 'Pink Lady'
apple.price = 0.99
apple.save$(function (err, apple) {
  console.log("apple.id = " + apple.id )
})
```

### Options

- `folder`: the folder that holds the data, one subfolder per entity type.
  It must exist. Default: the current folder.
- `merge`: `save$` of an existing entity merges the new fields into the
  stored ones, so fields absent from the update are kept. `false` replaces
  the stored entity. A single save can also set `merge$: false` on the
  entity. Default: `true`.

### Query Support
The standard Seneca query format is supported:

- `.list$({f1:v1, f2:v2, ...})` implies pseudo-query `f1==v1 AND f2==v2, ...`.

- `.list$({f1:v1,...}, {sort$:{field1:1}})` means sort by f1, ascending.

- `.list$({f1:v1,...}, {sort$:{field1:-1}})` means sort by f1, descending.

- `.list$({f1:v1,...}, {limit$:10})` means only return 10 results.

- `.list$({f1:v1,...}, {skip$:5})` means skip the first 5.

- `.list$({f1:v1,...}, {fields$:['fd1','f2']})` means only return the listed fields.

Note: you can use `sort$`, `limit$`, `skip$` and `fields$` together.

## More Examples

See [test/](test/) for usage examples.

## Motivation

This module is a plugin for [Seneca.js][]. It provides a storage engine that uses JSON files to persist data. Not appropriate for production usage — intended for low workloads and as an example of a storage plugin.

## Support

If you're using this module and need help, you can:

- Post a [github issue][]
- Tweet to [@senecajs][]
- Ask on the [Gitter][gitter-url]

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

- `.list$({f1:v1, f2:v2, ...})` implies pseudo-query `f1==v1 AND f2==v2, ...`.
- `.list$({f1:v1,...}, {sort$:{field1:1}})` means sort by f1, ascending.
- `.list$({f1:v1,...}, {sort$:{field1:-1}})` means sort by f1, descending.
- `.list$({f1:v1,...}, {limit$:10})` means only return 10 results.
- `.list$({f1:v1,...}, {skip$:5})` means skip the first 5.
- `.list$({f1:v1,...}, {fields$:['fd1','f2']})` means only return the listed fields.

## Contributing

The [Senecajs org][] encourages open participation. If you feel you
can help in any way, be it with documentation, examples, extra
testing, or new features please get in touch.


### Running tests

```sh
npm run test
```

## Background

This plugin stores data as JSON files on disk.

[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
[npm-badge]: https://img.shields.io/npm/v/@seneca/jsonfile-store.svg
[npm-url]: https://npmjs.com/package/@seneca/jsonfile-store
[gitter-badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/senecajs/seneca
