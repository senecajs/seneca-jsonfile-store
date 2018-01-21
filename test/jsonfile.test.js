'use strict'

var Seneca = require('seneca')
var Lab = require('lab')
var CommonTests = require('seneca-store-test')

var lab = (exports.lab = Lab.script())
var describe = lab.describe
var it = lab.it
var before = lab.before

var seneca = Seneca({ log: 'silent' })
  .use('entity')
  .use('..', {
    folder: __dirname + '/db'
  })

before({}, function(fin) {
  seneca.ready(fin)
})

describe('JSON File Store', function() {
  it('Common Tests', function(fin) {
    CommonTests.basictest(seneca, {})
    fin()
  })
})
