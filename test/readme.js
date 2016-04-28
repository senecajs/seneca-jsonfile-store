var seneca = require('seneca')()
seneca.use('jsonfile-store', {folder: __dirname + '/db'})

var apple = seneca.make$('fruit')
apple.name = 'Pink Lady'
apple.price = 0.99
apple.save$(function (err, apple) {
  console.log('apple.id = ' + apple.id)
})
