# Changes

## 2.0.0 2026-11-20

First version published as `@seneca/jsonfile-store`. Versions up to
1.1.0 were published as `seneca-jsonfile-store`.

* Seneca 4: the peer dependencies are `seneca` `^4.0.0` and
  `@seneca/entity` `^29.0.0`. Seneca 3 is no longer supported; Seneca 3
  users stay on `seneca-jsonfile-store@1`.
* Renamed from `seneca-jsonfile-store` to `@seneca/jsonfile-store`.
* Node.js 24 or later (`engines.node` `>=24`).
* The store registers through the `entity/init` export of
  `@seneca/entity` (the `seneca.store.init` API of old `seneca-entity`
  versions is gone). Load `@seneca/entity` before this plugin, by its
  full name; without it the plugin fails to load with a message that
  says so.
* `save$` of an existing entity merges into the stored file: fields
  absent from the update are kept. The option `merge: false`, or
  `merge$: false` on the entity, replaces the file as before. The
  option `must_merge`, which made every save fail with
  `store-merge-unsupported`, is removed.
* `save$` replies with a copy of the stored data, with dates as `Date`
  objects as `load$` gives them.
* `save$` writes a temporary file in the entity folder and renames it
  over the entity file, so that `load$` and `list$` never read a partly
  written file. Saves of the same entity in one process run in turn, so
  that concurrent merges are not lost. A file that is not valid JSON is
  an `entity_error` for the action instead of an uncaught exception.
* Errors (`folder-not-found`, `folder-not-writable`, `entity_error`)
  are created again on Node.js 24: `eraro` moves from 1.1 to `^3.1.1`,
  because `eraro` 1.1 calls `util.isError`, which Node.js 23 removed.
* `seneca.util.deepextend` is replaced by `seneca.util.deep` (no
  `SENECA_DEP_UTIL_DEEPEXTEND` warning), and the deprecated
  `fs.exists` by `fs.stat`.
* Tests run with `@hapi/lab` 26 and the basic group of
  `@seneca/store-test` 7. Travis CI configuration removed.
* `package-lock.json` is no longer committed.

## 1.1.0 2018-12-02

Published to npm from commit 435023f, which was merged into the default
branch only for 2.0.0.

* `list$` accepts an id or an array of ids.
* `save$` replies with a copy of the saved entity.
* `remove$` with an empty query removes nothing.
* `native$` gives the plugin options.

## 0.3.0 2-09-2016

* Enhance ensurefolder functionality PR#8
* Updated dependencies
* Added Seneca 3 and Node 6 support
* Dropped Node 0.10, 0.12, 5 support
