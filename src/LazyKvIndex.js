


class LazyKvIndex {

  constructor(ipfs, dbname) {
    this.ipfs = ipfs
    this.dbname = dbname
  }

  async index() {
    let results = []

    try {
      let files = await this.ipfs.files.ls(this.dbname.toString())
      for (let file of files) {

        let filename = `${this.dbname}/${file.name}`
        try {
          let fileContents = await this.ipfs.files.read(filename)
          let result = JSON.parse(fileContents.toString())
          results.push(result)
        } catch (ex) {
          console.log(`Error reading file: ${filename}`)
        }
      }
    } catch (ex) {
      console.log(ex)
    }

    return results
  }

  async keys() {

    let keys = []

    let files = await this.ipfs.files.ls(this.dbname.toString())

    for (let file of files) {
      keys.push(file.name)
    }

    return keys

  }


  async get(key) {

    let path = this._getPathToKey(key)

    let exists = await this._pathExists(path)

    if (exists) {

      let fileContents = await this.ipfs.files.read(path)

      let result = JSON.parse(fileContents.toString())

      return result
    }


  }



  /**
   * Optionally we can be given a map full of tags to apply to this value.
   * We'll create a folder structure out of them. It supports both single values
   * and arrays.
   * 
   * Create an attribute named _tags.
   * 
   * Example:
   * db.put(22, {
   *   name: "Andrew McCutchen",
   *   _tags: {
   *      seasons: [2019, 2018, 2017],
   *      currentTeam: "PIT",
   *      battingHand: "R",
   *      throwingHand: "L",
   *      
   *   }
   * })
   * 
   * 
   * This will create the following files and folder structure
   * 
   * database_name/22
   * database_name/tags/seasons/2019/22
   * database_name/tags/seasons/2018/22
   * database_name/tags/seasons/2017/22
   * database_name/tags/currentTeam/PIT/22
   * database_name/tags/battingHand/R/22
   * database_name/tags/throwingHand/L/22
   * 
  */
  async put(key, value) {

    let primaryPath = this._getPathToKey(key)


    //Check if there are any existing tags and remove them.
    let existing = await this.get(key)
    
    if (existing) {
      await this._removeTagPaths(key, existing)
    }


    let promises = []

    //Write to primary path
    const buffer = Buffer.from(JSON.stringify(value))
    promises.push(this._writeToPath(buffer, key, primaryPath))

    //Copy to tag paths
    let tagPaths = this._getTagPaths(value)
    promises = promises.concat(this._copyToTagPaths(primaryPath, key, tagPaths))

    return Promise.all(promises)

  }

  async getByTag(tag, value, limit, offset ) {

    let results = []

    let path = this._getTagPath(tag, value)

    //If there isn't even a folder just return an empty array
    let exists = await this._pathExists(path)
    if (!exists) {
      return []
    }

    

    let files = await this.ipfs.files.ls(path)
    

    let counter = 0
    for (let file of files) {

      if (counter >= offset) {

        let filePath = `${path}/${file.name}`

        let fileContents = await this.ipfs.files.read(filePath)

        let result = JSON.parse(fileContents.toString())

        results.push(result)
      }
      if (results.length == limit) break

      counter++
    }

    return results


  }



  async _writeToPath(buffer, key, path) {

    // console.log(`Writing key ${key} to ${path}`)
    return this.ipfs.files.write( path, buffer, {
      create: true, 
      parents: true, 
      truncate: true
    })

  }

  async _copyToTagPaths(primaryPath, key, tagPaths) {

    let promises = []

    for (let tagPath of tagPaths) {
      // console.log(`Tag: Writing key ${key} to ${tagPath}`)
      
      await this._createTagPath(tagPath)
      

      promises.push(this.ipfs.files.cp(primaryPath, tagPath + '/' + key, { 
          parents: true,
          create: true,
          truncate: true 
        })
      )
    }

    return promises
  }

  async _createTagPath(tagPath) {

    if (await this._pathExists(tagPath)) return

    // console.log(`Creating ${tagPath}`)

    return this.ipfs.files.mkdir(tagPath, {
      parents: true,
      create: true
    })
  }


  async reset() {
    try {
      await this.ipfs.files.rm(this.dbname.toString(), { recursive: true })
    } catch(ex) {
      console.log(ex)
    }
  }


  async _removeTagPaths(key, existing) {

    let existingTagPaths = this._getTagPaths(existing)
      
    for (let tagPath of existingTagPaths) {
      // console.log(`Tag: Removing key ${key} from ${tagPath}`)
      if (await this._pathExists(tagPath + '/' + key)) {
        await this.ipfs.files.rm(tagPath + '/' + key)
      }
    }

  }

  async _pathExists(path) {

    let exists = false

    try {
      let hash = await this.ipfs.files.stat(path, {hash: true})
      exists = true
    } catch(ex) {}

    return exists
  }

  _getTagPaths(value) {
  
    let tagPaths = []
  
    let tags = value._tags

    if (tags) {
      for (var tagKey of tags) {
        let tagValue = value[tagKey]
        // console.log(`${tagKey}/${tagValue}`)
        if (Array.isArray(tagValue)) {
          for (let arrayTagValue of tagValue) {
            tagPaths.push(this._getTagPath(tagKey, arrayTagValue))
          }
        } else {
         //Single value
          tagPaths.push(this._getTagPath(tagKey, tagValue))
        }
      }
    }
    console.log(tagPaths)
    return tagPaths
  }

  _getTagPath(tagKey, tagValue) {
    return `${this.dbname}/tags/${tagKey}/${tagValue}`
  }



  _getPathToKey(key) {
    return `${this.dbname}/${key}`
  }



}

module.exports = LazyKvIndex
