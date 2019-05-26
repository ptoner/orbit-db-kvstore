const btree = require("btreejs")


class BTree {

    constructor(ipfs) {
        this.tree = null
        this.ipfs = ipfs 
    }

    get(key) {
        return this.tree.get(key)
    }

    put(key, value) {
        this.tree.put(key, value)
    }

    async save() {

        if (!this.tree) {
            const Tree = btree.create(2, btree.numcmp)
            this.tree = new Tree()
        }

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

        const Tree = btree.create(2, btree.numcmp)
        const listTree = new Tree()

        for (let key in data) {
            listTree.put(key, data[key])
        }


        this.tree = listTree
        this.hash = cid
    }


}

module.exports = BTree