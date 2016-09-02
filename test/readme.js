var seneca = require('seneca')()

if (seneca.version >= '3.0.0') {
  seneca.use(require('seneca-basic'))
}

if (seneca.version >= '2.0.0') {
  seneca.use(require('seneca-entity'))
}

seneca.use('..', {folder: __dirname + '/db'})

var apple = seneca.make$('fruit')
apple.name = 'Pink Lady'
apple.price = 0.99
apple.save$(function (err, apple) {
  if (err) {
    console.log()
  }
  console.log('apple.id = ' + apple.id)
})
