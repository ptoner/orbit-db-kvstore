// @ts-nocheck
const LazyKvStore = require('../src/LazyKvStore')

var assert = require('assert');
const OrbitDB = require('orbit-db')
const ipfsClient = require('ipfs-http-client')


const ipfs = ipfsClient({
    host: "localhost",
    port: 5001,
    protocol: 'http'
  })



describe('LazyKvStore', async () => {

    // add custom type to orbitdb
    OrbitDB.addDatabaseType(LazyKvStore.type, LazyKvStore)

    let store


    before('Setup', async () => {
        let orbitdb = await OrbitDB.createInstance(ipfs)
        store = await orbitdb.open("testlazykv", {create: true, type: "lazykv"})
    })

    it('Test put/get', async () => {

        //Arrange 
        await store.put(1, {
            name: "Pat"
        })

        await store.put(2, {
            name: "Bill"
        })

        await store.put(3, {
            name: "Jim"
        })

        await store.put(4, {
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



    it('Test _tag', async () => {

        //Arrange 
        await store.put(5, {
            name: "Andrew McCutchen",
            _tags: {
                season: [2019, 2018, 2017],
                currentTeam: "PIT",
                battingHand: "R",
                throwingHand: "R"
            }
        })

        await store.put(6, {
            name: "Pedro Alvarez",
            _tags: {
                season: [2019, 2017],
                currentTeam: "BAL",
                battingHand: "R",
                throwingHand: "R"
            }
        })

        await store.put(8, {
            name: "Jordy Mercer",
            _tags: {
                season: [2016],
                currentTeam: "PIT",
                battingHand: "L",
                throwingHand: "R"
            }
        })


        //Act
        let season2019 = await store.getByTag("season", 2019, 100, 0)
        let season2018 = await store.getByTag("season", 2018, 100, 0)
        let season2017 = await store.getByTag("season", 2017, 100, 0)
        let season2016 = await store.getByTag("season", 2016, 100, 0)

        let teamPIT = await store.getByTag("currentTeam", "PIT", 100, 0)
        let teamBAL = await store.getByTag("currentTeam", "BAL", 100, 0)

        let battingR = await store.getByTag("battingHand", "R", 100, 0)
        let battingL = await store.getByTag("battingHand", "L", 100, 0)

        let throwingR = await store.getByTag("throwingHand", "R", 100, 0)

        //Seasons
        assert.equal(season2019[0].name, "Andrew McCutchen")
        assert.equal(season2019[1].name, "Pedro Alvarez")

        assert.equal(season2018[0].name, "Andrew McCutchen")

        assert.equal(season2017[0].name, "Andrew McCutchen")
        assert.equal(season2017[1].name, "Pedro Alvarez")

        assert.equal(season2016[0].name, "Jordy Mercer")

        //Teams
        assert.equal(teamPIT[0].name, "Andrew McCutchen")
        assert.equal(teamPIT[1].name, "Jordy Mercer")

        assert.equal(teamBAL[0].name, "Pedro Alvarez")

        //Batting
        assert.equal(battingR[0].name, "Andrew McCutchen")
        assert.equal(battingR[1].name, "Pedro Alvarez")
        
        assert.equal(battingL[0].name, "Jordy Mercer")

        //Pitching
        assert.equal(throwingR[0].name, "Andrew McCutchen")
        assert.equal(throwingR[1].name, "Pedro Alvarez")
        assert.equal(throwingR[2].name, "Jordy Mercer")



    })




})