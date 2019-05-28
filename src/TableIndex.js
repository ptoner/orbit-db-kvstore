const IndexDao = require('./IndexDao')
const BTree = require('./BTree')
const { List } = require('./List')



class TableIndex {

  constructor(ipfs, dbname, indexes) {
    
    this.ipfs = ipfs
    this.dbname = dbname
    this.indexes = indexes 

    this.indexDao = new IndexDao(ipfs, dbname)
    this.listCache = new ListCache()
    this.trees = {}

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







  /**
   * Will only work with numeric primary keys for now.
   */
  async list(offset=0, limit=1) {

    let results = []

    let primaryTree = await this._getPrimaryTree()

    let cids = []

    primaryTree.tree.walkAsc(function(key, cid){

      if (cid) {
        cids.push(cid)
        if (cids.length >= limit) return true
      }

    }) 

    for (let cid of cids) {

      let value = await this._getFromIpfs(cid)

      if (value) {
        results.push(value)
        
      }
    }



    return results

  }



  async put(key, value) {

    // console.time(`Put key: ${key}`)


    let existing = await this.get(key)


    //Update indexes
    let indexes = this.indexDao.indexes

    for (let indexName in indexes) {
      await this._updateIndex(indexName, key, value, existing)
    }

    // console.timeEnd(`Put key: ${key}`)

  }


  async _updateIndex(indexName, key, value, existing) {

    // console.time(`Updating index: ${indexName}`)

    // console.log(`Adding to ${indexName} index`)

    const tree = await this._getTreeByIndex(indexName)

    //Look up the full index definition from the DAO
    let index = this.indexDao.get(indexName)

    //The key is the value of the indexed field. 
    let indexKey = value ? value[indexName] : null


     
    
    
    if (index.unique) {
      
      if (indexKey != undefined) {

        //The value we store in the btree is the primary key. Except in the primary index. Then it's the full object
        if (index.primary) {

          let buffer = Buffer.from(JSON.stringify(value))
          let cid = await this.ipfs.object.put(buffer)

          tree.put(indexKey, cid.toString())
        } else {
          tree.put(indexKey, key) 
        }

             
      } else {
        tree.del(key) 
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

    // console.timeEnd(`Updating index: ${indexName}`)
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
    return this._getTreeByIndex(primaryIndex.column)
    

  }

  async _getTreeByIndex(indexName) {

    //If it's already loaded just return it.
    if (this.trees[indexName]) {
      return this.trees[indexName]
    }


    let index = this.indexDao.get(indexName)
    let tree = new BTree(this.ipfs)

    //Load it if it exists
    if (index.hash) {
      await tree.load(index.hash)
    }

    this.trees[indexName] = tree 

    return this.trees[indexName]
  } 


  async get(key) {
    let primaryTree = await this._getPrimaryTree()
    let cid = primaryTree.get(key)

    if (!cid) return

    return await this._getFromIpfs(cid)

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
      let cid = await primaryTree.get(primaryKey)
      let result = await this._getFromIpfs(cid)
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

  async _getFromIpfs(cid) {
    let loaded = await this.ipfs.object.get(cid)
    let value = JSON.parse(loaded.data)
    return value
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
