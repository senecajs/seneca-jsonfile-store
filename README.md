seneca-jsonfile-store - a [Seneca](http://senecajs.org) plugin
======================================================

## seneca-jsonfile-store Plugin

### Node.js seneca data storage module that uses JSON files.

This module is a plugin for the Seneca framework. It provides a
storage engine that uses JSON files to persist data. It is not
appropriate for production usage, it is intended for very low
workloads, and as a example of a storage plugin code base.

[![Build Status](https://travis-ci.org/rjrodger/seneca-jsonfile-store.png?branch=master)](https://travis-ci.org/rjrodger/seneca-jsonfile-store)

For a gentle introduction to Seneca itself, see the
[senecajs.org](http://senecajs.org) site.

If you're using this plugin module, feel free to contact me on twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.2.2

Tested on: Seneca 0.6.1, Node 0.10.36



## Install

```sh
npm install seneca
npm install seneca-jsonfile-store
```


### Quick example

```JavaScript
var seneca = require('seneca')()
seneca.use('jsonfile-store',{folder:'/path/to/my-db-folder'})

var apple = seneca.make$('fruit')
apple.name  = 'Pink Lady'
apple.price = 0.99
apple.save$(function(err,apple){
  console.log( "apple.id = "+apple.id  )
})
```




## Usage

You don't use this module directly. It provides an underlying data storage engine for the Seneca entity API:

```JavaScript
var entity = seneca.make$('typename')
entity.someproperty = "something"
entity.anotherproperty = 100

entity.save$( function(err,entity){ ... } )
entity.load$( {id: ...}, function(err,entity){ ... } )
entity.list$( {property: ...}, function(err,entity){ ... } )
entity.remove$( {id: ...}, function(err,entity){ ... } )
```


## Test

```bash
cd test
mocha jsonfile.test.js --seneca.log.print
```




