'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Apply mixin to a class
 * @param {Function} destination 
 * @param {Function} mixin 
 */
function applyMixin(destination, mixin) {
    for (const prop in mixin) {
        if (prop === 'constructor' || !mixin.hasOwnProperty(prop)) {
            continue;
        }
        destination.prototype[prop] = mixin[prop];
    }
}

/**
 * Generates range of numbers [from, to)
 */
class RangeIterable {
	/**
	 * The range is [from, to)
	 * @param {number} from
     * @param {number} to 
	 */
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
    
    __ascendingRange() {
        const to = this.to;
        let current = this.from;
		return {
			next() {
                if (current < to) {
                    return { done: false, value: current++ };
                } else {
                    return { done: true };
                }
			}
		};
    }

    __descendingRange() {
        const to = this.to;
        let current = this.from;
		return {
			next() {
                if (current > to) {
                    return { done: false, value: current-- };
                } else {
                    return { done: true };
                }
			}
		};
    }

	[Symbol.iterator]() {
        if (this.from < this.to) {
            return this.__ascendingRange();
        }
        if (this.from > this.to) {
            return this.__descendingRange();
        }
        return { next() { return { done: true } } };        
    }
}

class LinqIterable {
    constructor(source) {
        this.source = source;
    }

    [Symbol.iterator]() {
        return this.source[Symbol.iterator]();
    }
}

function fromIterable(source) {
    return new LinqIterable(source);
}

function fromObject(obj) {
    return new LinqIterable(Object.entries(obj));
}

function range(from, to) {
    return new RangeIterable(from, to);
}

/**
 * Return filtred array [1, 2, 3, 4].where(x => x % 2 === 0) === [2, 4]
 */
class WhereIterable {
	/**
	 * 
	 * @param {Iterable} source 
	 * @param {Function} predicate 
	 */
    constructor(source, predicate) {
		this.source = source;
		this.predicate = predicate;
	}

	[Symbol.iterator]() {
		const iterator = this.source[Symbol.iterator]();
		const predicate = this.predicate;
		return {
			next() {
				while (true) {
					const { done, value } = iterator.next();
					if (done) {
						return {
							done: true
						};
					}
					if (predicate(value)) {
						return {
							done: false,
							value
						};
					}
				}
			}
		};
    }
}

/**
 * Return mapped array [1, 2, 3].select(x => x * 2) === [2, 4, 6]
 */
class SelectIterable {
	/**
	 * 
	 * @param {Iterable} source 
	 * @param {Function} map 
	 */
    constructor(source, map) {
		this.source = source;
		this.map = map;
	}

	[Symbol.iterator]() {
		const iterator = this.source[Symbol.iterator]();
		const map = this.map;
		return {
			next() {
				const { done, value } = iterator.next();
				if (done) {
					return {
						done: true
					};
				}
				return {
					done: false,
					value: map(value)
				};
			}
		};
    }
}

/**
 * Return flatten mapped array [[1, 2], [3, 4]].selectMany(x => x) === [1, 2, 3, 4, 5]
 */
class SelectManyIterable {
	/**
	 * 
	 * @param {Iterable} source 
	 * @param {Function} extract 
	 */
    constructor(source, extract) {
		this.source = source;
		this.extract = extract;
    }

	[Symbol.iterator]() {
		const iterator = this.source[Symbol.iterator]();
        const extract = this.extract;
        let isSubDone = true;
        let subIterator = null;
		return {
			next() {
                const item = SelectManyIterable.getNextItem(iterator, extract, subIterator, isSubDone);
                isSubDone = item.sdone;
                subIterator = item.sIterator;
                return item.value;
			}
		};
    }

    static getSecondaryIterator(mainIterator, extract) {
        const mainItem = mainIterator.next();
        if (mainItem.done) {
            return {
                final: true
            };
        }
        const secondaryIterator = extract(mainItem.value)[Symbol.iterator]();
        const secondaryItem = secondaryIterator.next();
        if (secondaryItem.done) {
            return SelectManyIterable.getSecondaryIterator(mainIterator, extract);
        }
        return { iterator: secondaryIterator, first: secondaryItem.value, final: false };
    }
    
    static getNextItem(mainIterator, extract, subIterator, isSubDone) {
        if (isSubDone) {
            const { iterator, first, final } = SelectManyIterable.getSecondaryIterator(mainIterator, extract);
            if (final) {
                return { value: { done: true } };
            }
            return { value: { done: false, value: first }, sIterator: iterator, sdone: false };
        } else {
            const snext = subIterator.next();
            if (snext.done) {
                return SelectManyIterable.getNextItem(mainIterator, extract, null, true);
            }
            return { value: { done: false, value: snext.value }, sIterator: subIterator, sdone: false }; 
        }
    }

}

class FirstFinalizer {
    static get (iterable) {
        const iterator = iterable[Symbol.iterator]();
        const { value } = iterator.next();
        return value;
    }

    static getOrDefault (iterable, def) {
        const iterator = iterable[Symbol.iterator]();
        const { value, done } = iterator.next();
        return done ? def : value;
    }
}

class SingleFinalizer {
    static get (iterable) {
        const iterator = iterable[Symbol.iterator]();
        const { value, done } = iterator.next();
        if (done || !iterator.next().done ) {
            throw new RangeError('Sequence does not contain single item');
        }
        return value;
    }

    static getOrDefault (iterable, def) {
        const iterator = iterable[Symbol.iterator]();
        const { value, done } = iterator.next();
        if (!iterator.next().done) {
            throw new RangeError('Sequence contains multiple items');
        }
        return done ? def : value;
    }
}

/**
 * Return first N numbers of source
 */
class TakeIterable {
	/**
	 * 
	 * @param {Iterable} source 
	 * @param {number} count 
	 */
    constructor(source, count) {
		this.source = source;
		this.count = count;
	}

	[Symbol.iterator]() {
		const iterator = this.source[Symbol.iterator]();
        const count = this.count;
        let fetched = 0;
		return {
			next() {
                if (fetched < count) {
                    const { done, value } = iterator.next();
                    fetched++; 
                    if (done) {
                        return { done: true };
                    }
                    return { done: false, value };
                }
                return { done: true };
			}
		};
    }
}

/**
 * Skip first N numbers of source and return the rest
 */
class SkipIterable {
	/**
	 * 
	 * @param {Iterable} source 
	 * @param {number} count 
	 */
    constructor(source, count) {
		this.source = source;
		this.count = count;
	}

	[Symbol.iterator]() {
		const iterator = this.source[Symbol.iterator]();
        const count = this.count;
        let skipped = 0;
		return {
			next() {
                if (skipped == 0) {
                    // first get. 
                    while (skipped < count) {
                        const { done } = iterator.next();
                        skipped++;
                        if (done) {
                            return { done: true };
                        }
                    }
                }
                return iterator.next();
			}
		};
    }
}

const linqMixin = {
    where(predicate) {
        return new WhereIterable(this, predicate);
    },
    select(map) {
        return new SelectIterable(this, map);
    },
    selectMany(map) {
        return new SelectManyIterable(this, map);
    },
    take(count) {
        return new TakeIterable(this, count);
    },
    skip(count) {
        return new SkipIterable(this, count);
    },
    ofType(type) {
        if (typeof type === 'string') {
            return new WhereIterable(this, function (item) { return typeof item === type; } );
        } else {
            return new WhereIterable(this, function (item) { return item instanceof type; } );
        }
    },
    toArray() {
        return Array.from(this);
    },
    first() {
        return FirstFinalizer.get(this);
    },
    firstOrDefault(def) {
        return FirstFinalizer.getOrDefault(this, def);
    },
    single() {
        return SingleFinalizer.get(this);
    },
    singleOrDefault(def) {
        return SingleFinalizer.getOrDefault(this, def);
    }
};

applyMixin(LinqIterable, linqMixin);
applyMixin(WhereIterable, linqMixin);
applyMixin(SelectIterable, linqMixin);
applyMixin(SelectManyIterable, linqMixin);
applyMixin(TakeIterable, linqMixin);
applyMixin(SkipIterable, linqMixin);
applyMixin(RangeIterable, linqMixin);

exports.fromIterable = fromIterable;
exports.fromObject = fromObject;
exports.range = range;
