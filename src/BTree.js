// const btree = require("btreejs")
const btree = require('merkle-btree')

// const Tree = btree.create(2, btree.numcmp)

class BTree {

    constructor(ipfs) {
        this.ipfs = ipfs         
        

        //When merkle-btree was written the ipfs api was slightly different. 
        //I can't figure out how to build that project so I'm fixing it this way.
        //It's not super great.
        let updatedIpfs = {}
        
        Object.assign(updatedIpfs, ipfs)

        updatedIpfs.files = this.ipfs 

        this.ipfsStorage = new btree.IPFSStorage(updatedIpfs)


        this.tree = new btree.MerkleBTree(this.ipfsStorage, 64)

    }

    get(key) {
        return this.tree.get(key)
    }

    put(key, value) {
        this.tree.put(key, value)
    }

    del(key) {
        this.tree.delete(key)
    }

    count(minKey, maxKey) {
        return this.tree.size()
    }

    async save() {

        // let values = {}

        // if (this.tree.count() > 0) {
        //     this.tree.walkDesc(function(key, value){
        //         values[key] = value
        //     })
        // }

        // let buffer = Buffer.from(JSON.stringify(values))
        // let cid = await this.ipfs.object.put(buffer)

        this.hash = await this.tree.save()

        return this.hash
    }

    async load(cid) {
        
        this.tree = await btree.MerkleBTree.getByHash(cid, this.ipfsStorage, 64)
        

        // let loaded = await this.ipfs.object.get(cid)

        // let data = loaded.data.toString()

        // data = JSON.parse(data)

        // for (let key in data) {
        //     this.tree.put(key, data[key])
        // }


        this.hash = cid
    }


}

module.exports = BTree