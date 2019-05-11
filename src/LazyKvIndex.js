


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

    try {
      let path = this._getPathToKey(key)

      //This will throw an exception if the file doesn't exist. 
      await this.ipfs.files.stat(path, { hash: true})

      let fileContents = await this.ipfs.files.read(path)

      let result = JSON.parse(fileContents.toString())

      return result
    } catch (ex) {
      // console.log(ex)
    }

    return null

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
    let tagPaths = this._getTagPaths(value._tags)
    promises = promises.concat(this._copyToTagPaths(primaryPath, key, tagPaths))

    return Promise.all(promises)

  }

  async _writeToPath(buffer, key, path) {

    console.log(`Writing key ${key} to ${path}`)
    return this.ipfs.files.write( path, buffer, {
      create: true, 
      parents: true, 
      truncate: true
    })

  }

  async _copyToTagPaths(primaryPath, key, tagPaths) {

    let promises = []

    for (let tagPath of tagPaths) {
      console.log(`Tag: Writing key ${key} to ${tagPath}`)
      promises.push(this.ipfs.files.mkdir(tagPath, {
          parents: true,
          create: true
        })
      )
      promises.push(this.ipfs.files.cp(primaryPath, tagPath + '/' + key, { 
          parents: true,
          create: true,
          truncate: true 
        })
      )
    }

    return promises
  }





  async reset() {
    try {
      await this.ipfs.files.rm(this.dbname.toString(), { recursive: true })
    } catch(ex) {
      console.log(ex)
    }
  }


  async _removeTagPaths(key, existing) {

    let existingTagPaths = this._getTagPaths(existing._tags)
      
    for (let tagPath of existingTagPaths) {
      console.log(`Tag: Removing key ${key} from ${tagPath}`)
      await this.ipfs.files.rm(tagPath + '/' + key)
    }

  }

  _getTagPaths(tags) {

    let tagPaths = []

    if (tags) {
      for (var tagKey in tags) {
        let tagValue = tags[tagKey]
  
        if (Array.isArray(tagValue)) {
          for (let arrayTagValue of tagValue) {
            tagPaths.push(`${this.dbname}/tags/${tagKey}/${arrayTagValue}`)
          }
        } else {
         //Single value
          tagPaths.push(`${this.dbname}/tags/${tagKey}/${tagValue}`)
        }
      }
    }

    return tagPaths
  }

  _getPathToKey(key) {
    return `${this.dbname}/${key}`
  }



}

module.exports = LazyKvIndex
