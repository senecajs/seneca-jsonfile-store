/* Copyright (c) 2013-2014 Richard Rodger, MIT License */
/*jslint node: true, asi: true */

"use strict";


var seneca = require('seneca')
var shared = require('seneca-store-test')
var assert = require('assert')

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var Code = require('code');
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Code.expect;


var si = seneca({log:'silent'})
si.use('..',{
  folder: __dirname + '/db'
})

si.__testcount = 0
var testcount = 0


describe('jsonfile', function(){
  it('basic', function(done){
    testcount++
    shared.basictest(si,done)
  })

  it('extra', function(done){
    testcount++
    extratest(si,done)
  })

  it('save with passing an id$', function(done) {

    var product = si.make('product')

    product.id$ = '12345'
    product.name = 'pear'

    si.act(
      { role:'entity', cmd:'save', ent: product},
      function( err, product ) {
        assert(!err)
        assert.equal(product.id, '12345')
        done()
      })
  })

  it('close', function(done){
    shared.closetest(si,testcount,done)
  })
})



function extratest(si,done) {
  console.log('EXTRA')
  si.__testcount++
  done()
}
