# orbit-db-tablestore

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/orbitdb/Lobby)
[![npm version](https://badge.fury.io/js/orbit-db-tablestore.svg)](https://badge.fury.io/js/orbit-db-tablestore)

> An indexed and remoted loaded datastore for orbit-db. Indexed fields are searchable and sortable.  

An orbit-db datastore that can be indexed and searched without downloading the entire dataset. Allows the creation of SQL-like tables. Access using ipfs-http-client. 

The goal is to be able to load and search large datasets quickly in a browser. 

Used in [orbit-db](https://github.com/haadcode/orbit-db).


## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [License](#license)



## Install
```sh
npm install orbit-db
npm install orbit-db-tablestore
npm install ipfs-http-client
```

## Usage

First, create an instance of OrbitDB:

```javascript
const ipfsClient = require('ipfs-http-client')
const OrbitDB = require('orbit-db')
const TableStore = require('orbit-db-tablestore')


const ipfs = ipfsClient({
    host: "localhost",
    port: 5001,
    protocol: 'http'
  })

OrbitDB.addDatabaseType(TableStore.type, TableStore)

const orbitdb = await OrbitDB.createInstance(ipfs)

```


Create a schema that defines the indexed columns in the table. Multiple columns can be indexed and searched. Each index is implemented as a [B-tree](https://github.com/dcodeIO/btree.js/).

The properties of an index are:

* column - This is the name of the column
* primary - This designates a column as the primary key. There should only be one.
* unique - Whether the column has unique values. 

```javascript

/** Put in an async function **/

let store = await orbitdb.open("testschema", {
    create: true, 
    type: "table",
    indexes: [
        {column: "id", primary: true, unique: true},
        {column: "currentTeam", unique: false},
        {column: "battingHand", unique: false},
        {column: "throwingHand",unique: false}
    ]
})

await store.load()

```


Insert JSON objects into the table. These objects can contain the indexed fields as well as any other properties you want to save with the object. 
     

```javascript
 await store.put(5, {
    id: 5,
    name: "Andrew McCutchen",
    currentTeam: "PIT",
    battingHand: "R",
    throwingHand: "R",
    someOtherData: "Hello!"
})

await store.put(6, {
    id: 6,
    name: "Pedro Alvarez",
    currentTeam: "BAL",
    battingHand: "R",
    throwingHand: "R",
    someOtherData: "What a"
})

await store.put(8, {
    id: 8,
    name: "Jordy Mercer",
    currentTeam: "PIT",
    battingHand: "L",
    throwingHand: "R",
    someOtherData: "nice"
})


await store.put(9, {
    id: 9,
    name: "Doug Drabek",
    currentTeam: "BAL",
    battingHand: "L",
    throwingHand: "R",
    someOtherData: "day"
})

```

* Note: The key and the primary key values should match.


Query the table by the primary key

```javascript
let player = await store.get(9)

console.log(player)

//Prints 
// {
//     id: 9,
//     name: "Doug Drabek",
//     currentTeam: "BAL",
//     battingHand: "L",
//     throwingHand: "R",
//     someOtherData: "day"
// }


```


Query the table by the indexed fields. Returns an array with all matching values.  

```javascript

let teamPIT = await store.getByIndex("currentTeam", "PIT", 100, 0) //100 is the limit and 0 is the offset
let teamBAL = await store.getByIndex("currentTeam", "BAL", 100, 0)

let battingR = await store.getByIndex("battingHand", "R", 100, 0)
let battingL = await store.getByIndex("battingHand", "L", 100, 0)

let throwingR = await store.getByIndex("throwingHand", "R", 100, 0)    

```


Commit your changes. 

Your changes are persisted to disk when you call commit(). 

Todo: There should be an auto-commit option somewhere.

```javascript
await store.commit()

``



## License

[MIT](LICENSE) 







  