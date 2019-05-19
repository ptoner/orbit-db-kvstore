// @ts-nocheck

const {LinkedList, LinkedListNode} = require('../src/LinkedList')
var expect = require('expect')
var assert = require('assert')


const ipfsClient = require('ipfs-http-client')


const ipfs = ipfsClient({
    host: "localhost",
    port: 5001,
    protocol: 'http'
  })



describe('LinkedList', () => {

//   it('should create empty linked list', async () => {
//     const linkedList = new LinkedList(ipfs)
//     expect(linkedList.toString()).toBe('')
//   })



// it('should append single node to linked list', async () => {

//     //Arrange
//     const linkedList = new LinkedList(ipfs)

//     //Act
//     await linkedList.append(50)

//     //Assert
//     let _0 = await linkedList.get(0)

//     assert.equal(_0[0], 50)

//   })


  it('should append multiple nodes to linked list', async () => {

    //Arrange
    const linkedList = new LinkedList(ipfs)


    //Act
    await linkedList.append(50)
    await linkedList.append(60)
    await linkedList.append(70)
    await linkedList.append(80)

    //Assert
    let _50 = await linkedList.get(0)
    let _60 = await linkedList.get(1)
    let _70 = await linkedList.get(2)
    let _80 = await linkedList.get(3)

    assert.equal(_50[0], 1)
    assert.equal(_60[0], 2)
    assert.equal(_70[0], 3)
    assert.equal(_80[0], 4)

  })




//   it('should create linked list from array', async () => {

//     const linkedList = new LinkedList(ipfs)

//     await linkedList.fromArray([1, 1, 2, 3, 3, 3, 4, 5])

//     let _0 = await linkedList.get(0)
//     let _1 = await linkedList.get(1)
//     let _2 = await linkedList.get(2)
//     let _3 = await linkedList.get(3)
//     let _4 = await linkedList.get(4)
//     let _5 = await linkedList.get(5)
//     let _6 = await linkedList.get(6)
//     let _7 = await linkedList.get(7)


//     assert.equal(_0[0].value, 0)
//     assert.equal(_1[0].value, 1)
//     assert.equal(_2[0].value, 2)
//     assert.equal(_3[0].value, 3)
//     assert.equal(_4[0].value, 4)
//     assert.equal(_5[0].value, 5)
//     assert.equal(_6[0].value, 6)
//     assert.equal(_7[0].value, 7)


//   })




//   it('should delete node by value from linked list', async () => {

//     const linkedList = new LinkedList(ipfs)

//     expect(linkedList.delete(5)).toBeNull()

//     linkedList.append(1)
//     linkedList.append(1)
//     linkedList.append(2)
//     linkedList.append(3)
//     linkedList.append(3)
//     linkedList.append(3)
//     linkedList.append(4)
//     linkedList.append(5)

//     expect(linkedList.head.toString()).toBe('1')
//     expect(linkedList.tail.toString()).toBe('5')

//     const deletedNode = linkedList.delete(3)
//     expect(deletedNode.value).toBe(3)
//     expect(linkedList.tail.previous.previous.value).toBe(2)
//     expect(linkedList.toString()).toBe('1,1,2,4,5')

//     linkedList.delete(3)
//     expect(linkedList.toString()).toBe('1,1,2,4,5')

//     linkedList.delete(1)
//     expect(linkedList.toString()).toBe('2,4,5')

//     expect(linkedList.head.toString()).toBe('2')
//     expect(linkedList.head.next.next).toBe(linkedList.tail)
//     expect(linkedList.tail.previous.previous).toBe(linkedList.head)
//     expect(linkedList.tail.toString()).toBe('5')

//     linkedList.delete(5)
//     expect(linkedList.toString()).toBe('2,4')

//     expect(linkedList.head.toString()).toBe('2')
//     expect(linkedList.tail.toString()).toBe('4')

//     linkedList.delete(4)
//     expect(linkedList.toString()).toBe('2')

//     expect(linkedList.head.toString()).toBe('2')
//     expect(linkedList.tail.toString()).toBe('2')
//     expect(linkedList.head).toBe(linkedList.tail)

//     linkedList.delete(2)
//     expect(linkedList.toString()).toBe('')
//   })





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