// @ts-nocheck

const {UnorderedList} = require('../src/UnorderedList')
var expect = require('expect')
var assert = require('assert')


const ipfsClient = require('ipfs-http-client')


const ipfs = ipfsClient({
    host: "localhost",
    port: 5001,
    protocol: 'http'
  })



describe('UnorderedList', () => {



it('should append single node to linked list', async () => {

    //Arrange
    const list = new UnorderedList(ipfs)
    await list.save()


    //Act
    await list.append(50)

    //Assert
    let _0 = await list.get(0)

    assert.equal(_0[0], 50)

  })


  it('should append multiple values to list', async () => {

    //Arrange
    const list = new UnorderedList(ipfs)
    await list.save()


    //Act
    await list.append(50)
    await list.append(60)
    await list.append(70)
    await list.append(80)

    //Assert
    let _50 = await list.get(0)
    let _60 = await list.get(1)
    let _70 = await list.get(2)
    let _80 = await list.get(3)

    assert.equal(_50[0], 50)
    assert.equal(_60[0], 60)
    assert.equal(_70[0], 70)
    assert.equal(_80[0], 80)

  })



  it('should delete values from list by index', async () => {

    //Arrange
    const list = new UnorderedList(ipfs)
    list.save()

    list.append(50)
    list.append(60)
    list.append(70)
    list.append(80)

    //Act
    list.delete(2)

    //Assert
    let _50 = list.get(0)
    let _60 = list.get(1)
    let _80 = list.get(2)
    let _none = list.get(3)

    assert.equal(_50[0], 50)
    assert.equal(_60[0], 60)
    assert.equal(_80[0], 80)
    assert.equal(_none[0], undefined)


    //Add some more
    list.append(90)
    list.append(100)
    list.append(110)
    list.append(120)


    list.delete(4) //100
    
    let _90 = list.get(3)
    let _120 = list.get(4)
    let _110 = list.get(5)

    assert.equal(_90[0], 90)
    assert.equal(_120[0], 120)
    assert.equal(_110[0], 110)



    list.delete(3) // 90

    let _110_2 = list.get(3)
    let _120_2 = list.get(4)

    assert.equal(_110_2[0], 110)
    assert.equal(_120_2[0], 120)

  })


  it('should delete by value from list', async () => {

    const list = new UnorderedList(ipfs)
    list.save()

    list.append(1)
    list.append(1)
    list.append(2)
    list.append(3)
    list.append(3)
    list.append(3)
    list.append(4)
    list.append(5)


    list.deleteValue(3)
    assert.equal(list.toString(), "1,1,2,5,3,3,4")

    list.deleteValue(3)
    assert.equal(list.toString(), "1,1,2,5,4,3")

    list.deleteValue(3)
    assert.equal(list.toString(), "1,1,2,5,4")


    list.deleteValue(1)
    assert.equal(list.toString(), "4,1,2,5")

    list.deleteValue(1)
    assert.equal(list.toString(), "4,5,2")



  })


  // it('should add a lot of records', async () => {

  //   const list = new UnorderedList(ipfs)
  //   await list.save()


  //   for (let i=0; i < 1000; i++) {
  //     console.log(`Appending ${i} of 1000`)
  //     await list.append(i)
  //   }

  //   await list.save()

  //   assert.equal(list.hash, "QmPBQBpd2P9WWE2GkbFBLQA9FuRbrHo8KYtA44DgGoYF6M")


  //   const list2 = new UnorderedList(ipfs)
  //   await list2.load(list.hash)

  //   assert.equal(await list2.toString(), "1,1,2,3,3,3,4,5")

  // })




  it('should save and load from IPFS', async () => {

    const list = new UnorderedList(ipfs)
    await list.save()

    list.append(1)
    list.append(1)
    list.append(2)
    list.append(3)
    list.append(3)
    list.append(3)
    list.append(4)
    list.append(5)

    await list.save()

    assert.equal(list.hash, "QmatsUiZLAMo7uvhFJDcHBWvgYg4dDnLp17y5hkA3hkFeJ")


    const list2 = new UnorderedList(ipfs)
    await list2.load(list.hash)

    assert.equal(list2.toString(), "1,1,2,3,3,3,4,5")

  })






//   it('should save and load the list from IPFS', async () => {

//     const linkedList = new LinkedList(ipfs)

//     //Arrange
//     linkedList
//         .append(1)
//         .append(2)
//         .append(3)
//         .append(4)


//     //Act
//     let cid = await linkedList.save()

//     //Assert
//     expect(node.cid).toBe("Qmf7zeXq795miPLzB412tyP5kizR7TDi99WxqAMEcS951z")

//     let loaded = await linkedList.load(cid.toString())

//     expect(loaded.toString()).toBe('1,2,3,4')

//   })






})