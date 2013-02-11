/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var fs   = require('fs')
var path = require('path')

var _ = require('underscore')

var name = 'jsonfile-store'



module.exports = function(seneca,opts,cb) {
  var desc

  function good(args,err,cb) {
    if( err ) {
      seneca.log.debug(args.tag$,'error',err,args)
      seneca.fail({code:'entity/error',store:name,error:err,args:args},cb)
      return false;
    }
    else return true;
  }

  function ensurefolder(folder,cb){
    fs.exists(folder,function(exists){
      if( exists ) return cb();

      fs.mkdir(folder,function(err){
        cb(err)
      })
    })
  }


  function makefolderpath(ent) {
    var canon = ent.canon$({object:true})
    var base   = canon.base
    var name   = canon.name
    
    var entfolder = (base?base+'_':'')+name
    var folderpath = path.join( opts.folder, entfolder )
    
    return folderpath
  }


  var isodate_re = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
  function do_load(args,qent,filepath,cb) {
    fs.readFile( filepath, function(err,jsonstr) {
      if( good(args,err,cb) ) {
        // TODO: handle JSON parse error
        var data = JSON.parse(jsonstr,function(key,val){
          if( _.isString(val) ) {
            if( val.match(isodate_re) ) {
              return new Date(val)
            }
            else return val;
          }
          else return val;
        })
        var fent = qent.make$(data)
        cb(null,fent)
      }
    })
  }


  var filename_re = /\.json$/

  function do_list(args,qent,q,cb) {
    // used by load, list, remove
    var entlist = []
    
    var folderpath = makefolderpath(qent)
    ensurefolder( folderpath, function(err) {
      if( good(args,err,cb) ) {
        
        fs.readdir( folderpath, function(err,filelist) { 
          if( good(args,err,cb) ) {
            nextfile(0)
          }

          function nextfile(i) {
            var filename = filelist[i]
            if( filename ) {
              if( filename.match(filename_re) ) {
                var filepath = path.join( folderpath, filename )
                do_load(args,qent,filepath,function(err,fent) {
                  if( good(args,err,cb) ) {

                    // match query
                    for(var p in q) {
                      if( !~p.indexOf('$') && q[p] != fent[p] ) {
                        return nextfile(i+1)
                      }
                    }

                    entlist.push(fent)
                    nextfile(i+1)
                  }
                })
              }
              else nextfile(i+1);
            }
            else cb( null, entlist);
          }

        })
      }
    })      
  }


  function do_remove(args,q,ent,cb) {
    var folderpath = makefolderpath(ent)
    ensurefolder( folderpath, function(err) {
      if( good(args,err,cb) ) {

        var filepath = path.join( folderpath, ent.id+'.json' )
        var filepath_DELETE = path.join( folderpath, ent.id+'.json.DELETE' )

        fs.rename( filepath, filepath_DELETE, function(err) {
          if( good(args,err,cb) ) {
            cb()
          }
        })
      }
    })
  }


  var store = {
    name: name,

    save: function(args,cb) {
      var ent = args.ent    

      var create = !ent.id;

      if( create ) {
        seneca.act({role:'util', cmd:'generate_id'}, function(err,id){
          if( err ) return cb(err);
          do_save(id)
        })
      }
      else do_save();

      function do_save(id) {
        if( id ) {
          ent.id = id
        }

        var folderpath = makefolderpath(ent)

        ensurefolder( folderpath, function(err) {

          function handledate_replacer(key,val) {
            if( _.isDate(val) ) {
              return val.toISOString()
            }
            else return val
          }

          if( good(args,err,cb) ) {
            var filepath = path.join( folderpath, ent.id+'.json' )

            var entdata = ent.data$()
            var jsonstr = JSON.stringify(entdata)

            fs.writeFile( filepath, jsonstr, function(err){
              if( good(args,err,cb) ) {
                seneca.log.debug(args.tag$,'save/'+(create?'insert':'update'),ent,desc)
                cb(null,ent)
              }
            })
          }
        })
      }
    },


    load: function(args,cb) {
      var qent = args.qent
      var q    = args.q

      if( q.id ) {
        var folderpath = makefolderpath(qent)

        ensurefolder( folderpath, function(err) {
          if( good(args,err,cb) ) {
            var filepath = path.join( folderpath, q.id+'.json' )

            do_load(args,qent,filepath, function(err,fent) {
              if( good(args,err,cb) ) {
                seneca.log.debug(args.tag$,'load',q,fent,desc)
                cb(null,fent)
              }
            })
          }
        })
      }
      else {
        do_list(args,qent,q,function(err,entlist){
          if( good(args,err,cb) ) {
            cb(null,entlist[0])
          }
        })
      }
    },


    list: function(args,cb) {
      var qent = args.qent
      var q    = args.q
      do_list(args,qent,q,cb)
    },


    remove: function(args,cb) {
      var qent = args.qent
      var q    = args.q

      var all  = q.all$ // default false
      var load  = _.isUndefined(q.load$) ? true : q.load$ // default true 
 
      if( all ) {
        do_list(args,qent,q,function(err,entlist){
          function next_remove(i) {
            var ent = entlist[i]
            if( ent ) {
              do_remove(args,q,ent,function(err){
                if( good(args,err,cb) ) {
                  next_remove(i+1)
                }
              })
            }
            else return cb();
          }

          if( good(args,err,cb) ) {
            next_remove(0)
          }
        })
      }
      else {
        q.limit$ = 1
        do_list(args,qent,q,function(err,list){
          if( good(args,err,cb) ) {
            var fent = list[0]
            if( fent ) {
              do_remove(args,q,fent,function(err){
                if( good(args,err,cb) ) {
                  cb(null,load?fent:null)
                }
              })
            }
            else cb(null,null)
          }
        })
      }
    },


    close: function(cb) {
    }
  }


  seneca.util.initstore(seneca,opts,store,function(err,tag,description){
    if( err ) return cb(err);

    desc = description

    opts.folder = path.normalize( opts.folder || '.' )

    fs.exists( opts.folder, function(exists){
      if( !exists ) return seneca.fail({code:'folder-not-found',folder:opts.folder,store:desc,error:err},cb);
      
      var markerfile = path.join( opts.folder, 'seneca.txt')
      fs.writeFile(markerfile, "This is a jsonfile-store folder.", function(err){
        if( err ) return seneca.fail({code:'folder-not-writable',folder:opts.folder,store:desc,error:err},cb);
      })
    })

    cb(null,{name:store.name,tag:tag})
  })
}


