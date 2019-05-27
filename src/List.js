
class List {

    constructor(ipfs) {

        this.ipfs = ipfs
        
        this.hash = null

        this.values = []

    }



    /**
     * @param {*} value
     * @return {List}
     */
    append(value) {
        this.values.push(value)
        return this
    }


    /**
       * @param {*} index
       * @return {List}
       */
    delete(index) {

        if (this.values.length == 0) return

        this.values.splice(index, 1)

       return this
    }


    /**
     * Deletes the first occurrence of the specified value in the list
     * @param {*} value 
     */
    deleteValue(value) {

        if (this.values.length == 0) return

        let index = this.values.indexOf(value)

        return this.delete(index)
    }



    list(index, limit = 1) {

        let results = []
        
        for (let i=index; i < this.values.length && results.length < limit; i++) {
            let value = this.values[i]
            results.push(value)
        }

        return results
    }

    get(index) {
        return this.values[index]
    }


    toString() {

        let string = ''

        for (let i=0; i < this.values.length; i++) {
            let value = this.values[i]

            string += `${value},`
        }

        return string.substring(0, string.length-1)

    }


    async load(cid) {

        // console.time("List load")

        let list = await this.ipfs.object.get(cid)

        let data = list.data.toString()

        data = JSON.parse(data)


        this.values = data.values
        this.hash = cid

        // console.timeEnd("List load")

    }

    async save() {

        // console.time("List save")

        //Serialize
        let list = {
            values: this.values,
        }

        let buffer = Buffer.from(JSON.stringify(list))
        let cid = await this.ipfs.object.put(buffer)

        this.hash = cid.toString()

        // console.timeEnd("List save")

        return this.hash
    }



}




module.exports = { List }