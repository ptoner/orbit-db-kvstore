// @ts-nocheck
const IndexDao = require('./IndexDao')
const BTree = require('./BTree')
const { List } = require('./List')

const { sjs } = require('slow-json-stringify');




class TableIndex {

  constructor(ipfs, dbname) {
    
    this.ipfs = ipfs
    this.dbname = dbname

    this.indexDao = new IndexDao(ipfs, dbname)

    this.listCache = new ListCache()
    this.trees = {}

  }

  async createSchema(DTO) {

    console.time('Creating schema')

    let constraints = DTO.constraints

    for (let key in constraints) {

      constraints[key].column = key //make sure the column property gets saved

      this.indexDao.put(key, constraints[key])
    }

    //Load the stringifier
    this.stringify = this._getStringifier()

    //Save to disk
    await this.indexDao.save()

    console.timeEnd('Creating schema')
  }

  async load() {

    await this.indexDao.load()

    //Load the stringifier
    this.stringify = this._getStringifier()

  }

  async commit() {

    console.time('Commit')

    //Save all of the updated cached lists. This will bring all of the index trees up to date.
    console.time('Save lists')
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
    console.timeEnd('Save lists')
    
    //Save all of the index trees.
    console.time('Save trees')
    for (let key in this.trees) {
      
      // console.log(`Commiting tree for index: ${key}`)

      let indexInfo = this.indexDao.get(key)
      let tree = this.trees[key]

      indexInfo.hash = await tree.save()
      
      this.indexDao.put(key, indexInfo)

    }
    console.timeEnd('Save trees')



    await this.indexDao.save()

    console.timeEnd('Commit')

  }

  async count() {
    let primaryTree = await this._getPrimaryTree()
    let count = await primaryTree.count()
    return count - 1 //not really sure why I need to do this. I think there's a blank key'd record for some reason.
  }

  async put(key, value) {

    let existing = await this.get(key)

    //Update indexes
    let indexes = this.indexDao.indexes

    for (let indexName in indexes) {
      await this._updateIndex(indexName, key, value, existing)
    }

  }

  async get(key) {
    let primaryTree = await this._getPrimaryTree()
    let cid = await primaryTree.get(key)

    if (!cid) return

    return this._getFromIpfs(cid)

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


  async getByCriteria(criteria, limit, offset) {




  }


  // /**
  //  * Will only work with numeric primary keys for now.
  //  */
  // async list(offset=0, limit=1) {

  //   let results = []

  //   let primaryTree = await this._getPrimaryTree()

  //   let cids = []

  //   let skipped=0
  //   primaryTree.tree.walkAsc(function(key, cid){

  //     if (skipped < offset) {
  //       skipped++
  //       return 
  //     }

  //     if (cid) {
  //       cids.push(cid)
  //       if (cids.length >= limit) return true
  //     }

  //   }) 

  //   for (let cid of cids) {

  //     let value = await this._getFromIpfs(cid)

  //     if (value) {
  //       results.push(value)
        
  //     }
  //   }



  //   return results

  // }



  async index() {
    //This is being called sometimes and I'm not sure why. Don't want to load the whole database.
    //Will try to think of something.
    return []
  }

  async keys() {
    let primaryTree = await this._getPrimaryTree()
    return primaryTree.keys
  }






  async _updateIndex(indexName, key, value, existing) {

    // console.time(`Updating index: ${indexName}`)

    const tree = await this._getTreeByIndex(indexName)

    //Look up the full index definition from the DAO
    let index = this.indexDao.get(indexName)

    //The key is the value of the indexed field. 
    let indexKey = value ? value[indexName] : null

    
    if (index.unique) {
      
      if (indexKey != undefined) {

        //The value we store in the btree is the primary key. Except in the primary index. Then it's the full object
        if (index.primary) {

          let buffer = Buffer.from(this.stringify(value))
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

      //Otherwise we're storing a list of values. Append this to it.
      let isNew = await this._isNew(existing, value)
      let isChanged = false

      if (!isNew) {
        isChanged = await this._isChanged(existing, value, indexName) 
      }

  

      if (existing && existing[indexName] && isChanged) {    
        let existingHash = await tree.get(existing[indexName])
        await this._deleteFromIndexList(existingHash, indexName, existing[indexName], key)
      }

      //If there's an actual value then insert it
      if (indexKey && (isChanged || isNew)) {
        let existingHash = await tree.get(indexKey)
        await this._addToIndexList(existingHash, indexName, indexKey, key)
      }

    }

    //Update reference in cached list
    this.trees[indexName] = tree

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
    //TODO: If this returns null we should throw an exception
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

    let content = loaded.Data.toString()

    let value = JSON.parse(content)

    return value
  }

  _getStringifier() {

    let formatter = {}

    for (let column in this.indexDao.indexes) {
      let index = this.indexDao.get(column)
      formatter[column] = index.type 
    }

    // Parser definition
    return sjs(formatter);
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
