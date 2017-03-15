'use strict'

var Seneca = require('seneca')
var Lab = require('lab')
var CommonTests = require('seneca-store-test')

var lab = exports.lab = Lab.script()
var describe = lab.describe
var it = lab.it
var before = lab.before

var seneca = Seneca()

if (seneca.version >= '2.0.0') {
  seneca.use('entity')
}

seneca.use('..', {
  folder: __dirname + '/db'
})

before({}, function (done) {
  seneca.ready(done)
})

seneca.__testcount = 0

describe('JSON File Store', function () {
  it('Common Tests', function (done) {
    CommonTests.basictest({seneca: seneca, script: lab})
    done()
  })
})
