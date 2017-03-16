# test-table

[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][npm-url]

[npm-image]:       https://img.shields.io/npm/v/test-table.svg
[downloads-image]: https://img.shields.io/npm/dm/test-table.svg
[npm-url]:         https://npmjs.org/package/test-table

A very simple table for data-driven testing.  test-table is provided through
[quicbit-js/test-kit](http://github.com/quicbit-js/test-kit), but can be 
used independently as well.

## Install

npm install test-table

## API Update 1.x -> 2.x

test-table has been updated to comply 
with [qb-standard](http://github.com/quicbit-js/qb-standard), meaning that
it has 100% test and branch coverage and functions on objects (using 'this') 
are now camelCase (previous snake_case names are available in version 2.1.0 for 
backward-compatibility).  
In adding the tests, some unreported 
bugs were found and fixed specifically with some comparisons of unequalCell().


## Usage

You can create a table from an array of array values where the first 
row has the column names:

    > var table = require('test-table').create;
    
    > var tbl = table([
          ['col-a', 'col-b', 'col-c'],
          [1,    2,   3],
          ['x', 'y', 'z']
      ]);
     
Access header and rows properties:

    > console.log(tbl.header)
      [ 'col-a', 'col-b', 'col-c' ]
    > console.log(tbl.rows[0])
      { col-a: 1, col-b: 2, col-c: 3 }    

Using **test-table** together with a simple framework like [tape](https://github.com/substack/tape) condenses test cases 
and create more coverage.  Let's say we want to test a utility function count(s, v) function which 
returns the number of occurences of substring v within string s:

    var test = require('tape');     
    var util = require('myutil');   // has the util.count(s, v) function to test

    test('test-defaults: count', function(t) {
        let tbl = t.table([
            [ 's',             'v',   'expect' ],
            [ '',             '10',         0  ],
            [ '10',           '10',         1  ],
            [ '101',          '10',         1  ],
            [ '1010',         '10',         2  ],
            [ '0100101001',    '0',         6  ],
            [ '0100101001',    '1',         4  ],
            [ '0100101001',   '10',         3  ],
            [ '0100101001',  '100',         2  ],
            [ '0100101001', '1000',         0  ],
        ]);
        t.plan(tbl.length);
        tbl.forEach(function(r) {
            t.equal(util.count(r.s, r.v), r.expect);
        })
    })

    
Check out [test-kit](http://github.com/quicbit-js/test-kit) for more ways to  
make testing even more concise:

    var test = require('test-kit)(require('tape'))   // an enriched test harness 

    test('test-defaults: count', function(t) {
        t.tableAssert([
            [ 's',             'v',   'expect' ],
            [ '',             '10',         0  ],
            [ '10',           '10',         1  ],
            [ '101',          '10',         1  ],
            [ '1010',         '10',         2  ],
            [ '0100101001',    '0',         6  ],
            [ '0100101001',    '1',         4  ],
            [ '0100101001',   '10',         3  ],
            [ '0100101001',  '100',         2  ],
            [ '0100101001', '1000',         0  ],
        ], require('myutil').count);
    })


## Table Comparison

Comparing tables and/or showing first difference can be helpful in testing.  test-table
has a couple functions for this:


<code>unequal_cell()</code> returns the <code>\[row, col\]</code> location of the first differing 
cell value found between two given tables:

    table1.unequalCell(table2, options) '
    
... where options can provide

    {
       equal: function (a, b, depth, max_depth)   // custom equal function (which may or may not honor depth argument)
       max_depth                                  // max_depth passed to equal function
    }

by default, equals will perform deep compare of arrays and objects (but not other types like dates).


<code>equals()</code> checks that headers and row values are the same using the same
comparisons as unequal_cell (returning true iff all cells are equal)

## Header Generation

If you find yourself with a wide matrix of data and no header, test-table can generate
the header for you using a template string:

    var table = require('test-table').create
    
    var tbl = table(
        [
            [ 0.3,  3.2,   2.7,   2.5,   1.3,   4.2,   2.0 ],
            [ 0.4,  3.1,   8.1,   2.5,   1.0,   5.2,   2.0 ],
            [ 0.4,  3.3,   2.2,   2.5,   1.0,   4.6,   2.0 ],
            [ 0.3,  3.0,   2.9,   2.5,   1.3,   5.2,   2.0 ],
            [ 0.3,  3.2,   4.3,   2.5,   1.0,   5.2,   2.0 ],
            [ 0.5,  4.2,   6.2,   2.5,   1.3,   4.6,   2.0 ],
        ], 
        { header: 'col_%d' }
    );
    
The '%d' in the template will be replaced with the column number to generate headers:

    > console.log(tbl.header);
    [ 'col_0', 'col_1', 'col_2', 'col_3', 'col_4', 'col_5', 'col_6' ]

A header template can also be used in lue of a header array:

    var tbl = table(
        [
            'col_%d',
            [ 0.3,  3.2,   2.7,   2.5,   1.3,   4.2,   2.0 ],
            [ 0.4,  3.1,   8.1,   2.5,   1.0,   5.2,   2.0 ],
            [ 0.4,  3.3,   2.2,   2.5,   1.0,   4.6,   2.0 ],
            [ 0.3,  3.0,   2.9,   2.5,   1.3,   5.2,   2.0 ],
            [ 0.3,  3.2,   4.3,   2.5,   1.0,   5.2,   2.0 ],
            [ 0.5,  4.2,   6.2,   2.5,   1.3,   4.6,   2.0 ],
        ] 
    );
