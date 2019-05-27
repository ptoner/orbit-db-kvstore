const IndexDao = require('./IndexDao')
const BTree = require('./BTree')

const ipfsBtree = require('merkle-btree')



const { List } = require('./List')



class TableIndex {

  constructor(ipfs, dbname, indexes) {
    
    this.ipfs = ipfs
    this.dbname = dbname
    this.indexes = indexes 

    this.indexDao = new IndexDao(ipfs, dbname)
    this.listCache = new ListCache()
    this.trees = {}


    //When merkle-btree was written the ipfs api was slightly different. 
    //I can't figure out how to build that project so I'm fixing it this way.
    //It's not super great.
    let updatedIpfs = {}
    
    Object.assign(updatedIpfs, ipfs)

    updatedIpfs.files = this.ipfs 

    this.ipfsStorage = new ipfsBtree.IPFSStorage(updatedIpfs)

  }



  async commit() {

    console.time('Commit')

    //Save all of the updated cached lists. This will bring all of the index trees up to date.
    let updatedIndexes = this.listCache.getUpdatedIndexes()

    for (let updatedIndex of updatedIndexes) {

      let indexTree = await this._getTreeByIndex(updatedIndex)
      let updatedKeys = this.listCache.getUpdatedKeys(updatedIndex)

      for (let updatedKey of updatedKeys) {
        let list = this.listCache.get(updatedIndex, updatedKey)
        await list.save()
        
        indexTree.put(updatedKey, list.hash )
      }
    }

    
    //Save all of the index trees.
    for (let key in this.trees) {
      
      // console.log(`Commiting tree for index: ${key}`)

      let indexInfo = this.indexDao.get(key)
      let tree = this.trees[key]

      indexInfo.hash = await tree.save()
      
      this.indexDao.put(key, indexInfo)

    }

    console.timeEnd('Commit')

    return this.indexDao.save()
  }

  async load() {

    if (this.indexes) {
      
      for (let index of this.indexes) {
        this.indexDao.put(index.column, index)
      }

      await this.updateSchema()

    } else {
      await this.indexDao.load()
    }

  }

  async updateSchema() {

    //Find new ones and create them.
    for (let index of this.indexes) {

      let existingIndex = this.indexDao.get(index)

      if (!existingIndex) {
        // index.hash = await this._createTree()
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
    let primaryTree = await this._getPrimaryTree()
    return primaryTree.keys
  }


  async get(key) {
    let primaryTree = await this._getPrimaryTree()
    return primaryTree.get(key)
  }


  /**
   * Will only work with numeric primary keys for now.
   */
  async list(offset=0, limit=1) {

    let results = []

    let primaryTree = await this._getPrimaryTree()


    for (let i=offset; results.length < limit && i < await primaryTree.size(); i++) {

      let value = await primaryTree.get(i)

      if (value) {
        results.push(value)
      }

    }

    return results

  }



  async put(key, value) {

    let existing = await this.get(key)


    //Update indexes
    let indexes = this.indexDao.indexes

    for (let indexName in indexes) {

      // console.log(`Adding to ${indexName} index`)

      const tree = await this._getTreeByIndex(indexName)

      //Look up the full index definition from the DAO
      let index = this.indexDao.get(indexName)

      //The key is the value of the indexed field. 
      let indexKey = value ? value[indexName] : null


      //The value we store in the btree is the primary key. Except in the primary index. Then it's the full object
      let indexValue = (index.primary ? value : key)  
      
      
      if (index.unique) {
        
        if (indexKey != undefined) {
          tree.put(indexKey, indexValue)  //If it's a unique index we just put the value in.      
        } else {

          if (index.primary) {
            tree.delete(key) //slightly different interface
          } else {
            tree.del(key) 
          }

                            // If there isn't a value remove the existing one. 
        }

      } else {

        // console.time('update list');

        //Otherwise we're storing a list of values. Append this to it.
        let isNew = await this._isNew(existing, value)
        let isChanged = false

        if (!isNew) {
          isChanged = await this._isChanged(existing, value, indexName) 
        }

    

        if (existing && existing[indexName] && isChanged) {    
          let existingHash = tree.get(existing[indexName])
          await this._deleteFromIndexList(existingHash, indexName, existing[indexName], key)
        }

        //If there's an actual value then insert it
        if (indexKey && (isChanged || isNew)) {
          let existingHash = tree.get(indexKey)
          await this._addToIndexList(existingHash, indexName, indexKey, key)
        }

        // console.timeEnd('update list');


      }

    }


  }


  async _isNew(existing, value) {
    return (existing == null && value != null)
  }

  async _isChanged(existing, value, indexName) {

    let isChanged = (value == null) || (existing[indexName] != value[indexName])

    return isChanged
  }


  async _deleteFromIndexList(existingHash, indexName, indexKey, value) {
    
    if (!indexKey) return 

    // console.log(`_deleteFromExistingIndex: ${existingIndex} / ${key}`)

    let cachedList = await this._getFromCache(indexName, indexKey, existingHash)
    cachedList.deleteValue(value)


    this.listCache.put(indexName, indexKey, cachedList)



  }



  async _addToIndexList(existingHash, indexName, indexKey, value) {

    // console.log(`_addToIndexList: ${indexKey} / ${key}`)

    let cachedList = await this._getFromCache(indexName, indexKey, existingHash)
    cachedList.append(value)

    this.listCache.put(indexName, indexKey, cachedList)

  }




  async _getPrimaryTree() {

    let primaryIndex = this.indexDao.primary

    //If it's already loaded just return it.
    if (this.trees[primaryIndex.column]) {
      return this.trees[primaryIndex.column]
    }

    let tree
    if (primaryIndex.hash) {
      tree = ipfsBtree.MerkleBTree.getByHash(primaryIndex.hash, this.ipfsStorage)
    } else {
      tree = new ipfsBtree.MerkleBTree(this.ipfsStorage)      
    }

    this.trees[primaryIndex.column] = tree

    return tree
    

  }

  async _getTreeByIndex(indexName) {

    //If it's already loaded just return it.
    if (this.trees[indexName]) {
      return this.trees[indexName]
    }


    let index = this.indexDao.get(indexName)

    //If it's the primary index grab that.
    if (index.primary) {
      return this._getPrimaryTree()
    }


    let tree = new BTree(this.ipfs)

    //Load it if it exists
    if (index.hash) {
      await tree.load(index.hash)
    }

    this.trees[indexName] = tree 

    return this.trees[indexName]
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

      let list = await this._getFromCache(indexInfo.column, value, listHash)

      primaryKeys = await list.list(offset, limit)

    }


    let results = []
    let primaryTree = await this._getPrimaryTree()
    for (let primaryKey of primaryKeys) {
      let result = await primaryTree.get(primaryKey)
      results.push(result)
    }



    return results

  }


  async _getFromCache(indexName, indexKey, existingHash) {

    let cachedList = this.listCache.get(indexName, indexKey)

    if (!cachedList) {
      await this._cacheList(existingHash, indexName, indexKey)
      cachedList = this.listCache.get(indexName, indexKey)
    }
    return cachedList
  }

  async _cacheList(existingHash, indexName, indexKey) {

    let list = new List(this.ipfs)

    //Look it up if it exists
    if (existingHash) {
      await list.load(existingHash)
    }

    //Add to cache
    this.listCache.put(indexName, indexKey, list)

  }




  async reset() {
    try {
      await this.ipfs.files.rm(this.dbname.toString(), { recursive: true })
    } catch(ex) {
      console.log(ex)
    }
  }




}



class ListCache {

  constructor() {
    this.cachedLists = {}

    //Key is the indexName and value is an array of updated keys in that index.
    this.updated = {}
  }

  put(indexName, key, value) {

    let listKey = `${indexName}-${key}`

    this.cachedLists[listKey] = value


    let updatedKeys = this.updated[indexName]

    if (!updatedKeys) updatedKeys = []

    if (!updatedKeys.includes(key)) {
      updatedKeys.push(key)
    }

    this.updated[indexName] = updatedKeys

    
  }

  get(indexName, key) {
    return this.cachedLists[`${indexName}-${key}`]
  }  

  getUpdatedKeys(indexName) {
    return this.updated[indexName]
  }

  getUpdatedIndexes() {
    return Object.keys(this.updated)
  }


}





module.exports = TableIndex
