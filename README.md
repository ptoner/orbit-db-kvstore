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

### Creating a table

Each table starts with a schema definition. Creating a schema defines the fields and indexes that will be created in the table. Multiple columns can be indexed and searched. Each index is implemented as a [B-tree](https://github.com/mmalmi/merkle-btree).

The properties of an index are:

* primary - This designates a column as the primary key. There should only be one.
* type  - The data type the column will hold. Supported values are 'string', 'number', and 'boolean'
* unique - Whether the column has unique values. 


To create a table we'll start by creating a JS class that has a static getter named 'constraints'. It should also contain matching properties for every contraint defined. 

```javascript 
class Player {

    static get constraints() {
        return {
            id: { primary: true, unique:true, type: 'number' },
            name: { unique: false, type: 'string' },
            currentTeam: { unique: false, type: 'string' },
            battingHand: { unique: false, type: 'string' },
            throwingHand: { unique: false, type: 'string' }
        }
    }

    constructor() {
        this.id = null
        this.name = null
        this.currentTeam = null
        this.battingHand = null
        this.throwingHand = null
    }
    
}
```




```javascript

/** Put in an async function **/

let table = await orbitdb.open("testschema", {
    create: true, 
    type: "table"
})


//Create the schema. Only needs to be done when creating the table initially. 
await table.createSchema(Player)

```


### Loading an existing table


```javascript
let store = await orbitdb.open(ADDRESS_OF_DATASTORE, {
    type: "table"
})

await store.load()

```



### Insert JSON objects into the table. 
     

```javascript
 await table.put(5, {
    id: 5,
    name: "Andrew McCutchen",
    currentTeam: "PIT",
    battingHand: "R",
    throwingHand: "R"

await table.put(6, {
    id: 6,
    name: "Pedro Alvarez",
    currentTeam: "BAL",
    battingHand: "R",
    throwingHand: "R"
})

await table.put(8, {
    id: 8,
    name: "Jordy Mercer",
    currentTeam: "PIT",
    battingHand: "L",
    throwingHand: "R"
})


await table.put(9, {
    id: 9,
    name: "Doug Drabek",
    currentTeam: "BAL",
    battingHand: "L",
    throwingHand: "R"
})

```

* Note: The key and the primary key values should match.


### Query the table by the primary key

```javascript
let player = await table.get(9)

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

### Query the full list. Takes an offset and a limit as parameters

```javascript

let list = await table.list(0, 10) //offset 0, limit 10

```


### Query the table by the indexed fields. Returns an array with all matching values.  

```javascript

let teamPIT = await table.getByIndex("currentTeam", "PIT", 100, 0) //100 is the limit and 0 is the offset
let teamBAL = await table.getByIndex("currentTeam", "BAL", 100, 0)

let battingR = await table.getByIndex("battingHand", "R", 100, 0)
let battingL = await table.getByIndex("battingHand", "L", 100, 0)

let throwingR = await table.getByIndex("throwingHand", "R", 100, 0)    

```


### Count the records
```javascript
let count = await table.count()
```

### Commit your changes. 

Your changes are persisted to disk when you call commit(). Before commit() the store will respond with the old data when queried. Multiple calls to "put" can be made inside the same transaction. 

Todo: There should be an auto-commit option somewhere.

```javascript
await table.commit()
```

## License

[MIT](LICENSE) 







  
