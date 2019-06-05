// // @ts-nocheck
// const TableStore = require('../src/TableStore')
// const { Criteria, Restrictions } = require('../src/Criteria')

// var assert = require('assert');
// const OrbitDB = require('orbit-db')
// const ipfsClient = require('ipfs-http-client')


// const ipfs = ipfsClient({
//     host: "localhost",
//     port: 5001,
//     protocol: 'http'
//   })



// describe('Criteria', async () => {

//     // add custom type to orbitdb
//     OrbitDB.addDatabaseType(TableStore.type, TableStore)

//     let store


//     before('Setup', async () => {

//         let orbitdb = await OrbitDB.createInstance(ipfs)
//         store = await orbitdb.open("testtable", {
//             create: true, 
//             type: "table"
//         })

        
//     })

//     it('should create a schema', async () => {


//         /**
//          * Define a DTO. It should have a static getter named 'constraints'. 
//          * Each constraint can have the following fields:
//          *   - type      - string | boolean | number
//          *   - 'primary' - boolean
//          *   - 'unique'  - boolean 
//          * 
//          */
//         class Player {

//             static get constraints() {
//                 return {
//                     id: { primary: true, unique:true, type: 'number' },
//                     name: { unique: false, type: 'string' },
//                     currentTeam: { unique: false, type: 'string' },
//                     battingHand: { unique: false, type: 'string' },
//                     throwingHand: { unique: false, type: 'string' }
//                 }
//             }
    
//             constructor() {
//                 this.id = null
//                 this.name = null
//                 this.currentTeam = null
//                 this.battingHand = null
//                 this.throwingHand = null
//             }
            
//         }



//         await store.createSchema(Player)

//         // await store.load()

//     })

//     it('should insert a bunch of records', async () => {

//         await store.put(1, {
//             id: 1,
//             name: "Andrew McCutchen",
//             currentTeam: "PIT",
//             battingHand: "R",
//             throwingHand: "L",
//             salary: 1000
//         })

//         await store.put(2, {
//             id: 2,
//             name: "Pedro Alvarez",
//             currentTeam: "BAL",
//             battingHand: "R",
//             throwingHand: "R",
//             salary: 3000
//         })

//         await store.put(3, {
//             id: 3,
//             name: "Jordy Mercer",
//             currentTeam: "PIT",
//             battingHand: "L",
//             throwingHand: "R",
//             salary: 1500
//         })


//         await store.put(4, {
//             id: 4,
//             name: "Doug Drabek",
//             currentTeam: "BAL",
//             battingHand: "R",
//             throwingHand: "L",
//             salary: 4000
//         })
//     })


//     it('should get records greater than another number', async () => {

//         let cr = new Criteria()

//         // To get records having salary more than 2000
//         cr.add(Restrictions.gt("salary", 200))





//     })


//     it('should get records greater than or equal to another number', async () => {
//         // To get records having salary more than 2000
//         cr.add(Restrictions.gte("salary", 2000))
//     })


//     it('should get records less than another number', async () => {
//         // To get records having salary less than 2000
//         cr.add(Restrictions.lt("salary", 2000))
//     })

//     it('should get records less than or equal to another number', async () => {
//         // To get records having salary more than 2000
//         cr.add(Restrictions.lte("salary", 2000))
//     })

//     it('should get records where number is between two other numbers', async () => {
//         // To get records having salary in between 1000 and 2000
//         cr.add(Restrictions.between("salary", 1000, 2000))
//     })



//     it('should get records where a property is null', async () => {
//         // To check if the given property is null
//         cr.add(Restrictions.isNull("salary"))
//     })


//     it('should get records where a boolean property is true', async () => {
//         // To check if the given property is null
//         cr.add(Restrictions.isNull("salary"))
//     })



//     it('should get records where a number property equals a value', async () => {
//         // To get records having fistName starting with zara
//         cr.add(Restrictions.equals("firstName", "zara"))
//     })

//     it('should get records where a string property equals a value', async () => {
//         // To get records having fistName starting with zara
//         cr.add(Restrictions.equals("firstName", "zara"))
//     })


//     it('should get records where a boolean property is false', async () => {
//         // To check if the given property is null
//         cr.add(Restrictions.isNull("salary"))
//     })











//       it('should search multiple criteria', async () => {





//         //Get the list of players that bat right and throw left

//         let criteria = {
//             "battingHand": { comparator: "==", value: "R"},
//             "throwingHand": { comparator: "==", value: "L"}
//         }

//         let matches = await store.getByCriteria(criteria, 100, 0)

//         assert.equal(matches[0].id, 1)
//         assert.equal(matches[1], 2)
        

//       })





// })