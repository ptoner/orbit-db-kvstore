// @ts-nocheck
const TableStore = require('../src/TableStore')

var assert = require('assert');
const OrbitDB = require('orbit-db')
const ipfsClient = require('ipfs-http-client')


const ipfs = ipfsClient({
    host: "localhost",
    port: 5001,
    protocol: 'http'
  })



describe('TableStore', async () => {

    // add custom type to orbitdb
    OrbitDB.addDatabaseType(TableStore.type, TableStore)

    let store


    before('Setup', async () => {

        let orbitdb = await OrbitDB.createInstance(ipfs)
        store = await orbitdb.open("testlazykv", {
            create: true, 
            type: "lazykv",
            indexes: [
                {column: "id", primary: true, unique: true},
                {column: "currentTeam", unique: false},
                {column: "battingHand", unique: false},
                {column: "throwingHand",unique: false}
            ]
        })

        await store.load()
    })

    it('should put items in the table and retreive them by primary key', async () => {

        //Arrange 
        await store.put(1, {
            id: 1,
            name: "Pat"
        })

        await store.put(2, {
            id: 2,
            name: "Bill"
        })

        await store.put(3, {
            id: 3,
            name: "Jim"
        })

        await store.put(4, {
            id: 4,
            name: "Susan"
        })


        //Act
        let pat = await store.get(1)
        let bill = await store.get(2)
        let jim = await store.get(3)
        let susan = await store.get(4)


        //Assert
        assert.equal(pat.name, "Pat")
        assert.equal(bill.name, "Bill")
        assert.equal(jim.name, "Jim")
        assert.equal(susan.name, "Susan")


    })



    it('should retreive values by secondary indexes', async () => {

        //Arrange 
        await store.put(5, {
            id: 5,
            name: "Andrew McCutchen",
            currentTeam: "PIT",
            battingHand: "R",
            throwingHand: "R"
        })

        await store.put(6, {
            id: 6,
            name: "Pedro Alvarez",
            currentTeam: "BAL",
            battingHand: "R",
            throwingHand: "R"
        })

        await store.put(8, {
            id: 8,
            name: "Jordy Mercer",
            currentTeam: "PIT",
            battingHand: "L",
            throwingHand: "R"
        })


        await store.put(9, {
            id: 9,
            name: "Doug Drabek",
            currentTeam: "BAL",
            battingHand: "L",
            throwingHand: "R"
        })

        //Act
        let teamPIT = await store.getByIndex("currentTeam", "PIT", 100, 0)
        let teamBAL = await store.getByIndex("currentTeam", "BAL", 100, 0)

        let battingR = await store.getByIndex("battingHand", "R", 100, 0)
        let battingL = await store.getByIndex("battingHand", "L", 100, 0)

        let throwingR = await store.getByIndex("throwingHand", "R", 100, 0)


        //Teams
        assert.equal(teamPIT[0].name, "Andrew McCutchen")
        assert.equal(teamPIT[1].name, "Jordy Mercer")

        assert.equal(teamBAL[0].name, "Pedro Alvarez")
        assert.equal(teamBAL[1].name, "Doug Drabek")

        //Batting
        assert.equal(battingR[0].name, "Andrew McCutchen")
        assert.equal(battingR[1].name, "Pedro Alvarez")
        
        assert.equal(battingL[0].name, "Jordy Mercer")
        assert.equal(battingL[1].name, "Doug Drabek")

        //Pitching
        assert.equal(throwingR[0].name, "Andrew McCutchen")
        assert.equal(throwingR[1].name, "Pedro Alvarez")
        assert.equal(throwingR[2].name, "Jordy Mercer")
        assert.equal(throwingR[3].name, "Doug Drabek")


    })


    it('should update a row from one secondary index to another', async () => {
        
        //Act
        await store.put(5, {
            id: 5,
            name: "Andrew McCutchen",
            currentTeam: "PIT",
            battingHand: "L",
            throwingHand: "R"
        })


        //Assert
        let battingR = await store.getByIndex("battingHand", "R", 100, 0)
        let battingL = await store.getByIndex("battingHand", "L", 100, 0)

        assert.equal(battingR.length, 1)
        assert.equal(battingR[0].id != 5, true)

        assert.equal(battingL[2].id, 5)

    })

    it('should delete a row and remove it from all secondary indexes', async () => {

        //Act
        await store.del(8)


        //Assert
        let jordy = await store.get(8)
        let teamPIT = await store.getByIndex("currentTeam", "PIT", 100, 0)
        let battingL = await store.getByIndex("battingHand", "L", 100, 0)
        let throwingR = await store.getByIndex("throwingHand", "R", 100, 0)

        let inTeamIndex = false
        let inBattingIndex = false
        let inThrowingIndex = false

        for (let team of teamPIT) {
            if (team.id == 8) inTeamIndex = true
        }

        for (let bats of battingL) {
            if (bats.id == 8) inBattingIndex = true
        }

        for (let throws of throwingR) {
            if (throws.id == 8) inThrowingIndex = true
        }


        assert.equal(jordy, undefined)
        assert.equal(inTeamIndex, false)
        assert.equal(inBattingIndex, false)
        assert.equal(inThrowingIndex, false)


    })


    it('should save and load from IPFS', async () => {

        //Save indexes
        await store.commit()
    
        //Re-open
        let orbitdb = await OrbitDB.createInstance(ipfs)
        let loadedStore = await orbitdb.open(store.address, {
            type: "lazykv"
        })

        await loadedStore.load()

        let pat = await loadedStore.get(1)
        let bill =  await loadedStore.get(2)
        let jim = await loadedStore.get(3)
        let susan = await loadedStore.get(4)
        let cutch = await loadedStore.get(5)
        let pedro = await loadedStore.get(6)
        let drabek = await loadedStore.get(9)
    
        assert.equal(pat.name, "Pat")
        assert.equal(bill.name, "Bill")
        assert.equal(jim.name, "Jim")
        assert.equal(susan.name, "Susan")
        assert.equal(cutch.name, "Andrew McCutchen")
        assert.equal(pedro.name, "Pedro Alvarez")
        assert.equal(drabek.name, "Doug Drabek")
    
      })
    



})