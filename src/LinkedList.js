class LinkedList {

    constructor(ipfs) {

        this.ipfs = ipfs

        /** @var DoublyLinkedListNode */
        this.head = null

        /** @var DoublyLinkedListNode */
        this.tail = null

    }



    /**
     * @param {*} value
     * @return {Promise<LinkedList>}
     */
    async append(value) {

        const newNode = new LinkedListNode(value)
        await this.saveNode(newNode)

        // If there is no head yet let's make new node a head.
        if (!this.head) {
            this.head = newNode
            this.tail = newNode
        } else {
            // Attach new node to the end of linked list.
            this.tail.next = newNode
            await this.saveNode(this.tail)

            this.tail = newNode
        }

        await this.save()

        return this
    }



    /**
       * @param {*} value
       * @return {Promise<LinkedListNode>}
       */
    async delete(value) {

        if (!this.head) {
            return null
        }

        let deletedNode = null

        // If the head must be deleted then make next node that is differ
        // from the head to be a new head.
        while (this.head && this.head.value == value) {
            deletedNode = this.head
            this.head = this.head.next
        }

        let currentNode = this.head

        if (currentNode !== null) {
            // If next node must be deleted then make next node to be a next next one.
            while (currentNode.next) {
                if (currentNode.next.value == value) {

                    deletedNode = currentNode.next
                    currentNode.next = currentNode.next.next

                    await this.saveNode(currentNode)

                } else {

                    currentNode = await this.loadNode(currentNode.next.cid) //currentNode.next
                    
                }
            }
        }

        // Check if tail must be deleted.
        if (this.tail.value == value) {
            this.tail = currentNode
        }

        await this.save()

        return deletedNode
    }


    /**
       * @param {*} value
       * @return {Promise<LinkedListNode>}
       */
    async find(value = undefined) {

        if (!this.head) {
            return null
        }

        let currentNode = this.head

        while (currentNode) {

            // If value is specified then try to compare by value..
            if (value !== undefined && currentNode.value == value) {
                return currentNode
            }

            currentNode = await this.loadNode(currentNode.next.cid)
        }

        return null
    }


    async get(index, limit = 1) {

        let results = []

        if (!this.head) {
            return results
        }

        let counter = 0

        let currentNode = await this.loadNode(this.head.cid)

        while (currentNode && results.length < limit) {

            if (counter >= index) {
                results.push(currentNode.value)
            } 

            if (currentNode.next && currentNode.next.cid) {
                currentNode = await this.loadNode(currentNode.next.cid)
            } else {
                currentNode = null
            }
            
            counter++
        }


        return results

    }


    /**
     * @return {LinkedListNode[]}
     */
    toArray() {
        const nodes = []

        let currentNode = this.head
        while (currentNode) {
            nodes.push(currentNode)
            currentNode = currentNode.next
        }

        return nodes
    }

    /**
     * @param {*[]} values - Array of values that need to be converted to linked list.
     * @return {Promise<LinkedList>}
     */
    async fromArray(values) {

        for (let value of values) {
            await this.append(value)
        }

        return this
    }

    /**
     * @param {function} [callback]
     * @return {string}
     */
    toString(callback) {
        return this.toArray().map(node => node.toString(callback)).toString()
    }

    async load(cid) {
        let list = await this.ipfs.object.get(cid)
        let data = JSON.parse(list.data)

        this.head = await this.loadNode(data.head)
        this.tail = await this.loadNode(data.tail)

        Object.assign(this, data)
    }

    async save() {

        let list = {
            head: this.head.cid,
            tail: this.tail.cid
        }

        let buffer = Buffer.from(JSON.stringify(list))
        let cid = await this.ipfs.object.put(buffer)
        return cid.toString()
    }


    async loadNode(cid) {

        let node = await this.ipfs.object.get(cid)
        let data = JSON.parse(node.data)

        let next = new LinkedListNode(undefined, undefined, data.next)

        return new LinkedListNode(data.value, next, cid)
    }

    async saveNode(node) {

        let saved = {
            value: node.value,
            cid: node.cid 
        }

        if (node.next) {
            saved.next = node.next.cid 
        }


        let buffer = Buffer.from(JSON.stringify(saved))

        let cid = await this.ipfs.object.put(buffer)

        node.cid = cid.toString()
    }

}


class LinkedListNode {

    constructor(value, next = null, cid = null) {

        this.value = value
        this.next = next
        this.cid = cid
    }

    toString(callback) {
        return callback ? callback(this.value) : `${this.value}`
    }
}


module.exports = { LinkedListNode, LinkedList }