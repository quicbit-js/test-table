// A simple table where each row is an object.  helps with data-driven testing.
'use strict'

function Table (header, rows) {
  var headerObj = {}
  header.forEach(function(h) {
    if (headerObj[h]) { err('header defined twice: ' + h)}
    headerObj[h] = true
  })
  this.header = header
  this.rows = rows
}

Table.prototype = {
  constructor: Table,
  col (name) {
    return this.rows.reduce(function (a, r) {
      a.push(r[name])
      return a
    }, [])
  },

  colIndex (name) {
    return this.header.indexOf(name)
  },

  get length () {
    return this.rows.length
  },

  colName (col) {
    switch (typeof (col)) {
      case 'number':
        return this.header[col]
      case 'string':
        return col
      default:
        err('cannot get column for type ' + typeof (col))
    }
  },

  // return the value at the given row (number) and column (number or string).
  // if only row arg is given, return the entire row
  val (row, col) {
    var row_obj = this.rows[row]
    return arguments.length === 1 ? row_obj : row_obj[this.colName(col)]
  },

  vals (col) {
    var cname = this.colName(col)
    return this.rows.map((r) => r[cname])
  },

  setVal (row, col, v) {
    var row_obj = this.rows[row]
    var cn = this.colName(col)
    var prev = row_obj[cn]
    row_obj[cn] = v
    return prev
  },

  // Return the [row, col] tuple of the first unequal data value found
  // using *positional* traversal (i.e. ignoring header names) and
  // traversing by row then by column (i.e. columns 0 to max in row 0,
  // columns 0 to max in row 1...)
  //
  // Uses a provided opt.equal function for comparison, or the default
  // compare which:
  //
  //        compares object and array values up to given opt.max_depth
  //        considers two NaN values equal
  //        For object and array comparison where max_depth has been met,
  //          the result is the strict equals (===) of values
  //
  // Return null if no cells are different.
  //
  // opt {
  //    equal: function(a, b, depth, max_depth)   // optional custom equal function (which may or may not honor depth argument)
  //    max_depth                          // max_depth passed to equal function
  // }
  //
  unequalCell (tbl, opt) {
    opt = opt || {}
    var max_depth = opt.max_depth || (opt.max_depth === 0 ? 0 : 100)
    var equal = opt.equal || default_equal

    var a = this
    var b = tbl
    var aheader = a.header
    var bheader = b.header

    var arows = a.rows
    var brows = b.rows
    var nrows = Math.max(arows.length, brows.length)
    var ncols = Math.max(aheader.length, bheader.length)
    for (var ri = 0; ri < nrows; ri++) {
      var arow = arows[ri] || {}    // gracefully handle different row length
      var brow = brows[ri] || {}
      for (var ci = 0; ci < ncols; ci++) {
        if (!equal(arow[aheader[ci]], brow[bheader[ci]], 0, max_depth)) {
          return [ri, ci]
        }
      }
    }
    return null
  },

  equals (tbl) {
    if (!default_equal_arr(this.header, tbl.header, 0, 1)) {
      return false
    }
    return this.unequalCell(tbl) === null
  },

  toString () {
    var header = this.header
    var rowstrings = this.rows.map(function (row) {
      return header.map(function (name) { return row[name] }).join(',')  // values as string
    })
    return header.join(',') + '\n' + rowstrings.join('\n')
  }
}

function default_equal_arr (a, b, depth, max_depth) {
  var len = a.length
  if (b.length !== len) {
    return false
  }
  for (var i = 0; i < len; i++) {
    if (!default_equal(a[i], b[i], depth, max_depth)) {
      return false
    }
  }
  return true
}

function default_equal_obj (a, b, depth, max_depth) {
  var keys = Object.keys(a)
  if (!default_equal_arr(keys, Object.keys(b), depth, Number.MAX_SAFE_INTEGER)) {
    return false
  }
  var len = keys.length
  for (var ki = 0; ki < len; ki++) {
    var key = keys[ki]
    if (!default_equal(a[key], b[key], depth, max_depth)) {
      return false
    }
  }
  return true
}

function default_equal (a, b, depth, max_depth) {
  if (a === b) {
    return true
  }
  var t = typeof (a)
  if (t !== typeof (b)) {
    return false
  }
  if (t === 'number' && isNaN(a)) {
    return isNaN(b)
  }
  if (t === 'object') {
    if (depth >= max_depth) {
      return false     // strict comparison gave false
    }
    var a_arr = Array.isArray(a)
    var b_arr = Array.isArray(b)

    if (a_arr && b_arr) {
      return default_equal_arr(a, b, depth + 1, max_depth)
    } else if (!a_arr && !b_arr) {
      return default_equal_obj(a, b, depth + 1, max_depth)
    } else {
      return false
    }
  }
}

function err (msg) {
  throw Error(msg)
}

// Create table from a matrix (array of arrays of data).  If data is already a table, return that table
// (similar to new Object(someObject)).
//
// For arrays, the first array is assumed to be the header, unless opt.header is set, in which case that will
// be used for the header.   A header may be an array of strings or a string containing '%d'.
// If a header is a string, the header strings will be generated by replacing %d with the column
// offset.  These are equivalent:
//
//     var tbl = table.create( [ [1, 2], [3, 4] ], { header: ['c_0','c_1'] } )
//     var tbl = table.create( [ [1, 2], [3, 4] ], { header: 'c_%d' } )
//     var tbl = table.create( [ ['c_0','c_1'], [1, 2], [3, 4] ] )
//     var tbl = table.create( [ 'c_%d', [1, 2], [3, 4] ] )
//
//
exports.create = function (data, opt) {
  if (!Array.isArray(data)) {
    // Return table objects as-is
    data.constructor && data.constructor.name === 'Table' || err('unexpected object for create table')
    return data
  }
  opt = Object.assign({}, opt)
  var header = opt.header
  if (header == null) {
    header = data[0]
    data = data.slice(1)
  }
  if (typeof (header) === 'string') {
    header = new Array(data[0].length).fill(header).map((s, i) => s.replace(/%d/, i)) // use header template: col_%d
  } else {
    Array.isArray(header) || err('unexpected opt.header value: ' + header)
  }

  var ret = new Table(header)
  // Row properties start with normal (non-underbar) char.  Accessor functions
  // are underbar prefixed and located on prototype.  This namespace
  // compromise makes rows inspection/debug friendly because they look and behave
  // like simple property objects.
  function Row (vals) {
    vals.forEach((v, i) => {
      this[header[i]] = v
    })
  }
  Row.prototype = {
    constructor: Row,
    get _keys () { return header },
    get _vals () {
      var self = this
      return header.map((k) => self[k])
    }
  }

  ret.rows = data.map((vals) => {
    vals.length === header.length || err('expected ' + header.length + ' values, but got: ' + vals.length)
    return new Row(vals)
  })
  return ret
}
exports.from_data = exports.create   // backwards compatible
