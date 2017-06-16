'use strict'

var aws = require('aws-sdk')

var Buffer = require('buffer').Buffer
var Path = require('path')

var _ = require('lodash')
var error = require('eraro')({ package: 'seneca-s3-bucket-store' })

var name = 's3-bucket-store'

module.exports = jsonfile_store
Object.defineProperty(module.exports, 'name', { value: 's3-bucket-store' })

function jsonfile_store(options) {

  var s3 = new aws.S3({ region: options.aws.region });

  var s3Fs = {
    bucketName: '',
    exists: function (folder, cb) {
      s3.headBucket({ Bucket: folder }, function (err, data) {
        cb(!err)
      })
    },
    createBucket: function (name, region, cb) {
      this.bucketName = name;
      s3.createBucket({
        Bucket: name,
        CreateBucketConfiguration: {
          LocationConstraint: region
        }
      }, cb)
    },
    uploadFile: function (key, body, cb) {
      s3.upload({
        Bucket: this.bucketName,
        Key: key,
        Body: body
      }, cb)
    },
    stat: function (key, cb) {
      s3.headObject({
        Bucket: this.bucketName,
        Key: key
      }, cb)
    },
    readFile: function (key, cb) {
      s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }, function (err, data) {
        if (err) cb(err, data)
        else {
          cb(err, Buffer.from(data.Body).toString())
        }
      })
    },
    rename: function (key, new_key, cb) {
      var bucketName = this.bucketName

      s3.copyObject({
        Bucket: bucketName,
        Key: new_key,
        CopySource: `${this.bucketName}/${key}`
      }, function (err, data) {
        if (err) cb(err, data)
        else {
          s3.deleteObject({
            Bucket: bucketName,
            Key: key
          }, cb)
        }
      })
    },
    listFiles: function (key, cb) {
      var fileList = []
      var bucketName = this.bucketName

      var listCallback = function (err, data) {
        if (err) cb(err, fileList)

        for (var i = 0; i < data.Contents.length; i++) {
          fileList.push(data.Contents[i].Key)
        }

        if (data.IsTruncated) {
          s3.listObjectsV2({
            Bucket: bucketName,
            ContinuationToken: data.NextContinuationToken
          }, listCallback)
        } else {
          cb(null, fileList)
        }
      }

      s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: key
      }, listCallback)

    }
  }

  var seneca = this

  seneca.depends('s3-bucket-store', ['entity'])

  options = seneca.util.deepextend(
    {
      must_merge: false,

      // TODO: use seneca.export once it allows for null values
      generate_id: seneca.root.private$.exports['entity/generate_id']
    },
    options
  )

  options.folder = Path.normalize(options.folder || '.')

  var isodate_re = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
  var filename_re = /\.json$/

  // FIX: this is a bit silly, refactor out
  function good(args, err, cb) {
    if (err) {
      cb(error('entity_error', { store: name, error: err, args: args }))
      return false
    } else return true
  }

  function makefolderpath(ent) {
    var canon = ent.canon$({ object: true })
    var base = canon.base
    var name = canon.name

    var entfolder = (base ? base + '_' : '') + name
    var folderpath = Path.join(options.folder, entfolder)

    return folderpath
  }

  function do_load(args, qent, filepath, cb) {
    s3Fs.readFile(filepath, function (err, jsonstr) {
      if (err) {
        return cb(error('read-file_entity_error', { store: name, error: err, args: args }))
      } else {
        // TODO: handle JSON parse error
        var data = JSON.parse(jsonstr, function (key, val) {
          if (_.isString(val)) {
            if (val.match(isodate_re)) {
              return new Date(val)
            } else return val
          } else return val
        })
        var fent = qent.make$(data)
        cb(null, fent)
      }
    })
  }

  function do_list(args, qent, q, cb) {
    // used by load, list, remove
    var entlist = []

    var folderpath = makefolderpath(qent)

    if (good(args, err, cb)) {
      s3Fs.listFiles(folderpath, function (err, filelist) {
        if (err) cb(error('list-files_entity_error', { store: name, error: err, args: args }))

        nextfile(0)

        function nextfile(i) {
          var filename = filelist[i]
          if (filename) {
            if (filename.match(filename_re)) {
              var filepath = Path.join(folderpath, filename)
              do_load(args, qent, filepath, function (err, fent) {
                if (good(args, err, cb)) {
                  // match query
                  for (var p in q) {
                    if (!~p.indexOf('$') && q[p] !== fent[p]) {
                      return nextfile(i + 1)
                    }
                  }
                  entlist.push(fent)
                  nextfile(i + 1)
                }
              })
            } else nextfile(i + 1)
          } else cb(null, entlist)
        }
      })
    }

  }

  function do_remove(args, q, ent, cb) {
    var folderpath = makefolderpath(ent)

    if (good(args, err, cb)) {
      var filepath = Path.join(folderpath, ent.id + '.json')
      var filepath_DELETE = Path.join(folderpath, ent.id + '.json.DELETE')

      s3Fs.rename(filepath, filepath_DELETE, function (err) {
        if (err) {
          cb(error('rename_entity_error', { store: name, error: err, args: args }))
        } else cb()
      })
    }

  }

  var store = {
    name: name,

    save: function (args, cb) {
      var ent = args.ent
      var create = !ent.id

      if (null != ent.id$) {
        var id = ent.id$
        delete ent.id$
        do_save(id)
      } else if (create) {
        id = options.generate_id ? options.generate_id() : void 0

        if (undefined !== id) {
          return do_save(id)
        } else {
          seneca.act({ role: 'basic', cmd: 'generate_id' }, function (err, id) {
            if (err) return cb(err)
            do_save(id)
          })
        }
      } else do_save()

      function do_save(id) {
        if (id) {
          ent.id = id
        }

        var folderpath = makefolderpath(ent)

        function handledate_replacer(key, val) {
          if (_.isDate(val)) {
            return val.toISOString()
          } else return val
        }

        if (good(args, err, cb)) {
          var filepath = Path.join(folderpath, ent.id + '.json')
          var entdata = ent.data$()
          var jsonstr = JSON.stringify(entdata, handledate_replacer)

          if (options.must_merge) {
            return cb(error('store-merge-unsupported', { args: args }))
          }

          s3Fs.uploadFile(filepath, jsonstr, function (err) {
            if (good(args, err, cb)) {
              seneca.log.debug(
                args.actid$,
                'save/' + (create ? 'insert' : 'update'),
                ent,
                desc
              )
              cb(null, ent)
            }
          })
        }

      }
    },

    load: function (args, cb) {
      var qent = args.qent
      var q = args.q

      if (q.id) {
        var folderpath = makefolderpath(qent)

        if (good(args, err, cb)) {
          var filepath = Path.join(folderpath, q.id + '.json')

          do_load(args, qent, filepath, function (err, fent) {
            if (good(args, err, cb)) {
              seneca.log.debug(args.actid$, 'load', q, fent, desc)
              cb(null, fent)
            }
          })
        }

      } else {
        do_list(args, qent, q, function (err, entlist) {
          if (good(args, err, cb)) {
            cb(null, entlist[0])
          }
        })
      }
    },

    list: function (args, cb) {
      var qent = args.qent
      var q = args.q
      do_list(args, qent, q, cb)
    },

    remove: function (args, cb) {
      var qent = args.qent
      var q = args.q

      var all = q.all$ // default false
      var load = _.isUndefined(q.load$) ? true : q.load$ // default true

      if (all) {
        do_list(args, qent, q, function (err, entlist) {
          function next_remove(i) {
            var ent = entlist[i]
            if (ent) {
              do_remove(args, q, ent, function (err) {
                if (good(args, err, cb)) {
                  next_remove(i + 1)
                }
              })
            } else return cb()
          }

          if (good(args, err, cb)) {
            next_remove(0)
          }
        })
      } else {
        q.limit$ = 1
        do_list(args, qent, q, function (err, list) {
          if (good(args, err, cb)) {
            var fent = list[0]
            if (fent) {
              do_remove(args, q, fent, function (err) {
                if (good(args, err, cb)) {
                  cb(null, load ? fent : null)
                }
              })
            } else cb(null, null)
          }
        })
      }
    },

    close: function (args, done) {
      done()
    },

    native: function (args, done) {
      done(null, options.folder)
    }
  }

  var storedesc = seneca.store.init(seneca, options, store)
  var tag = storedesc.tag
  var desc = storedesc.desc

  seneca.add({ init: store.name, tag: tag }, function (args, done) {
    s3Fs.exists(options.folder, function (exists) {
      if (!exists) {
        s3Fs.createBucket(
          options.folder,
          options.aws.region,
          function (err, data) {
            if (err) {
              return done(
                error('bucket-not-created', { folder: options.folder, store: desc, error: err })
              )
            }
          })
      }

      s3Fs.uploadFile(
        Path.join(options.folder, 'seneca.txt'),
        'This is a s3-bucket-store folder.',
        function (err) {
          if (err) {
            return done(
              error('bucket-not-writable', {
                folder: options.folder,
                store: desc,
                error: err
              })
            )
          }

          return done()
        })

    })
  })

  return { name: store.name, tag: tag }
}
