'use strict'

var Fs = require('fs')
var Path = require('path')

var _ = require('lodash')
var error = require('eraro')({ package: 'seneca-jsonfile-store' })

var name = 'jsonfile-store'

// Saves of the same file, queued by file path, across store instances.
var savequeues = {}
var tmpcount = 0

module.exports = jsonfile_store
Object.defineProperty(module.exports, 'name', { value: 'jsonfile-store' })

function jsonfile_store(options) {
  var seneca = this

  seneca.depends('jsonfile-store', ['entity'])

  options = seneca.util.deep(
    {
      // save$ merges into the stored entity; false replaces it.
      merge: true,

      // TODO: use seneca.export once it allows for null values
      generate_id: seneca.root.private$.exports['entity/generate_id']
    },
    options
  )

  options.folder = Path.normalize(options.folder || '.')

  var isodate_re = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
  var filename_re = /\.json$/

  // Reject ids containing path separators or '..' so that they cannot be
  // used to escape the configured storage folder (path traversal).
  function safe_id(id) {
    var idstr = String(id)
    return !/[\/\\]/.test(idstr) && '.' !== idstr && '..' !== idstr
  }

  function parse_json(jsonstr) {
    return JSON.parse(jsonstr, function(key, val) {
      if (_.isString(val)) {
        if (val.match(isodate_re)) {
          return new Date(val)
        } else return val
      } else return val
    })
  }

  // FIX: this is a bit silly, refactor out
  function good(args, err, cb) {
    if (err) {
      cb(error('entity_error', { store: name, error: err, args: args }))
      return false
    } else return true
  }

  /**
   * Return if the folder exists, create otherwise.
   */
  function ensurefolder(folder, cb) {
    Fs.stat(folder, function(err, stat) {
      if (!err && stat.isDirectory()) {
        return cb()
      }
      Fs.mkdir(folder, function(err) {
        if (err && err.code === 'EEXIST') {
          err = null
        }
        cb(err)
      })
    })
  }

  function makefolderpath(ent) {
    var canon = ent.canon$({ object: true })
    var base = canon.base
    var name = canon.name

    var entfolder = (base ? base + '_' : '') + name
    var folderpath = Path.join(options.folder, entfolder)

    return folderpath
  }

  /**
   * Run the saves of the same file one at a time, so that a merge reads
   * the file that the previous save wrote.
   */
  function inturn(filepath, task, cb) {
    var key = Path.resolve(filepath)
    var queue = savequeues[key] || (savequeues[key] = [])
    queue.push(function() {
      task(function() {
        queue.shift()
        if (queue.length) {
          queue[0]()
        } else delete savequeues[key]
        cb.apply(null, arguments)
      })
    })
    if (1 === queue.length) {
      queue[0]()
    }
  }

  /**
   * Write a temporary file in the same folder and rename it over the
   * target, so that readers never see a partly written file.
   */
  function writefile(filepath, jsonstr, cb) {
    var tmppath = filepath + '.' + process.pid + '.' + ++tmpcount + '.tmp'
    Fs.writeFile(tmppath, jsonstr, function(err) {
      if (err) {
        return Fs.unlink(tmppath, function() {
          cb(err)
        })
      }
      Fs.rename(tmppath, filepath, cb)
    })
  }

  function do_load(args, qent, filepath, cb) {
    Fs.readFile(filepath, function(err, jsonstr) {
      if (err && 'ENOENT' === err.code) {
        return cb(null, null)
      } else if (good(args, err, cb)) {
        try {
          var data = parse_json(jsonstr)
        } catch (err) {
          return good(args, err, cb)
        }
        var fent = qent.make$(data)
        cb(null, fent)
      }
    })
  }

  function do_list(args, qent, q, cb) {
    // used by load, list, remove
    var entlist = []

    // Place id inside an array
    if('string' === typeof q) {
      q = [q]
    }
    
    var folderpath = makefolderpath(qent)
    ensurefolder(folderpath, function(err) {
      if (good(args, err, cb)) {
        Fs.readdir(folderpath, function(err, filelist) {
          if (good(args, err, cb)) {
            nextfile(0)
          }

          function nextfile(i) {
            var filename = filelist[i]
            if (filename) {
              if (filename.match(filename_re)) {
                var filepath = Path.join(folderpath, filename)
                do_load(args, qent, filepath, function(err, fent) {
                  if (good(args, err, cb)) {
                    // match query
                    if(Array.isArray(q)) {
                      if(-1 != q.indexOf(fent.id)) {
                        entlist.push(fent)
                      }
                      nextfile(i + 1)
                    }
                    else {
                      for (var p in q) {
                        if (!~p.indexOf('$') && q[p] !== fent[p]) {
                          return nextfile(i + 1)
                        }
                      }
                      entlist.push(fent)
                      nextfile(i + 1)
                    }
                  }
                })
              } else nextfile(i + 1)
            } else cb(null, entlist)
          }
        })
      }
    })
  }

  function do_remove(args, q, ent, cb) {
    if (!safe_id(ent.id)) {
      return cb(error('invalid-id', { id: ent.id, store: name }))
    }

    var folderpath = makefolderpath(ent)
    ensurefolder(folderpath, function(err) {
      if (good(args, err, cb)) {
        var filepath = Path.join(folderpath, ent.id + '.json')
        var filepath_DELETE = Path.join(folderpath, ent.id + '.json.DELETE')

        Fs.rename(filepath, filepath_DELETE, function(err) {
          if (good(args, err, cb)) {
            cb()
          }
        })
      }
    })
  }

  var store = {
    name: name,

    save: function(args, cb) {
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
          seneca.act({ role: 'basic', cmd: 'generate_id' }, function(err, id) {
            if (err) return cb(err)
            do_save(id)
          })
        }
      } else do_save()

      function do_save(id) {
        if (id) {
          ent.id = id
        }

        if (!safe_id(ent.id)) {
          return cb(error('invalid-id', { id: ent.id, store: name }))
        }

        var folderpath = makefolderpath(ent)

        // An update merges into the stored entity, as the other entity
        // stores do: fields absent from the update are kept. The option
        // merge: false, or merge$: false on the entity, replaces it.
        var merge = !create && !(false === options.merge || false === ent.merge$)

        function handledate_replacer(key, val) {
          if (_.isDate(val)) {
            return val.toISOString()
          } else return val
        }

        ensurefolder(folderpath, function(err) {
          if (good(args, err, cb)) {
            var filepath = Path.join(folderpath, ent.id + '.json')

            // The JSON round trip drops undefined fields, so that they
            // do not overwrite stored ones.
            var entdata = JSON.parse(
              JSON.stringify(ent.data$(), handledate_replacer)
            )

            inturn(
              filepath,
              function(cb) {
                if (!merge) {
                  return write(filepath, entdata, cb)
                }

                Fs.readFile(filepath, function(err, jsonstr) {
                  if (err && 'ENOENT' === err.code) {
                    return write(filepath, entdata, cb)
                  } else if (good(args, err, cb)) {
                    try {
                      var data = JSON.parse(jsonstr)
                    } catch (err) {
                      return good(args, err, cb)
                    }
                    write(filepath, Object.assign(data, entdata), cb)
                  }
                })
              },
              cb
            )
          }
        })

        function write(filepath, data, cb) {
          var jsonstr = JSON.stringify(data)

          writefile(filepath, jsonstr, function(err) {
            if (good(args, err, cb)) {
              seneca.log.debug(
                'save/' + (create ? 'insert' : 'update'),
                ent,
                desc
              )
              // Reply with a copy of what was stored, so that later
              // changes to either object stay apart.
              cb(null, ent.make$(parse_json(jsonstr)))
            }
          })
        }
      }
    },

    load: function(args, cb) {
      var qent = args.qent
      var q = args.q

      if (q.id) {
        if (!safe_id(q.id)) {
          return cb(error('invalid-id', { id: q.id, store: name }))
        }

        var folderpath = makefolderpath(qent)

        ensurefolder(folderpath, function(err) {
          if (good(args, err, cb)) {
            var filepath = Path.join(folderpath, q.id + '.json')

            do_load(args, qent, filepath, function(err, fent) {
              if (good(args, err, cb)) {
                seneca.log.debug('load', q, fent, desc)
                cb(null, fent)
              }
            })
          }
        })
      } else {
        do_list(args, qent, q, function(err, entlist) {
          if (good(args, err, cb)) {
            cb(null, entlist[0])
          }
        })
      }
    },

    list: function(args, cb) {
      var qent = args.qent
      var q = args.q
      do_list(args, qent, q, cb)
    },

    remove: function(args, cb) {
      var qent = args.qent
      var q = args.q

      var all = q.all$ // default false
      var load = _.isUndefined(q.load$) ? true : q.load$ // default true

      if (all) {
        do_list(args, qent, q, function(err, entlist) {
          function next_remove(i) {
            var ent = entlist[i]
            if (ent) {
              do_remove(args, q, ent, function(err) {
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
      } else if( 0 < Object.keys(q).length ) {
        q.limit$ = 1
        do_list(args, qent, q, function(err, list) {
          if (good(args, err, cb)) {
            var fent = list[0]
            if (fent) {
              do_remove(args, q, fent, function(err) {
                if (good(args, err, cb)) {
                  cb(null, load ? fent : null)
                }
              })
            } else cb(null, null)
          }
        })
      }
      else cb()
    },

    close: function(args, done) {
      done()
    },

    native: function(args, done) {
      done(null, options)
    }
  }

  // @seneca/entity exports the store initializer as entity/init.
  var storeInit = seneca.export('entity/init')
  if ('function' !== typeof storeInit) {
    throw new Error(
      name +
        ': load @seneca/entity before this plugin, for example ' +
        "seneca.use('@seneca/entity').use('@seneca/jsonfile-store')"
    )
  }
  var storedesc = storeInit(seneca, options, store)
  var tag = storedesc.tag
  var desc = storedesc.desc

  seneca.add({ init: store.name, tag: tag }, function(args, done) {
    Fs.stat(options.folder, function(err) {
      if (err) {
        return done(
          error('folder-not-found', { folder: options.folder, store: desc })
        )
      }

      var markerfile = Path.join(options.folder, 'seneca.txt')
      Fs.writeFile(markerfile, 'This is a jsonfile-store folder.', function(
        err
      ) {
        if (err) {
          return done(
            error('folder-not-writable', {
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
