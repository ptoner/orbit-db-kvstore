


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


  async put(key, value) {

    let path = this._getPathToKey(key)

    console.log(`Writing key ${key} to ${path}`)

    const buffer = Buffer.from(JSON.stringify(value))


    return this.ipfs.files.write(path, buffer, {
      create: true,
      parents: true,
      truncate: true
    })


  }


  async reset() {
    try {
      await this.ipfs.files.rm(this.dbname.toString(), { recursive: true })
    } catch(ex) {
      console.log(ex)
    }
  }

  _getPathToKey(key) {
    return `${this.dbname}/${key}`
  }
}

module.exports = LazyKvIndex
