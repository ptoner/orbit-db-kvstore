const IndexDao = require('./IndexDao')


const BTree = require('./BTree')


const { List } = require('./List')



class TableIndex {

  constructor(ipfs, dbname, indexes) {
    
    this.ipfs = ipfs
    this.dbname = dbname
    this.indexes = indexes 

    this.indexDao = new IndexDao(ipfs, dbname)
    this.trees = {}
  }



  async commit() {

    console.log('Commit')

    for (let key in this.trees) {
      
      let tree = this.trees[key]
      await tree.save()

      let index = this.indexDao.get(key)
      index.hash = tree.hash

      this.indexDao.put(index)

    }

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


    for (let i=offset; results.length < limit && i < await primaryTree.count(); i++) {

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
        
        if (indexKey) {
          tree.put(indexKey, indexValue)  //If it's a unique index we just put the value in.      
        } else {
          tree.del(key)                   // If there isn't a value remove the existing one. 
        }

      } else {

        console.time('update list');

        //Otherwise we're storing a list of values. Append this to it.
        let isNew = this._isNew(existing, value)
        let isChanged = this._isChanged(existing, value, indexName) 


        if (existing && isChanged) {
          await this._deleteFromIndexList(existing[indexName], key, tree)
        }

        //If there's an actual value then insert it
        if (indexKey && (isChanged || isNew)) {
          await this._addToIndexList(indexKey, key, tree)
        }

        console.timeEnd('update list');


      }


      // //Save the tree so we get the new root node hash. Update the existing index with it.
      // let existingIndex = this.indexDao.get(indexName)
      // existingIndex.hash = await tree.save() 

      // this.indexDao.put(indexName, existingIndex)
    }


  }


  async _isNew(existing, value) {
    return (existing == null && value != null)
  }

  async _isChanged(existing, value, indexName) {

    let isChanged = false 
    let isNew = this._isNew(existing, value)

    if (!isNew) {
      isChanged = (value == null) || (existing[indexName] != value[indexName])
    }

    return isChanged
  }


  async _deleteFromIndexList(existingIndex, key, tree) {
    
    if (!existingIndex) return 

    // console.log(`_deleteFromExistingIndex: ${existingIndex} / ${key}`)

    let list = new List(this.ipfs)

    //Get the list if it exists.
    let existingHash = await tree.get(existingIndex)

    if (existingHash) {

      await list.load(existingHash)

      await list.deleteValue(key)
  
      let newHash = await list.save()
  
      return tree.put(existingIndex, newHash)  

    } 

  }

  async _addToIndexList(indexKey, key, tree) {

    // console.log(`_addToIndexList: ${indexKey} / ${key}`)

    let list = new List(this.ipfs)

    //Get the list if it exists.
    
    let existingHash = await tree.get(indexKey)
    if (existingHash) {
      await list.load(existingHash)
    } else {
      await list.save()
    }
    


    // console.time('append')
    await list.append(key)
    // console.timeEnd('append')

    //Update the hash
    // console.time('save list');
    let listHash = await list.save()
    // console.timeEnd('save list');


    return tree.put(indexKey, listHash)
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

    return tree
  } 



  // async _createTree() {
  //   let tree = new BTree(this.ipfs)
  //   await tree.save()

  //   return tree.hash
  // }


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

      if (listHash) {
        //It'll be a hash of a list. 
        let list = new List(this.ipfs)
        await list.load(listHash)

        primaryKeys = await list.list(offset, limit)
      }



    }


    let results = []
    let primaryTree = await this._getPrimaryTree()
    for (let primaryKey of primaryKeys) {
      let result = await primaryTree.get(primaryKey)
      results.push(result)
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




}









module.exports = TableIndex
