'use strict'

const Store = require('orbit-db-store')
const LazyKvIndex = require('./LazyKvIndex')
const Log = require('ipfs-log')



class LazyKvStore extends Store {

  constructor(ipfs, id, dbname, options) {

    //Wrap the index in a wrapper to let us pass it the ipfs instance that we get
    class LazyKvIndexWrapper extends LazyKvIndex {
      constructor() {
        super(ipfs, dbname)
      }
    }


    let opts = Object.assign({}, { Index: LazyKvIndexWrapper })
    Object.assign(opts, options)
    super(ipfs, id, dbname, opts)
    this._type = 'lazykv'
  }

  get all () {
    return this._index.index()
  }

  async get (key) {
    return this._index.get(key)
  }

  async set (key, data) {
    return this.put(key, data)
  }

  async put (key, data) {
    return this._addOperation({
      op: 'PUT',
      key: key,
      value: data
    })
  }

  async del (key) {
    return this._addOperation({
      op: 'DEL',
      key: key,
      value: null
    })
  }

  get index () {
    return this._index.index()
  }

  get keys() {
    return this._index
  }


  async load (amount) {
  }


  static get type () {
    return 'lazykv'
  }

  async getByTag(tag, value, limit, offset ) {
    return this._index.getByTag(tag, value, limit, offset)
  }


  async _updateIndex () {
    this._recalculateReplicationMax()
    this._recalculateReplicationProgress()
  }

  async _addOperation (data, batchOperation, lastOperation, onProgressCallback) {
    if (this._oplog) {
      const entry = await this._oplog.append(data, this.options.referenceCount)
      this._recalculateReplicationStatus(this.replicationStatus.progress + 1, entry.clock.time)
      await this._cache.set('_localHeads', [entry])
      await this._index.put(data.key, data.value)
      await this._updateIndex()
      this.events.emit('write', this.address.toString(), entry, this._oplog.heads)
      if (onProgressCallback) onProgressCallback(entry)
      return entry.hash
    }
  }

  async drop () {
    await this.close()
    await this._cache.destroy()
    // Reset
    await this._index.reset()
    this._index = new this.options.Index(this.identity.publicKey)
    this._oplog = new Log(this._ipfs, this.identity, { logId: this.id, access: this.access })
    this._cache = this.options.cache
  }

}

module.exports = LazyKvStore
