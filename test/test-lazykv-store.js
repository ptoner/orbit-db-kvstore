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
                seasons: [2019, 2018, 2017],
                currentTeam: "PIT",
                battingHand: "R",
                throwingHand: "L"
            }
        })


        //Act
        let fetched = await store.get(5)


        //Assert
        console.log(fetched)

    })




})