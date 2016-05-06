'use strict'

var Seneca = require('seneca')
var Lab = require('lab')
var CommonTests = require('seneca-store-test')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var before = lab.before

var seneca = Seneca({log: 'silent'})

if (seneca.version >= '2.0.0') {
  seneca.use('entity')
}

seneca.use('..', {
  folder: __dirname + '/db'
})

before({}, function (done) {
  seneca.ready(done)
})

var testcount = 0
seneca.__testcount = 0

describe('JSON File Store', function () {
  it('Common Tests', function (done) {
    testcount++
    CommonTests.basictest(seneca, done)
  })

  it('Common Tests Completed', function (done) {
    CommonTests.closetest(seneca, testcount, done)
  })
})
