var seneca = require('seneca')()

seneca.use('@seneca/entity')
seneca.use('..', { folder: __dirname + '/db' })

var apple = seneca.make$('fruit')
apple.name = 'Pink Lady'
apple.price = 0.99
apple.save$(function(err, apple) {
  if (err) {
    console.log(err)
  }
  console.log('apple.id = ' + apple.id)
})
