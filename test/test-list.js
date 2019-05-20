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
    await list.save()

    await list.append(50)
    await list.append(60)
    await list.append(70)
    await list.append(80)

    //Act
    await list.delete(2)

    //Assert
    let _50 = await list.get(0)
    let _60 = await list.get(1)
    let _80 = await list.get(2)
    let _none = await list.get(3)

    assert.equal(_50[0], 50)
    assert.equal(_60[0], 60)
    assert.equal(_80[0], 80)
    assert.equal(_none[0], undefined)


    //Add some more
    await list.append(90)
    await list.append(100)
    await list.append(110)
    await list.append(120)


    await list.delete(4) //100
    
    let _90 = await list.get(3)
    let _120 = await list.get(4)
    let _110 = await list.get(5)

    assert.equal(_90[0], 90)
    assert.equal(_120[0], 120)
    assert.equal(_110[0], 110)



    await list.delete(3) // 90

    let _110_2 = await list.get(3)
    let _120_2 = await list.get(4)

    assert.equal(_110_2[0], 110)
    assert.equal(_120_2[0], 120)

  })


  it('should delete by value from list', async () => {

    const list = new UnorderedList(ipfs)
    await list.save()

    await list.append(1)
    await list.append(1)
    await list.append(2)
    await list.append(3)
    await list.append(3)
    await list.append(3)
    await list.append(4)
    await list.append(5)


    await list.deleteValue(3)
    assert.equal(await list.toString(), "1,1,2,5,3,3,4")

    await list.deleteValue(3)
    assert.equal(await list.toString(), "1,1,2,5,4,3")

    await list.deleteValue(3)
    assert.equal(await list.toString(), "1,1,2,5,4")


    await list.deleteValue(1)
    assert.equal(await list.toString(), "4,1,2,5")

    await list.deleteValue(1)
    assert.equal(await list.toString(), "4,5,2")



  })





//   it('should be possible to store objects in the list and to print them out', async () => {
//     const linkedList = new LinkedList(ipfs)

//     const nodeValue1 = { value: 1, key: 'key1' }
//     const nodeValue2 = { value: 2, key: 'key2' }

//     linkedList
//       .append(nodeValue1)
//       .prepend(nodeValue2)

//     const nodeStringifier = value => `${value.key}:${value.value}`

//     expect(linkedList.toString(nodeStringifier)).toBe('key2:2,key1:1')
//   })





//   it('should find node by value', async () => {
//     const linkedList = new LinkedList(ipfs)

//     expect(linkedList.find({ value: 5 })).toBeNull()

//     linkedList.append(1)
//     expect(linkedList.find({ value: 1 })).toBeDefined()

//     linkedList
//       .append(2)
//       .append(3)

//     const node = linkedList.find({ value: 2 })

//     expect(node.value).toBe(2)
//     expect(linkedList.find({ value: 5 })).toBeNull()
//   })





//   it('should find node by callback', async () => {
//     const linkedList = new LinkedList(ipfs)

//     linkedList
//       .append({ value: 1, key: 'test1' })
//       .append({ value: 2, key: 'test2' })
//       .append({ value: 3, key: 'test3' })

//     const node = linkedList.find({ callback: value => value.key === 'test2' })

//     expect(node).toBeDefined()
//     expect(node.value.value).toBe(2)
//     expect(node.value.key).toBe('test2')
//     expect(linkedList.find({ callback: value => value.key === 'test5' })).toBeNull()
//   })






//   it('should save and load nodes from IPFS', async () => {

//     const linkedList = new LinkedList(ipfs)

//     //Arrange
//     let node = new LinkedListNode("one", "XYZ", "123")
    
//     //Act
//     await linkedList.saveNode(node)

//     //Assert
//     expect(node.cid).toBe("Qmf7zeXq795miPLzB412tyP5kizR7TDi99WxqAMEcS951z")

//     let loaded = await linkedList.loadNode(node.cid)

//     expect(loaded.value).toBe("one")
//     expect(loaded.next).toBe("XYZ")
//     expect(loaded.previous).toBe("123")
//     expect(loaded.cid).toBe("Qmf7zeXq795miPLzB412tyP5kizR7TDi99WxqAMEcS951z")

//   })






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