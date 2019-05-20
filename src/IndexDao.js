class IndexDao {

    constructor(ipfs, dbName) {
      this._ipfs = ipfs
      this._indexPath = `${dbName}/indexes`
    }
  
    get(key) {
      return this._indexes[key]
    }
  
    put(key, value) {
      this._indexes[key] = value
    }
  
    delete(key) {
      delete this._indexes[key]
    }
  
    get indexes() {
      return this._indexes
    }
  
    get primary() {

      for (let indexName in this._indexes) {
        let index = this.get(indexName)
        if (index.primary) return index
      }

      return null

    }

    async load() {
  
      this._indexes = {} 
  
      let exists = await this._pathExists(this._indexPath)
      if (!exists) return 
  
      try {
        let fileContent = await this._ipfs.files.read(this._indexPath)
        this._indexes = JSON.parse(fileContent.toString())
      } catch (ex) {
        console.log(`Error loading indexes: ${this._indexPath}`)
      }
  
    }
  
    async save() {
  
      let buffer = Buffer.from(JSON.stringify(this._indexes))
  
      return this._ipfs.files.write(this._indexPath, buffer, {
        create: true, 
        parents: true, 
        truncate: true
      })
  
    }
  
  
    async _pathExists(path) {
  
      let exists = false
  
      try {
        let hash = await this._ipfs.files.stat(path, {hash: true})
        exists = true
      } catch(ex) {}
  
      return exists
    }

  }
  


  module.exports = IndexDao