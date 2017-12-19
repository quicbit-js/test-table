var test = require('tape').test

var table = require('.').create


test('toString', function (t) {
  var tbl = table([
    [ 'a', 'b', 'c' ],
    [ 1, 2, 3 ],
    [ 'x', 'y', 'z' ]
  ])
  t.equal(tbl.toString(), 'a,b,c\n1,2,3\nx,y,z')
  t.end()
})

test('deprecated functions', function (t) {
  var t1 = table([
    [ 'a', 'b', 'c' ],
    [ 1, 2, 3 ],
    [ 'x', 'y', 'z' ]
  ])
  t.same(t1.unequalCell(table([
    [ 'a', 'b', 'c' ],
    [ 1, 1, 1 ]
  ])), [0, 1])

  t.same(t1.setVal(1, 0), 'x')

  t.same(t1.colName(2), 'c')
  t.same(t1.colIndex('c'), 2)
  t.same(t1.col('b'), [2,'y'])
  t.end()
})

test('errors', function (t) {
  t.throws(function () { table([['a', 'b', 'b']] ) }, /header defined twice/)
  t.throws(function () { table({}) }, /unexpected object/)
  t.throws(function () { table([{}]) }, /unexpected opt.header value/)
  t.throws(function () { table([['a', 'b'], [1]]) }, /expected 2 values/)

  var tbl = table([
    ['a', 'b', 'c'],
    [1, 2, 3],
    ['x', 'y', 'z']
  ])

  t.throws(function () { tbl.col_name([]) }, /cannot get column for type/)
  t.end()
})

test('rows and vals', function (t) {
  var data = [
    ['a', 'b', 'c'],
    [1, 2, 3],
    ['x', 'y', 'z']
  ]
  var tbl = table(data)

  t.same(tbl.rows[0]._vals, [1, 2, 3])
  t.same(tbl.rows[1]._vals, ['x', 'y', 'z'])
  tbl.rows.forEach(function (row, ri) {
    t.same(row._keys, data[0])
    t.same(row._vals, data[ri + 1])
    data[ri].forEach(function (v, ci) {
      t.same(tbl.val(ri, ci), data[ri + 1][ci])
      t.same(tbl.val(ri, data[0][ci]), data[ri + 1][ci])
    })
  })

  t.same(tbl.vals(0), [1, 'x'])
  t.same(tbl.vals('b'), [2, 'y'])
  t.same(tbl.vals(2), [3, 'z'])

  t.same(tbl.val(1), tbl.rows[1])
  t.same(tbl.set_val(1, 1, 'yy'), 'y')
  t.same(tbl.set_val(1, 1, 'y'), 'yy')

  t.end()
})

test('create with options', function (t) {
  var data = [
    [ 1, null, 'x' ],
    [ 2, '', 'y' ],
    [ 3, undefined, 'z' ]
  ]

  var tbls = [
    table(data, { header: ['c_0', 'c_1', 'c_2'] }),
    table(data, { header: 'c_%d' }),
    table([['c_0', 'c_1', 'c_2']].concat(data)),
    table(['c_%d'].concat(data))
  ]
  tbls.push(table(tbls[0]))       // return same table

  t.plan(tbls.length)

  tbls.forEach(function (tbl) {
    t.true(tbl.equals(tbls[0]))
  })
})

test('unequal_cell', function (t) {
  var data1 = [
    [ 'a', 'b', 'c' ],
    [ 1, {g: 1, h: 2}, 3 ],
    [ 'x', '', 'z' ],
    [ NaN, [1, {q: 7}], null ]
  ]

    // same values data1, but not strictly equal
  var data2 = [
    [ 'a', 'b', 'c' ],
    [ 1, {g: 1, h: 2}, 3 ],
    [ 'x', '', 'z' ],
    [ NaN, [1, {q: 7}], null ]
  ]

  var t1 = table(data1)
  var t2 = table(data2)

  t.same(t1.unequal_cell(t2, {max_depth: 0}), [0, 1])
  t.same(t1.unequal_cell(t2, {max_depth: 1}), [2, 1])
  t.same(t1.unequal_cell(t2, {max_depth: 2}), null)
  t.same(t1.unequal_cell(t2), null)

    // modify cells in t2 and check return cell coordinates
  var header = t1.header
  for (var ri = 0; ri < t1.length; ri++) {
    header.forEach(function (col, ci) {
      var t2row = t2.rows[ri]
      var prev = t2row[col]
      t2row[col] = 'ANOTHER VALUE'
      t.same(t1.unequal_cell(t2), [ri, ci])
      t2row[col] = prev
      t.same(t1.unequal_cell(t2), null)
    })
  }

    // try different size tables (columns)
  var t3 = table([
    [ 'a', 'b' ],
    [ 1, {g: 1, h: 2} ],
    [ 'x', '' ],
    [ NaN, [1, {q: 7}] ]
  ])
  t.same(t1.unequal_cell(t3), [0, 2])
  t.same(t3.unequal_cell(t1), [0, 2])

    // try different size tables (rows)
  var t4 = table([
    [ 'a', 'b' ],
    [ 1, {g: 1, h: 2} ],
    [ 'x', '' ],
    [ NaN, [1, {q: 7}] ],
    [ 8, 9 ]
  ])
  t.same(t3.unequal_cell(t4), [3, 0])
  t.same(t4.unequal_cell(t3), [3, 0])

  t.end()
})

test('unequal_cell- slight differences', function (t) {
  var t1 = table([
    [ 'a', 'b' ],
    [ 1, null ]
  ])

  var t2 = table([
    [ 'a', 'b' ],
    [ 1, null ]
  ])

  t.same(t1.equals(t2), true)

  t1.set_val(0, 1, {x: 8, y: 9})
  t2.set_val(0, 1, {x: 8, z: 9})
  t.same(t1.unequal_cell(t2), [0, 1], 'different object keys')

  t1.set_val(0, 1, {x: 8, y: 9})
  t2.set_val(0, 1, {x: 8, y: 10})
  t.same(t1.unequal_cell(t2), [0, 1], 'different object values')

  t1.set_val(0, 1, {x: 8, y: [6]})
  t2.set_val(0, 1, {x: 8, y: {}})
  t.same(t1.unequal_cell(t2), [0, 1], 'array, non-array')

  t.end()
})

test('equal', function (t) {
  var header = ['a', 'b', 'c']
  var data1 = [
    [ 1, {g: 1, h: 2}, 3 ],
    [ 'x', '', 'z' ],
    [ NaN, [1, {q: 7}], null ]
  ]

    // same values data1, but not strictly equal
  var data2 = [
    [ 1, {g: 1, h: 2}, 3 ],
    [ 'x', '', 'z' ],
    [ NaN, [1, {q: 7}], null ]
  ]
  var t1 = table(data1, {header: header})
  var t2 = table(data2, {header: header})
  t.same(t1.equals(t2), true)

  var t3 = table(data2, {header: ['a', 'b', 'x']})
  t.same(t1.equals(t3), false)

    // array of different length at [2,1]
  var t4 = table([
    [ 'a', 'b', 'c' ],
    [ 1, {g: 1, h: 2}, 3 ],
    [ 'x', '', 'z' ],
    [ NaN, [1], null ]
  ])
  t.same(t1.equals(t4), false)

  t.end()
})

test('slice and data', function (t) {
  var t1 = table([
    ['a','b','c'],
    [ 1,  2,  3 ],
    [ 4,  5,  6 ],
  ])

  t.same(t1.slice(0).header, ['a','b','c'])
  t.same(t1.slice(0).data, [[1,2,3],[4,5,6]])
  t.same(t1.slice(-3).data, [[1,2,3],[4,5,6]])
  t.same(t1.slice(-4).data, [[1,2,3],[4,5,6]])

  t.same(t1.slice(1).header, ['b','c'])
  t.same(t1.slice(1).data, [[2,3],[5,6]])
  t.same(t1.slice(-2).data, [[2,3],[5,6]])

  t.same(t1.slice(2).header, ['c'])
  t.same(t1.slice(2).data, [[3],[6]])
  t.same(t1.slice(-1).data, [[3],[6]])

  t.same(t1.slice(3).header, [])
  t.same(t1.slice(3).data, [[],[]])
  t.same(t1.slice(4).data, [[],[]])

  t.same(t1.slice(1,-1).header, ['b'])
  t.same(t1.slice(-2,-1).header, ['b'])
  t.same(t1.slice(-2,-3).header, [])

  t.end()
})
