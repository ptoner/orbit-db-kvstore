class Criteria {

    constructor() {
        this._restrictions = []
    }

    add(restriction) {
        this.restrictions.push(restriction)
    }

    get restrictions() {
        return this._restrictions
    }

}


class Restrictions {

    static gt(column, value) {
        return { comparator: ">", column: column, value: value }
    }

    static gte(column, value) {
        return { comparator: ">=", column: column, value: value }
    }

    static lt(column, value) {
        return { comparator: "<", column: column, value: value }
    }

    static lte(column, value) {
        return { comparator: "<=", column: column, value: value }
    }

    static equals(column, value) {
        return { comparator: "==", column: column, value: value }
    }

}

module.exports = { Criteria, Restrictions}