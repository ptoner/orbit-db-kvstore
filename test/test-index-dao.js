// @ts-nocheck
const IndexDao = require('../src/IndexDao')

var assert = require('assert');
const OrbitDB = require('orbit-db')
const ipfsClient = require('ipfs-http-client')


const ipfs = ipfsClient({
    host: "localhost",
    port: 5001,
    protocol: 'http'
  })



describe('IndexDao', async () => {

    let indexDao



    before('Setup', async () => {
        indexDao = new IndexDao(ipfs, "/testindexdaodb")
        await indexDao.load()
    })

    it('should create an index', async () => {

        //Arrange 
        let index = {
            column: "one",
            unique: true,
            primary: false
        }

        //Act
        indexDao.put("one", index)

        //Assert
        let created = indexDao.get("one")
        
        assert.equal(created.column, index.column)
        assert.equal(created.unique, index.unique)


    })


    it('should update an index', async () => {

        //Arrange 
        let index = {
            column: "two",
            unique: true,
            primary: false
        }

        await indexDao.put("two", index)
        
        let newIndex = {
            column: "two",
            unique: false,
            primary: true
        }

        //Act
        indexDao.put("two", newIndex)


        //Assert
        let updated = indexDao.get("two")
        
        assert.equal(updated.column, "two")
        assert.equal(updated.unique, false)
        assert.equal(updated.primary, true)

    })

    it('should remove an index', async () => {

        //Act
        indexDao.delete("one")


        //Assert
        let created = indexDao.get("one")
        
        assert.equal(created, undefined)
    })


    it('should get me the index marked primary', async () => {

        //Act
        let primary = indexDao.primary 


        //Assert
        assert.equal(primary.column, "two")
    })




    it('should save and load the indexes to IPFS', async () => {

        //Arrange
        let existing = indexDao.indexes

        //Act
        await indexDao.save()


        //Assert
        await indexDao.load()

        let after = indexDao.indexes 
        
        assert.deepEqual(existing, after)
    })



})