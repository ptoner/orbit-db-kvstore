const btree = require('merkle-btree')


class UnorderedList {

    constructor(ipfs) {

        this.ipfs = ipfs
        
        this.tree = null


        //When merkle-btree was written the ipfs api was slightly different. 
        //I can't figure out how to build that project so I'm fixing it this way.
        //It's not super great.
        let updatedIpfs = {}
        
        Object.assign(updatedIpfs, ipfs)

        updatedIpfs.files = this.ipfs 

        this.ipfsStorage = new btree.IPFSStorage(updatedIpfs)



        //Fields that get serialized

        this.length = 0
        this.treeHash = null

    }



    /**
     * @param {*} value
     * @return {Promise<UnorderedList>}
     */
    async append(value) {

        this.length++

        await this.tree.put(this.length-1, value)

        await this.save()

        return this
    }



    /**
       * @param {*} index
       * @return {Promise<UnorderedList>}
       */
    async delete(index) {

        if (this.length == 0) return


        //Delete what's in that index currently
        await this.tree.delete(index)


        //Grab the value in the last slot
        let lastValue = await this.tree.get(this.length-1)

        //Move it and overwrite the one we're deleting
        await this.tree.put(index, lastValue)

        this.length--

        await this.save()

       return this
    }


    /**
     * Deletes the first occurrence of the specified value in the list
     * @param {*} value 
     */
    async deleteValue(value) {

        if (this.length == 0) return

        let index = await this.indexOf(value)

        return this.delete(index)
    }


    /**
     * Returns the index of the first occurrence of the specified value in this list, or -1 if this list does not contain the value 
     * @param {*} value 
     */
    async indexOf(value) {

        for (let i=0; i < this.length; i++) {
            let possible = await this.tree.get(i)

            if (possible == value) return i 

        }

        return -1

    }


    async get(index, limit = 1) {

        let results = []
        
        for (let i=index; i < this.length && results.length < limit; i++) {
            let value = await this.tree.get(i)
            results.push(value)
        }

        return results

    }


    async toString() {

        let string = ''

        for (let i=0; i < this.length; i++) {
            let value = await this.tree.get(i)

            string += `${value},`
        }

        return string.substring(0, string.length-1)

    }


    async load(cid) {
        let list = await this.ipfs.object.get(cid)
        let data = JSON.parse(list.data)

        Object.assign(this, data)

        this.tree = btree.MerkleBTree.getByHash(this.treeHash, this.ipfsStorage)

    }

    async save() {

        if (!this.tree) {
            this.tree = new btree.MerkleBTree(this.ipfsStorage)
        }

        this.treeHash = await this.tree.save()

        let list = {
            treeHash: this.treeHash,
            length: this.length
        }

        let buffer = Buffer.from(JSON.stringify(list))
        let cid = await this.ipfs.object.put(buffer)
        return cid.toString()
    }



}




module.exports = { UnorderedList }