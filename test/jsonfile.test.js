/* Copyright (c) 2013 Richard Rodger, MIT License */

"use strict";


var seneca = require('seneca')
var shared = seneca.test.store.shared

//var m = require('..')
//console.dir(m)


var si = seneca()
si.use(require('..'),{
  folder:'db'
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

  it('close', function(done){
    shared.closetest(si,testcount,done)
  })
})



function extratest(si,done) {
  console.log('EXTRA')
  si.__testcount++
  done()
}
