# test-table

A very simple table for data-driven testing.  test-table is provided through
[quicbit-js/test-kit](http://github.com/quicbit-js/test-kit), but can be 
used independently as well.


The table header is an array of strings (column names)
Each row is an object with values stored under property names (matching header names).


## Usage
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


## Table Comparison

Comparing tables and/or showing first difference can be handy in testing.  test-table
has a couple functions for this:


<code>unequal_cell()</code> returns the <code>\[row, col\]</code> location of the first differing 
cell value found between two given tables:

    table1.unequal_cell(table2, options) '
    
... where options can provide

    {
       equal: function(a, b, max_depth)   // custom equal function (which may or may not honor depth argument)
       max_depth                          // max_depth passed to equal function
    }

by default, equals will perform deep compare of arrays and objects (but not other types like dates).


<code>equals()</code> checks that headers and row values are the same using the same
comparisons as unequal_cell (returning true iff all cells are equal)