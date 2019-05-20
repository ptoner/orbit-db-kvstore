const IndexDao = require('./IndexDao')
const btree = require('merkle-btree')
const { UnorderedList } = require('../src/UnorderedList')



class TableIndex {

  constructor(ipfs, dbname, indexes) {
    
    this.ipfs = ipfs
    this.dbname = dbname
    this.indexes = indexes 

    this.indexDao = new IndexDao(ipfs, dbname)

    //When merkle-btree was written the ipfs api was slightly different. 
    //I can't figure out how to build that project so I'm fixing it this way.
    //It's not super great.
    let updatedIpfs = {}
    
    Object.assign(updatedIpfs, ipfs)

    updatedIpfs.files = this.ipfs 

    this.ipfsStorage = new btree.IPFSStorage(updatedIpfs)
  }





  async load() {
    await this.indexDao.load()
    await this.updateSchema()
  }

  async updateSchema() {

    //Find new ones and create them.
    for (let index of this.indexes) {

      let existingIndex = this.indexDao.get(index)

      if (!existingIndex) {
        index.hash = await this._createTree()
        this.indexDao.put(index.column, index)
      }

    }

    //Delete unused ones
    for (let index in this.indexDao.indexes) {

      //Check in the new list for it.
      let exists = false
      for (let newIndex of this.indexes) {
        if (index == newIndex.column ) {
          exists = true
          break 
        }
      }


      if (!exists) {
        this.indexDao.delete(index)
      }

    }

    await this.indexDao.save()

  }


  async index() {
    //This is being called sometimes and I'm not sure why. Don't want to load the whole database.
    //Will try to think of something.
    return []
  }

  async keys() {
  }


  async get(key) {
    let primaryTree = await this._getPrimaryTree()
    return primaryTree.get(key)
  }


  async put(key, value) {

    let existing = await this.get(key)


    //Update indexes
    let indexes = this.indexDao.indexes

    for (let indexName in indexes) {

      const tree = await this._getTreeByIndex(indexName)

      //Look up the full index definition from the DAO
      let index = this.indexDao.get(indexName)

      //The key is the value of the indexed field. 
      let indexKey = value[indexName]

      if (indexKey) {
        //The value we store in the btree is the primary key. Except in the primary index. Then it's the full object
        let indexValue = (index.primary ? value : key)  
        
        
        if (index.unique) {
          
          //If it's a unique index we just put the value in.
          await tree.put(indexKey, indexValue)

        } else {

          //Otherwise we're storing a list of values. Append this to it.

          //Figure out if this value is already in a different list inside this index.
          if (existing) {
            
            let existingIndex = existing[indexName]
            
            if (existingIndex) {
  
              let existingList = await this._getList(tree, existingIndex)
              
              await existingList.deleteValue(indexValue)
              let newHash = await existingList.save()
  
              await tree.put(existingIndex, newHash)
  
            }

          }

          let list = await this._getList(tree, indexKey)
          await list.append(indexValue)


          //Update the hash
          let listHash = await list.save()

          await tree.put(indexKey, listHash)


        }

        //Save the tree so we get the new root node hash. Update the existing index with it.
        let existingIndex = this.indexDao.get(indexName)
        existingIndex.hash = await tree.save() 

        this.indexDao.put(indexName, existingIndex)
      }

    }

    await this.indexDao.save()

  }



  async _getPrimaryTree() {
    let primaryIndex = this.indexDao.primary
    return this._getTreeByIndex(primaryIndex.column)
  }

  async _getTreeByIndex(indexName) {
    let index = this.indexDao.get(indexName)
    return btree.MerkleBTree.getByHash(index.hash, this.ipfsStorage)
  } 



  async _createTree() {
    let tree = new btree.MerkleBTree(this.ipfsStorage)
    let hash = await tree.save()
    return hash
  }


  async getByIndex(index, value, limit=1, offset=0 ) {

    const indexInfo = this.indexDao.get(index)

    const tree = await this._getTreeByIndex(index)

    //If there isn't even an index just return an empty array
    if (!tree) {
      return []
    }

    
    let primaryKeys = []

    if (indexInfo.unique) {

      //It'll just be an actual value.
      let storedValue = await tree.get(value)

      //We don't get a key we get the actual stored object. Return it.
      if (indexInfo.primary) {
        return [storedValue]
      } else {
        //It's only a primary key
        primaryKeys.push(storedValue)
      }

      
    } else {

      let listHash = await tree.get(value)

      //It'll be a hash of a list. 
      let list = new UnorderedList(this.ipfs)
      await list.load(listHash)

      primaryKeys = await list.get(offset, limit)

    }


    let results = []
    for (let primaryKey of primaryKeys) {
      results.push(await this.get(primaryKey))
    }



    return results

  }



  async reset() {
    try {
      await this.ipfs.files.rm(this.dbname.toString(), { recursive: true })
    } catch(ex) {
      console.log(ex)
    }
  }


  async _getList(tree, indexKey) {

    let list = new UnorderedList(this.ipfs)

    let existingHash = await tree.get(indexKey)

    if (existingHash) {
      await list.load(existingHash)
    } {
      await list.save()
    }

    return list
  }


}









module.exports = TableIndex
