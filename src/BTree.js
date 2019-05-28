const btree = require("btreejs")

const Tree = btree.create(2, btree.numcmp)

class BTree {

    constructor(ipfs) {
        this.ipfs = ipfs         
        this.tree = new Tree()

    }

    get(key) {
        return this.tree.get(key)
    }

    put(key, value) {
        this.tree.put(key, value)
    }

    del(key) {
        this.tree.del(key)
    }

    count(minKey, maxKey) {
        return this.tree.count(minKey, maxKey)
    }

    async save() {

        let values = {}

        if (this.tree.count() > 0) {
            this.tree.walkDesc(function(key, value){
                values[key] = value
            })
        }

        let buffer = Buffer.from(JSON.stringify(values))
        let cid = await this.ipfs.object.put(buffer)

        this.hash = cid.toString()

        return this.hash
    }

    async load(cid) {
        
        let loaded = await this.ipfs.object.get(cid)

        let data = loaded.data.toString()

        data = JSON.parse(data)

        for (let key in data) {
            this.tree.put(key, data[key])
        }


        this.hash = cid
    }


}

module.exports = BTree