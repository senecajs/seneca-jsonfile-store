/* Copyright (c) 2013-2014 Richard Rodger, MIT License */
/*jslint node: true, asi: true */
/*globals describe, it */
"use strict";


var seneca = require('seneca')
var shared = require('seneca-store-test')
var assert = require('assert')



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

