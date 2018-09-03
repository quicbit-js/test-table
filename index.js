// A simple table where each row is an object.  helps with data-driven testing.
'use strict'

function Table (header, rows, comments) {
  var headerObj = {}
  header.forEach(function (h) {
    if (headerObj[h]) { err('header defined twice: ' + h) }
    headerObj[h] = true
  })
  this.header = header
  this.rows = rows

  // If any comments are specified, the comments object has the following array properties
  // {
  //   header:    comments before the table header (strings starting with '#')
  //   trailer:   comments after the last row (strings starting with '#')
  //   data:      arrays of comments in the data by row index
  // }
  this.comments = comments && (
      (comments.data && comments.data.length)
      || (comments.header && comments.header.length)
      || (comments.trailer && comments.trailer.length)
  )
  ? comments
  : null
}

Table.prototype = {
  constructor: Table,

  col_index: function (name) {
    return this.header.indexOf(name)
  },

  col_name: function (col) {
    switch (typeof (col)) {
      case 'number':
        return this.header[col]
      case 'string':
        return col
      default:
        err('cannot get column for type ' + typeof (col))
    }
  },

  val: function (row, col) {
    var row_obj = this.rows[row]
    return arguments.length === 1 ? row_obj : row_obj[this.col_name(col)]
  },

  vals: function (col) {
    var cname = this.col_name(col)
    return this.rows.map(function (r) { return r[cname] })
  },

  set_val: function (row, col, v) {
    var row_obj = this.rows[row]
    var cn = this.col_name(col)
    var prev = row_obj[cn]
    row_obj[cn] = v
    return prev
  },

  get data() {
    var h = this.header
    return this.rows.map(function (r) {
      return h.map(function (n) { return r[n] })
    })
  },

  as_arrays: function (opt) {
    var ret = []
    var header = this.header
    var comments = opt && opt.with_comments ? this.comments : null
    if (comments) {
      Array.prototype.push.apply(ret, comments.header)
    }
    ret.push(header)
    this.rows.forEach(function (row, ri) {
      if (comments && comments.data[ri]) {
        Array.prototype.push.apply(ret, comments.data[ri])
      }
      ret.push(header.map(function (name) { return row[name] }))
    })
    if (comments) {
      Array.prototype.push.apply(ret, comments.trailer)
    }
    return ret
  },

  tcols: function (beg, end) {
    var h = this.header.slice(beg, end)
    var data = this.rows.map(function (r) {
      return h.map(function (n) { return r[n] })
    })
    return create (data, {header: h, comments: this.comments})
  },

  trows: function (beg, end) {
    var h = this.header.slice()
    var data = this.rows.slice(beg, end).map(function (r) { return h.map(function (n) { return r[n] })})
    var comments = null
    if (this.comments) {
      comments = {
        header: this.comments.header,
        trailer: this.comments.trailer,
        data: this.comments.data.slice(beg, end)
      }
    }
    return create(data, {header: h, comments: comments})
  },

  unequal_cell: function (tbl, opt) {
    opt = opt || {}
    var max_depth = opt.max_depth == null ? 100 : opt.max_depth
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

  equals: function (tbl) {
    if (!default_equal_arr(this.header, tbl.header, 0, 1)) {
      return false
    }
    return this.unequal_cell(tbl) === null
  },

  toString: function (opt) {
    opt = opt || {}
    var nopt = {
      with_comments: opt.with_comments == null ? true : opt.with_comments
    }
    return this.as_arrays(nopt).map(function (r) {
      if (typeof r === 'string') {
        return r
      } else {
        return r.join(',')
      }
    }).join('\n')
  },

  // backward-compatibility functions
  colIndex: function (name) { return this.col_index(name) },
  colName: function (col) { return this.col_name(col) },
  setVal: function (row, col, val) { return this.set_val(row, col, val) },
  unequalCell: function (tbl, opt) { return this.unequal_cell(tbl, opt) },
  col: function (name) { return this.vals(name) },
  slice: function (beg, end) { return this.tcols(beg, end) }
}

Object.defineProperty(Table.prototype, 'length', { get: function () { return this.rows.length } })

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
  if (!default_equal_arr(keys, Object.keys(b), depth, max_depth)) {
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

function create (data, opt) {
  opt = opt || {}
  if (!Array.isArray(data)) {
    // Return table objects as-is
    data.constructor && data.constructor.name === 'Table' || err('unexpected object for create table')
    return data
  }

  data = data.slice()

  // extract header comments and header
  var header = opt.header
  var comments = opt.comments || {}

  if (header == null) {
    if (!comments.header) {
      comments.header = []
      while (data.length && typeof data[0] === 'string' && data[0][0] === '#') {
        comments.header.push(data.shift())
      }
    }
    header = data.shift()
  } else {
    comments.header = comments.header || []
  }

  // extract trailer comments (comments after last data row)
  if (!comments.trailer) {
    comments.trailer = []
    while (data.length && typeof data[data.length - 1] === 'string' && data[data.length-1][0] === '#') {
      comments.trailer.push(data.pop())
    }
    comments.trailer.reverse()
  }

  if (!comments.data) {
    comments.data = []
    data = data.reduce(function (a, row) {
      if (typeof row === 'string' && row[0] === '#') {
        if (!comments.data[a.length]) { comments.data[a.length] = [] }
        comments.data[a.length].push(row)
      } else {
        a.push(row)
      }
      return a
    }, [])
  }

  if (typeof (header) === 'string') {
    // use header template: col_%d
    header = new Array(data[0].length).fill(header).map(
      function (s, i) { return s.replace(/%d/, i) }
    )
  } else {
    Array.isArray(header) || err('unexpected opt.header value: ' + header)
  }

  // Row properties start with normal (non-underbar) char.  Accessor functions
  // are underbar prefixed and located on prototype.  This namespace
  // compromise makes rows inspection/debug friendly because they look and behave
  // like simple property objects.
  function Row (vals) {
    var self = this
    vals.forEach(function (v, i) {
      self[header[i]] = v
    })
  }
  Row.prototype = {
    constructor: Row,
    get _keys () { return header },
    get _vals () {
      var self = this
      return header.map(function (k) { return self[k] })
    }
  }

  var rows = data.map(function (vals) {
    vals.length === header.length || err('expected ' + header.length + ' values, but got: ' + vals.length)
    return new Row(vals)
  })

  return new Table(header, rows, comments)
}
exports.create = create
exports.from_data = create   // backwards compatible
