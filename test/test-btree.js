// @ts-nocheck
const BTree  = require('../src/BTree')
var assert = require('assert')


const ipfsClient = require('ipfs-http-client')


const ipfs = ipfsClient({
  host: "localhost",
  port: 5001,
  protocol: 'http'
})



describe('BTree', () => {


  it('should save and load from IPFS', async () => {

    const tree = new BTree(ipfs)
    await tree.save()

    tree.put("cat", "party")
    tree.put("horse", "carnival")
    tree.put("taco", "bueno")

    await tree.save()

    assert.equal(tree.hash, "QmWwdNqCsGubQBZULJ4Do458GXUvPbjqWdmJajD2uSQCgU")


    const tree2 = new BTree(ipfs)
    await tree2.load(tree.hash)

    let party = tree2.get("cat")
    let carnival = tree2.get("horse")
    let bueno = tree2.get("taco")

    assert.equal(party, "party")
    assert.equal(carnival, "carnival")
    assert.equal(bueno, "bueno")



  })






})