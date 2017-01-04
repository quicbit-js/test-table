# test-table

A very simple table for data-driven testing

Create a table like so:
 
     > var tbl = require('./test-table').fromData([
         ['col-a', 'col-b', 'col-c'],
         [1,    2,   3],
         ['x', 'y', 'z']
     ])
     
Access the header and rows properties:

    > console.log(tbl.header)
    [ 'col-a', 'col-b', 'col-c' ]

    > console.log(tbl.rows[0])
    { 'col-a': 1, 'col-b': 2, 'col-c': 3 }    

Use test-tables along with a simple framework like 'tape' to condense test cases 
and create more coverage:

    require('tape').test('gnode: basic graph', function(t) {
        var tbl = require(test-table).fromData([
            [ 'obj', 'ncount', 'maxdepth' ],
            [ {value:"a"}, 1, 0 ],
            [ {value:"a",children:[]}, 1, 0],
            [ {value:"a",children:[{value:"b"}]}, 2, 1 ],
            [ {value:"a",children:[{value:"b"},{value:"c",children:[{value:"d"}]}]}, 4, 2 ]
        ])
        t.plan(tbl.length * 2)
        tbl.rows.forEach(function(r) {
            var g = gnode.fromObj(r.obj)
            t.equals(g.nodecount(), r.ncount)
            t.equals(g.maxdepth(), r.maxdepth)
        })
    })
