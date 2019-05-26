// const btree = require('merkle-btree')
const btree = require("btreejs")


class UnorderedList {

    constructor(ipfs) {

        this.ipfs = ipfs
        
        this.tree = null
        this.hash = null
    }



    /**
     * @param {*} value
     * @return {UnorderedList}
     */
    append(value) {
        this.tree.put(this.tree.count(), value)
        return this
    }


    /**
       * @param {*} index
       * @return {UnorderedList}
       */
    delete(index) {

        if (this.tree.count() == 0) return

        //Grab the value in the last slot
        let lastIndex = this.tree.count()-1   
        let lastValue = this.tree.get(lastIndex)

    
        //Move it and overwrite the one we're deleting
        this.tree.put(index, lastValue)

        this.tree.del(lastIndex) //Drop the last one

       return this
    }


    /**
     * Deletes the first occurrence of the specified value in the list
     * @param {*} value 
     */
    deleteValue(value) {

        if (this.tree.count() == 0) return

        let index = this.indexOf(value)

        return this.delete(index)
    }


    /**
     * Returns the index of the first occurrence of the specified value in this list, or -1 if this list does not contain the value 
     * @param {*} value 
     */
    indexOf(value) {

        for (let i=0; i < this.tree.count(); i++) {
            let possible = this.tree.get(i)

            if (possible == value) return i 

        }

        return -1

    }

    list(index, limit = 1) {

        let results = []
        
        for (let i=index; i < this.tree.count() && results.length < limit; i++) {
            let value = this.tree.get(i)
            results.push(value)
        }

        return results
    }

    get(index) {
        return this.tree.get(index)
    }


    toString() {

        let string = ''

        for (let i=0; i < this.tree.count(); i++) {
            let value = this.tree.get(i)

            string += `${value},`
        }

        return string.substring(0, string.length-1)

    }


    async load(cid) {

        let list = await this.ipfs.object.get(cid)

        let data = list.data.toString()

        data = JSON.parse(data)


        const Tree = btree.create(2, btree.numcmp)
        const listTree = new Tree()

        let values = data.tree.split(",")

        let counter=0
        for (let value of values) {
            listTree.put(counter, parseInt(value))
            counter++
        }


        this.tree = listTree
        this.hash = cid

    }

    async save() {

        if (!this.tree) {
            const Tree = btree.create(2, btree.numcmp)
            this.tree = new Tree()
        }


        let treeString = ""

        if (this.tree.count() > 0) {
            this.tree.walkAsc(function(key, value){
                treeString += `${value},`

            })

            treeString = treeString.slice(0, -1)

        }



        //Serialize
        let list = {
            tree: treeString
        }

        let buffer = Buffer.from(JSON.stringify(list))
        let cid = await this.ipfs.object.put(buffer)

        this.hash = cid.toString()

        return this.hash
    }



}




module.exports = { UnorderedList }