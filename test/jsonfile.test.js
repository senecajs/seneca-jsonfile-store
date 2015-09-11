/* Copyright (c) 2013-2014 Richard Rodger, MIT License */

"use strict"

var Seneca = require('seneca')
var Lab = require('lab')
var CommonTests = require('seneca-store-test')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it

var seneca = Seneca({log:'silent'})
seneca.use('..', {
  folder: __dirname + '/db'
})

var testcount = 0
seneca.__testcount = 0

describe('JSON File Store', function () {
  it('Common Tests', function (done) {
    testcount++
    CommonTests.basictest(seneca, done)
  })

  it('Additional Tests', function (done) {
    CommonTests.closetest(seneca, testcount, done)
  })
})
