var test = require('tape').test

var table = require('.').create

test('test-table: columns', function (t) {
    var tbl = table([
        ['a', 'b', 'c'],
        [1,    2,   3],
        ['x', 'y', 'z']
    ])

    t.plan(6)

    t.equal(tbl.toString(), 'a,b,c\n1,2,3\nx,y,z')

    t.equal(tbl.length, 2)

    t.equal(tbl.col_index('b'), 1)

    t.deepEqual(tbl.col('a'), [1, 'x'])
    t.deepEqual(tbl.col('b'), [2, 'y'])
    t.deepEqual(tbl.col('c'), [3, 'z'])
})

test('test-table: rows', (t) => {
    var tbl = table([
        ['a', 'b', 'c'],
        [1,    2,   3],
        ['x', 'y', 'z']
    ])

    t.plan(4)
    t.deepEqual(tbl.rows[0]._vals, [1,2,3])
    t.deepEqual(tbl.rows[1]._vals, ['x','y','z'])
    tbl.rows.forEach((r) => {
        t.equal(r._keys, tbl.header)
    })
})

test('test-table: create with options', (t) =>  {
    var data =  [
        [ 1, null,      'x' ],
        [ 2, '',        'y' ],
        [ 3, undefined, 'z' ],
    ]

    var tbls = [
        table( data, { header: ['c_0','c_1','c_2'] } ),
        table( data, { header: 'c_%d' } ),
        table( [['c_0','c_1','c_2']].concat(data) ),
        table( ['c_%d'].concat(data) ),
    ]
    tbls.push(table(tbls[0]))       // return same table

    t.plan(tbls.length)

    tbls.forEach((tbl) => {
        t.true( tbl.equals(tbls[0]) )
    })
})

test('test-table: unequal_cell', (t) =>  {

    var header = ['a', 'b', 'c']
    var data1 = [
        [ 1,        {g:1, h:2},     3 ],
        ['x',      '',             'z'],
        [NaN,      [1,{q:7}],       null],
    ]

    // same values data1, but not strictly equal
    var data2 = [
        [ 1,        {g:1, h:2},     3 ],
        ['x',      '',              'z'],
        [NaN,      [1,{q:7}],       null],
    ]

    var t1 = table( data1, {header: header} )
    var t2 = table( data2, {header: header} )

    t.deepEqual(t1.unequal_cell(t2, {max_depth: 0}), [0, 1])
    t.deepEqual(t1.unequal_cell(t2, {max_depth: 1}), [2, 1])
    t.deepEqual(t1.unequal_cell(t2, {max_depth: 2}), null)
    t.deepEqual(t1.unequal_cell(t2),                 null)

    // modify cells in t2 and check return cell coordinates
    for(var ri=0; ri<t1.length; ri++) {
        header.forEach(function(col, ci) {
            var t2row = t2.rows[ri]
            var prev = t2row[col]
            t2row[col] = "ANOTHER VALUE"
            t.deepEqual(t1.unequal_cell(t2), [ri, ci])
            t2row[col] = prev
            t.deepEqual(t1.unequal_cell(t2), null)
        })
    }

    t.end()
})
