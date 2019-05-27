# orbit-db-tablestore

> An orbit-db datastore that can be indexed and searched without downloading the entire dataset. Allows the creation of SQL-like tables. Access using ipfs-http-client. 

1. Create a schema that defines the indexed columns in the table. Multiple columns can be indexed and searched. Each index is implemented as a remotely-loaded [B-tree](https://github.com/mmalmi/merkle-btree/).

```javascript
    {column: "id", primary: true, unique: true},
    {column: "currentTeam", unique: false},
    {column: "battingHand", unique: false},
    {column: "throwingHand",unique: false}
```

2. Insert JSON objects into the table. These objects can contain fields other than the ones that were indexed. 
     

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






## Install

This project uses [npm](http://npmjs.com/) and [nodejs](https://nodejs.org/).


```sh
$ npm install orbit-db-tablestore
```

## Usage


Creating a table

```javascript

const OrbitDB = require('orbit-db')
const ipfsClient = require('ipfs-http-client')
const TableStore = require('orbit-db-tablestore')


/** Put in an async function **/

OrbitDB.addDatabaseType(TableStore.type, TableStore)

let orbitdb = await OrbitDB.createInstance(ipfs)
let store = await orbitdb.open("testlazykv", {
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

Accessing an existing table via its ci. 

```javascript

let orbitdb = await OrbitDB.createInstance(ipfs)
let loadedStore = await orbitdb.open(store.address, {
    type: "table"
})

await loadedStore.load()

```

A table will keep the list of its most recent indexes in memory while the app runs. When you want to flush them to
IPFS use commit()


```javascript

await store.commit()

```






  