'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * Apply mixin to a class
 * @param {object} mixin
 * @param {Function[]} destinations
 */
function applyMixin(mixin, destinations) {
  for (var dest of destinations) {
    Object.assign(dest.prototype, mixin);
  }
}

/**
   * Helper function to be use to access Symbol.iterator of iterable
   * @param {Iterable} iterable
   * @return {Iterator} iterator.
   */
function getIterator(iterable) {
  return iterable[Symbol.iterator]();
}

function __quickSort(items, left, right, comparer) {
  do {
    var i = left;
    var j = right;
    var x = items[i + (j - i >> 1)];
    do {
      while (i < items.length && comparer(x, items[i]) > 0) {i++;}
      while (j >= 0 && comparer(x, items[j]) < 0) {j--;}
      if (i > j) break;
      if (i < j) {

        var temp = items[i];
        items[i] = items[j];
        items[j] = temp;
      }
      i++;
      j--;
    } while (i <= j);
    if (j - left <= right - i) {
      if (left < j) __quickSort(items, left, j, comparer);
      left = i;
    } else {
      if (i < right) __quickSort(items, i, right, comparer);
      right = j;
    }
  } while (left < right);
}

/**
   * Sorts an array using quick sort algorithm
   * @param items array to sort
   * @param left start
   * @param right end
   * @param comparer elements comparer
   * @return {Array} sorted array.
   */
function quickSort(items, left, right, comparer) {
  var copy = [...items]; // copy items.
  __quickSort(copy, left, right, comparer);
  return copy;
}

/**
   * A helper class which using Set to check for distinct elements.
   */
class SetCheck {
  constructor() {
    this.set = new Set();
  }

  tryAdd(item) {
    var prevSize = this.set.size;
    this.set.add(item);
    return this.set.size > prevSize;
  }

  clear() {
    this.set.clear();
  }}


function defaultSortComparer(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function defaultEqualityComparer(a, b) {
  return a === b;
}

function defaultElementSelector(item) {
  return item;
}

function doneValue() {
  return { done: true };
}

class BaseLinqIterable {
  constructor(source) {
    this.source = source;
  }

  _getIterator(source) {
    return getIterator(source);
  }

  _getSourceIterator() {
    return getIterator(this.source.get());
  }

  _getSource() {
    return this.source.get();
  }

  get() {
    throw new Error('Not implemented');
  }}



class NativeProcessingLinqIterable extends BaseLinqIterable {
  constructor(source) {
    super(source);
  }

  _nativeTake(array) {
    throw new Error('Not implemented');
  }

  _tryNativeProcess() {
    var source = this._getSource();
    if (Array.isArray(source)) {
      var result = this._nativeTake(source);
      if (result) {
        return { processed: result };
      }
    }
    return { source };
  }

  get() {
    var { processed } = this._tryNativeProcess();
    if (processed) {
      return processed;
    }
    return this;
  }}

/**
 * Generates range of numbers [from, to)
 */

class RangeIterable extends BaseLinqIterable {
  /**
                                                      * The range is [from, to)
                                                      * @param {number} from
                                                      * @param {number} to
                                                      */
  constructor(from, to) {
    super([]);
    this.from = from;
    this.to = to;
  }

  __ascendingRange() {
    var to = this.to;
    var current = this.from;
    return {
      next() {
        if (current < to) {
          return { done: false, value: current++ };
        } else {
          return { done: true };
        }
      } };

  }

  __descendingRange() {
    var to = this.to;
    var current = this.from;
    return {
      next() {
        if (current > to) {
          return { done: false, value: current-- };
        } else {
          return { done: true };
        }
      } };

  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    if (this.from < this.to) {
      return this.__ascendingRange();
    }
    if (this.from > this.to) {
      return this.__descendingRange();
    }
    return {
      next() {
        return { done: true };
      } };

  }}

class RepeatIterable extends BaseLinqIterable {
  constructor(value, times) {
    super([]);
    this.value = value;
    this.times = times;
  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    var indx = 0;
    var max = this.times;
    var item = this.value;
    return {
      next() {
        if (indx < max) {
          indx++;
          return { done: false, value: item };
        } else {
          return { done: true };
        }
      } };

  }}

class LinqIterable extends BaseLinqIterable {
  constructor(source) {
    super(source);
  }

  get() {
    return this.source;
  }

  [Symbol.iterator]() {
    return this._getIterator(this.source);
  }}


class ArrayLikeIterable extends BaseLinqIterable {
  constructor(source) {
    super(source);
  }

  get() {
    return Array.isArray(this.source) ? this.source : this;
  }

  [Symbol.iterator]() {
    if (Array.isArray(this.source)) {
      return this._getIterator(this.source);
    }
    var length = this.source.length;
    var source = this.source;
    var current = 0;
    return {
      next() {
        if (current < length) {
          var value = source[current];
          current++;
          return { done: false, value };
        } else {
          return { done: true };
        }
      } };

  }}


class ObjectIterable extends BaseLinqIterable {
  constructor(source) {
    super(source);
  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    var obj = this.source;
    var keys = Object.keys(obj);
    var index = 0;
    return {
      next() {
        if (index < keys.length) {
          var key = keys[index];
          var value = obj[key];
          index++;
          return { done: false, value: { key, value } };
        } else {
          return { done: true };
        }
      } };

  }}


function fromIterable(source) {
  return new LinqIterable(source);
}

function fromObject(obj) {
  return new ObjectIterable(obj);
}

/**
   * The object which has property length of type number and keys with names: '0', '1' ...
   * @param {ArrayLike} source
   */
function fromArrayLike(source) {
  return new ArrayLikeIterable(source);
}

function range(from, to) {
  return new RangeIterable(from, to);
}

function repeat(value, times) {
  return new RepeatIterable(value, times);
}

function from(source) {
  var iterator = source[Symbol.iterator];
  if (typeof iterator === 'function') {
    return fromIterable(source);
  }
  if ('length' in source) {
    return fromArrayLike(source);
  }
  return fromObject(source);
}

/**
                                                                       * Return filtred array [1, 2, 3, 4].where(x => x % 2 === 0) === [2, 4]
                                                                       */
class WhereIterable extends NativeProcessingLinqIterable {
  /**
                                                                  *
                                                                  * @param {Iterable} source
                                                                  * @param {Function} predicate
                                                                  */
  constructor(source, predicate) {
    super(source);
    this.predicate = predicate;
  }

  _nativeTake(array) {
    return array.filter(this.predicate);
  }

  static __findNext(iterator, predicate) {
    var done = false;
    while (!done) {
      var next = iterator.next();
      if (!next.done && predicate(next.value)) {
        return { done: false, value: next.value };
      }
      done = next.done;
    }
    return { done: true };
  }

  [Symbol.iterator]() {
    var { processed, source } = this._tryNativeProcess();
    if (processed) {
      return this._getIterator(processed);
    }
    var iterator = this._getIterator(source);
    var predicate = this.predicate;
    return {
      next() {
        return WhereIterable.__findNext(iterator, predicate);
      } };

  }}

/**
                                                                       * Return mapped array [1, 2, 3].select(x => x * 2) === [2, 4, 6]
                                                                       */
class SelectIterable extends NativeProcessingLinqIterable {
  /**
                                                                   *
                                                                   * @param {Iterable} source
                                                                   * @param {Function} map
                                                                   */
  constructor(source, map) {
    super(source);
    this.map = map;
  }

  _nativeTake(array) {
    return array.map(this.map);
  }

  [Symbol.iterator]() {
    var { processed, source } = this._tryNativeProcess();
    if (processed) {
      return this._getIterator(processed);
    }
    var iterator = this._getIterator(source);
    var map = this.map;
    return {
      next() {
        var { done, value } = iterator.next();
        if (done) {
          return {
            done: true };

        }
        return {
          done: false,
          value: map(value) };

      } };

  }}

/**
                                         * Return flatten mapped array [[1, 2], [3, 4]].selectMany(x => x) === [1, 2, 3, 4, 5]
                                         */
class SelectManyIterable extends BaseLinqIterable {
  /**
                                                           *
                                                           * @param {Iterable} source
                                                           * @param {Function} extract
                                                           */
  constructor(source, extract) {
    super(source);
    this.extract = extract;
  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    var source = this._getSource();
    var iterator = this._getIterator(source);
    var extract = this.extract;
    var currentState = null;
    return {
      next() {
        var item = SelectManyIterable.__getNextItem(iterator, extract, currentState);
        currentState = item.currentState;
        return item.value;
      } };

  }

  static __getInnerIterator(outerIterator, extract) {
    var outerItem = outerIterator.next();
    if (outerItem.done) {
      return {
        final: true };

    }
    var innerIterator = getIterator(extract(outerItem.value));
    var innerItem = innerIterator.next();
    if (innerItem.done) {
      return SelectManyIterable.__getInnerIterator(outerIterator, extract);
    }
    return {
      current: {
        outerValue: outerItem.value,
        innerIterator: innerIterator },

      firstInnerItem: innerItem.value,
      final: false };

  }

  static __getNextItem(mainIterator, extract, currentState) {
    if (!currentState) {
      var { current, firstInnerItem, final } = SelectManyIterable.__getInnerIterator(mainIterator, extract);
      if (final) {
        return { value: { done: true } };
      }
      return {
        value: { done: false, value: firstInnerItem },
        currentState: {
          innerIterator: current.innerIterator,
          outerValue: current.outerValue } };


    } else {
      var innerNext = currentState.innerIterator.next();
      if (innerNext.done) {
        return SelectManyIterable.__getNextItem(mainIterator, extract, null);
      }
      return {
        value: { done: false, value: innerNext.value },
        currentState: {
          innerIterator: currentState.innerIterator,
          outerValue: currentState.outerValue } };


    }
  }}

class FirstFinalizer {
  static get(source, predicate) {
    if (predicate) {
      for (var item of source) {
        if (predicate(item)) {
          return item;
        }
      }
    } else {
      var iterator = getIterator(source);
      var { value, done } = iterator.next();
      return done ? void 0 : value;
    }
  }

  static getOrDefault(source, def, predicate) {
    if (predicate) {
      for (var item of source) {
        if (predicate(item)) {
          return item;
        }
      }
      return def;
    } else {
      var iterator = getIterator(source);
      var { value, done } = iterator.next();
      return done ? def : value;
    }
  }

  static getOrThrow(source) {
    var iterator = getIterator(source.get());
    var { value, done } = iterator.next();
    if (done) {
      throw new TypeError('Sequence contains no items');
    }
    return value;
  }}

class SingleFinalizer {
  static get(source, predicate) {
    var result;
    var count = 0;
    for (var item of source) {
      if (predicate && predicate(item) || !predicate) {
        result = item;
        count++;
      }
      if (count > 1) {
        throw new TypeError('Sequence contains multiple items');
      }
    }
    if (count === 0) {
      throw new TypeError('Sequence contains no items');
    }
    return result;
  }

  static getOrDefault(source, def, predicate) {
    var result;
    var count = 0;
    for (var item of source) {
      if (predicate && predicate(item) || !predicate) {
        result = item;
        count++;
      }
      if (count > 1) {
        throw new TypeError('Sequence contains multiple items');
      }
    }
    if (count === 0) {
      return def;
    }
    return result;
  }}

/**
                                                                       * Return first N numbers of source
                                                                       */
class TakeIterable extends NativeProcessingLinqIterable {
  /**
                                                                 *
                                                                 * @param {Iterable} source
                                                                 * @param {number} count
                                                                 */
  constructor(source, count) {
    super(source);
    this.count = count;
  }

  _nativeTake(array) {
    return array.slice(0, this.count);
  }

  [Symbol.iterator]() {
    var { processed, source } = this._tryNativeProcess();
    if (processed) {
      return this._getIterator(processed);
    }
    var iterator = this._getIterator(source);
    var count = this.count;
    var fetched = 0;
    return {
      next() {
        if (fetched < count) {
          var { done, value } = iterator.next();
          fetched++;
          if (done) {
            return { done: true };
          }
          return { done: false, value };
        }
        return { done: true };
      } };

  }}

/**
                                                                       * Skip first N numbers of source and return the rest
                                                                       */
class SkipIterable extends NativeProcessingLinqIterable {
  /**
                                                                 *
                                                                 * @param {Iterable} source
                                                                 * @param {number} count
                                                                 */
  constructor(source, count) {
    super(source);
    this.count = count;
  }

  _nativeTake(array) {
    return array.slice(this.count, array.length);
  }

  [Symbol.iterator]() {
    var { processed, source } = this._tryNativeProcess();
    if (processed) {
      return this._getIterator(processed);
    }
    var iterator = this._getIterator(source);
    var count = this.count;
    var skipped = 0;
    return {
      next() {
        if (skipped === 0) {
          // first get. 
          while (skipped < count) {
            var { done } = iterator.next();
            skipped++;
            if (done) {
              return { done: true };
            }
          }
        }
        return iterator.next();
      } };

  }}

class AllFinalizer {
  static get(source, predicate) {
    for (var item of source) {
      if (!predicate(item)) {
        return false;
      }
    }
    return true;
  }

  static getAllAndEvery(source, predicate) {
    var hasItems = false;
    for (var item of source) {
      hasItems = true;
      if (!predicate(item)) {
        return false;
      }
    }
    return hasItems;
  }}

class AnyFinalizer {
  static get(source, predicate) {
    if (!predicate) {
      var iterator = getIterator(source);
      return !iterator.next().done;
    } else {
      for (var item of source) {
        if (predicate(item)) {
          return true;
        }
      }
      return false;
    }
  }}

/**
                                                           * Returns distinct values
                                                           */
class DistinctIterable extends BaseLinqIterable {
  /**
                                                         *
                                                         * @param {Iterable} source
                                                         * @param {Function} comparer comparer function. if not provider use native Set.
                                                         */
  constructor(source, comparer) {
    super(source);
    this.comparer = comparer;
  }

  get() {
    if (!this.comparer) {
      return new Set(this._getSource());
    }
    return this;
  }

  [Symbol.iterator]() {
    var source = this._getSource();
    if (!this.comparer) {
      var set = new Set(source);
      return this._getIterator(set);
    }
    var iterator = this._getIterator(source);
    var itemChecker = new DistinctItemChecker(this.comparer);
    return {
      next() {
        while (true) {
          var { done, value } = iterator.next();
          if (done) {
            itemChecker.clear();
            return { done: true };
          }
          if (itemChecker.has(value)) {
            continue;
          }
          itemChecker.add(value);
          return { done: false, value };
        }
      } };

  }}


class DistinctItemChecker {
  constructor(comparer) {
    this.comparer = comparer;
    this.list = [];
  }

  add(item) {
    this.list.push(item);
  }

  has(item) {
    return this.list.some(_ => this.comparer(_, item));
  }

  clear() {
    this.list.length = 0;
  }}

class Grouping extends BaseLinqIterable {
  constructor(key, source) {
    super(source);
    this.key = key;
  }

  get() {
    return this.source;
  }

  [Symbol.iterator]() {
    return this._getIterator(this.source);
  }}


class GroupIterable extends BaseLinqIterable {
  constructor(source, keySelector, elementSelector, resultCreator) {
    super(source);
    if (typeof keySelector === 'undefined') {
      throw new Error('keyselector is required');
    }
    this.keySelector = keySelector;
    this.elementSelector = typeof elementSelector === 'undefined' ? defaultElementSelector : elementSelector;
    this.resultCreator = typeof resultCreator === 'undefined' ? (key, grouping) => new Grouping(key, grouping) : resultCreator;
  }

  static __group(iterable, keySelector, elementSelector) {
    var map = new Map();
    var i = 0;
    for (var item of iterable) {
      var key = keySelector(item, i);
      if (key !== null && typeof key === 'object' || typeof key === "function") {
        throw new TypeError('groupBy method does not support keys to be objects or functions');
      }
      var element = elementSelector(item, i);
      var value = map.get(key) || [];
      value.push(element);
      map.set(key, value);
      i++;
    }
    return map;
  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    var source = this._getSource();
    var result = GroupIterable.__group(source, this.keySelector, this.elementSelector);
    var groupIterator = this._getIterator(result);
    var resultCreator = this.resultCreator;
    return {
      next() {
        var { done, value } = groupIterator.next();
        if (done) {
          result.clear();
          return { done: true };
        }
        var [key, grouping] = value;
        return {
          done: false,
          value: resultCreator(key, fromIterable(grouping)) };

      } };

  }}

class CountFinalizer {
  static get(source, predicate) {
    var iterable = source.get();
    if (Array.isArray(iterable)) {
      if (predicate) {
        return iterable.filter(predicate).length;
      }
      return iterable.length;
    }
    var i = 0;
    for (var item of iterable) {
      if (predicate && predicate(item) || !predicate) {
        i++;
      }
    }
    return i;
  }}

class AggregateFinalizer {
  static get(source, accumulator) {
    var res;
    var index = -1;
    for (var item of source) {
      if (index === -1) {
        res = item;
        index = 0;
      } else {
        index++;
        res = accumulator(res, item, index);
      }
    }
    if (index === -1) {
      throw new TypeError('No items in sequence');
    }
    return res;
  }

  static getWithInitial(source, accumulator, initial) {
    var res = initial;
    var index = 0;
    for (var item of source) {
      index++;
      res = accumulator(res, item, index);
    }
    return res;
  }}

class OrderIterable extends NativeProcessingLinqIterable {
  constructor(source, keySelector, comparer) {
    super(source);
    this.keySelector = keySelector;
    this.comparer = comparer;
  }

  _nativeTake(array) {
    var comparer = this._getComparer();
    return [...array].sort(comparer);
  }

  _getComparer() {
    return typeof this.comparer === 'undefined' ? defaultSortComparer : this.comparer;
  }

  __sort(source) {
    var comparer = this._getComparer();
    var arr = Array.from(source);
    return quickSort(source, 0, arr.length - 1, comparer);
  }

  get() {
    var { processed, source } = this._tryNativeProcess();
    if (processed) {
      return processed;
    }
    return this.__sort(source);  }

  [Symbol.iterator]() {
    var sortedArray = this.get();
    return this._getIterator(sortedArray);
  }}


class OrderIterableDescending extends OrderIterable {
  _getComparer() {
    var comparer = super._getComparer();
    return (left, right) => {
      return 0 - comparer(this.keySelector(left), this.keySelector(right));
    };
  }}

class ConcatIterable extends NativeProcessingLinqIterable {
  /**
                                                                   * Creates a Union Iterable
                                                                   * @param {Iterable} source input iterable
                                                                   * @param {Iterable} second iterable to continue with
                                                                   */
  constructor(source, second) {
    super(source);
    this.second = second;
  }

  _nativeTake(array) {
    if (Array.isArray(this.second)) {
      return [...array, ...this.second];
    }
  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    var { processed, source } = this._tryNativeProcess();
    if (processed) {
      return this._getIterator(processed);
    }
    var iteratorFirst = this._getIterator(source);
    var iteratorSecond = this._getIterator(this.second);
    var firstDone = false;
    return {
      next() {
        if (!firstDone) {
          var firstNext = iteratorFirst.next();
          if (firstNext.done) {
            firstDone = true;
          } else
          {
            return { done: false, value: firstNext.value };
          }
        }
        if (firstDone) {
          var secondNext = iteratorSecond.next();
          if (secondNext.done) {
            return { done: true };
          } else {
            return { done: false, value: secondNext.value };
          }
        }
      } };

  }}

class ForEachFinalizer {
  static get(source, action) {
    for (var item of source) {
      action(item);
    }
  }}

class ElementAtFinalizer {
  static get(source, index) {
    var i = 0;
    for (var item of source) {
      if (i === index) {
        return item;
      }
      i++;
    }
  }}

class ToArrayFinalizer {
  static get(source, map) {
    if (!map) {
      var iterable = source.get();
      return Array.isArray(iterable) ? iterable : Array.from(iterable);
    } else {
      return source.select(map).toArray();
    }
  }}

class UnionIterable extends BaseLinqIterable {
  constructor(source, second) {
    super(source);
    this.second = second;
  }

  get() {
    return this;
  }

  static __getNext(firstIterator, firstDone, secondIterator, secondDone, set) {
    while (!firstDone || !secondDone) {
      if (!firstDone) {
        var next = firstIterator.next();
        if (!next.done && set.tryAdd(next.value)) {
          return next;
        }
        if (next.done) {
          firstDone = true;
        }
      }
      if (firstDone && !secondDone) {
        var _next = secondIterator.next();
        if (!_next.done && set.tryAdd(_next.value)) {
          return _next;
        }
        if (_next.done) {
          secondDone = true;
        }
      }
    }
    if (firstDone && secondDone) {
      set.clear();
      return { done: true };
    }
  }

  [Symbol.iterator]() {
    var firstIterator = this._getIterator(this.source);
    var secondIterator = this._getIterator(this.second);
    var set = new SetCheck();
    var firstDone = false;
    var secondDone = false;
    return {
      next() {
        return UnionIterable.__getNext(firstIterator, firstDone, secondIterator, secondDone, set);
      } };

  }}

class GroupJoinIterable extends BaseLinqIterable {
  /**
                                                          * Creates group join iterable
                                                          * @param {Iterable} source
                                                          * @param {Iterable} joinIterable
                                                          * @param {Function} sourceKeySelector
                                                          * @param {Function} joinIterableKeySelector
                                                          * @param {Function} resultCreator
                                                          */
  constructor(source, joinIterable, sourceKeySelector, joinIterableKeySelector, resultCreator) {
    super(source);
    this.joinIterable = joinIterable;
    this.sourceKeySelector = sourceKeySelector;
    this.joinIterableKeySelector = joinIterableKeySelector;
    this.resultCreator = resultCreator;
  }

  get() {
    return this;
  }

  static __getNext(outerIterator, outerKeySelector, innerMap, resultSelector) {
    var { done, value } = outerIterator.next();
    if (done) {
      innerMap.clear();
      return { done: true };
    }
    var outerKey = outerKeySelector(value);
    var innerValue = innerMap.get(outerKey) || [];
    var resultValue = resultSelector(value, innerValue);
    return {
      done: false,
      value: resultValue };

  }

  [Symbol.iterator]() {
    var outerIterator = this._getSourceIterator();
    var innerMap = GroupIterable.__group(this.joinIterable, this.joinIterableKeySelector, defaultElementSelector);
    var outerKeySelector = this.sourceKeySelector;
    var resultCreator = this.resultCreator;
    return {
      next() {
        return GroupJoinIterable.__getNext(outerIterator, outerKeySelector, innerMap, resultCreator);
      } };

  }}

class JoinIterable extends BaseLinqIterable {
  /**
                                                     * Creates join iterable
                                                     * @param {Iterable} source
                                                     * @param {Iterable} joinIterable
                                                     * @param {Function} sourceKeySelector
                                                     * @param {Function} joinIterableKeySelector
                                                     * @param {Function} resultCreator
                                                     */
  constructor(source, joinIterable, sourceKeySelector, joinIterableKeySelector, resultCreator) {
    super(source);
    this.joinIterable = joinIterable;
    this.sourceKeySelector = sourceKeySelector;
    this.joinIterableKeySelector = joinIterableKeySelector;
    this.resultCreator = resultCreator;
  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    var resultCreator = this.resultCreator;
    var outerIterator = this._getSourceIterator();
    var innerMap = GroupIterable.__group(this.joinIterable, this.joinIterableKeySelector, defaultElementSelector);
    var innerItemsExtractor = outerItem => {
      var key = this.sourceKeySelector(outerItem);
      return innerMap.get(key) || [];
    };
    var currentState = null;
    return {
      next() {
        var item = SelectManyIterable.__getNextItem(outerIterator, innerItemsExtractor, currentState);
        if (item.value.done) {
          return item.value;
        }
        currentState = item.currentState;
        return {
          done: false,
          value: resultCreator(currentState.outerValue, item.value.value) };

      } };

  }}

class EqualFinalizer {
  static get(source, iterable, comparer) {
    var isEqual = typeof comparer === 'undefined' ? defaultEqualityComparer : comparer;
    var sourceIterator = getIterator(source);
    var otherIterator = getIterator(iterable);
    var thisDone = false;
    while (!thisDone) {
      var thisNext = sourceIterator.next();
      var otherNext = otherIterator.next();
      if (thisNext.done !== otherNext.done ||
      !thisNext.done && !otherNext.done && !isEqual(thisNext.value, otherNext.value)) {
        return false;
      }
      thisDone = thisNext.done;
    }
    return true;
  }

  static getDifferentPosition(source, iterable, comparer) {
    var isEqual = typeof comparer === 'undefined' ? defaultEqualityComparer : comparer;
    var sourceIterator = getIterator(source);
    var otherArray = Array.isArray(iterable) ? [...iterable] : Array.from(iterable);
    var thisDone = false;
    while (!thisDone) {
      var next = sourceIterator.next();
      thisDone = next.done;
      if (!next.done && otherArray.length === 0 || next.done && otherArray.length > 0) {
        return false;
      }
      if (next.done && otherArray.length === 0) {
        return true;
      }
      var startLength = otherArray.length;
      for (var i = 0; i < otherArray.length; i++) {
        var otherValue = otherArray[i];
        if (isEqual(next.value, otherValue)) {
          otherArray.splice(i, 1);
          break;
        }
      }
      if (startLength === otherArray.length) {
        // if not removed not equal
        return false;
      }
    }
    return otherArray.length === 0; // all elements removed.
  }}

class PageIterable extends BaseLinqIterable {
  constructor(source, pageSize) {
    super(source);
    this.pageSize = pageSize;
  }

  get() {
    return this;
  }

  [Symbol.iterator]() {
    var pageSize = this.pageSize;
    var iterator = this._getSourceIterator();
    var lastOne = false;
    return {
      next() {
        if (lastOne) {
          return { done: true };
        }
        var count = 0;
        var page = [];
        while (count < pageSize) {
          var next = iterator.next();
          if (next.done) {
            lastOne = true;
            return { done: false, value: page };
          }
          page.push(next.value);
          count++;
        }
        return { done: false, value: page };
      } };

  }}

/**
                                       * Subclass of Select many, but instead of returning just the sub items, it returns pair of outer and inner item.
                                       */
class FlatIterable extends SelectManyIterable {
  constructor(source, collectionSelector) {
    super(source, collectionSelector);
  }

  [Symbol.iterator]() {
    var source = this._getSource();
    var iterator = this._getIterator(source);
    var extract = this.extract;
    var currentState = null;
    return {
      next() {
        var item = SelectManyIterable.__getNextItem(iterator, extract, currentState);
        currentState = item.currentState;
        if (item.value.done) {
          return doneValue();
        }
        return {
          done: item.value.done,
          value: {
            outer: currentState.outerValue,
            inner: item.value.value } };


      } };

  }}

var linqMixin = {
  where(predicate) {
    return new WhereIterable(this, predicate);
  },
  select(map) {
    return new SelectIterable(this, map);
  },
  selectMany(map) {
    return new SelectManyIterable(this, map);
  },
  flat(selector) {
    return new FlatIterable(this, selector);
  },
  take(count) {
    return new TakeIterable(this, count);
  },
  skip(count) {
    return new SkipIterable(this, count);
  },
  distinct(comparer) {
    return new DistinctIterable(this, comparer);
  },
  ofType(type) {
    if (typeof type === 'string') {
      return new WhereIterable(this, function (item) {
        return typeof item === type;
      });
    } else {
      return new WhereIterable(this, function (item) {
        return item instanceof type;
      });
    }
  },
  groupBy(keySelector, elementSelector, resultCreator) {
    return new GroupIterable(this, keySelector, elementSelector, resultCreator);
  },
  orderBy(keySelector, comparer) {
    return new OrderIterable(this, keySelector, comparer);
  },
  orderByDescending(keySelector, comparer) {
    return new OrderIterableDescending(this, keySelector, comparer);
  },
  groupJoin(joinIterable, sourceKeySelector, joinIterableKeySelector, resultCreator) {
    return new GroupJoinIterable(this, joinIterable, sourceKeySelector, joinIterableKeySelector, resultCreator);
  },
  join(joinIterable, sourceKeySelector, joinIterableKeySelector, resultCreator) {
    if (arguments.length === 1) {
      return this.select(_ => '' + _).toArray().join( /*separator*/joinIterable); // join items of sequence in string. here joinIterable === separator
    }
    return new JoinIterable(this, joinIterable, sourceKeySelector, joinIterableKeySelector, resultCreator);
  },
  concat(secondIterable) {
    return new ConcatIterable(this, secondIterable);
  },
  union(secondIterable) {
    return new UnionIterable(this, secondIterable);
  },
  page(pageSize) {
    return new PageIterable(this, pageSize);
  },
  toArray(map) {
    return ToArrayFinalizer.get(this, map);
  },
  toMap(keySelector, valueSelector) {
    var transformValue = typeof valueSelector === 'undefined';
    return new Map(this.select(_ => [
    keySelector(_),
    transformValue ? _ : valueSelector(_)]));


  },
  toSet() {
    return new Set(this.get());
  },
  first(predicate) {
    return FirstFinalizer.get(this, predicate);
  },
  firstOrDefault(def, predicate) {
    return FirstFinalizer.getOrDefault(this, def, predicate);
  },
  firstOrThrow() {
    return FirstFinalizer.getOrThrow(this);
  },
  single(predicate) {
    return SingleFinalizer.get(this, predicate);
  },
  singleOrDefault(def, predicate) {
    return SingleFinalizer.getOrDefault(this, def, predicate);
  },
  all(predicate) {
    return AllFinalizer.get(this, predicate);
  },
  allAndEvery(predicate) {
    return AllFinalizer.getAllAndEvery(this, predicate);
  },
  any(predicate) {
    return AnyFinalizer.get(this, predicate);
  },
  count(predicate) {
    return CountFinalizer.get(this, predicate);
  },
  aggregate(accumulator, initial) {
    switch (arguments.length) {
      case 1:{
          return AggregateFinalizer.get(this, accumulator);
        }
      case 2:{
          // here the resultCreator actually is the initial
          return AggregateFinalizer.getWithInitial(this, accumulator, initial);
        }
      default:{
          throw new RangeError('invalid arguments');
        }}

  },
  sum() {
    return AggregateFinalizer.get(this, (r, i) => r + i);
  },
  product() {
    return AggregateFinalizer.get(this, (r, i) => r * i);
  },
  min(comparer) {
    var compare = typeof comparer === 'undefined' ? defaultSortComparer : comparer;
    return AggregateFinalizer.get(this, (a, b) => {
      var comp = compare(a, b);
      return comp < 0 ? a : comp > 0 ? b : a;
    });
  },
  max(comparer) {
    var compare = typeof comparer === 'undefined' ? defaultSortComparer : comparer;
    return AggregateFinalizer.get(this, (a, b) => {
      var comp = compare(a, b);
      return comp < 0 ? b : comp > 0 ? a : b;
    });
  },
  elementAt(index) {
    return ElementAtFinalizer.get(this, index);
  },
  forEach(action) {
    return ForEachFinalizer.get(this, action);
  },
  isEqual(iterable, comparer) {
    return EqualFinalizer.get(this, iterable, comparer);
  },
  isElementsEqual(iterable, comparer) {
    return EqualFinalizer.getDifferentPosition(this, iterable, comparer);
  } };

// note: if using class as output we can just apply the mixin to BaseLinqIterable.
applyMixin(linqMixin, [
LinqIterable,
ArrayLikeIterable,
ObjectIterable,
WhereIterable,
SelectIterable,
SelectManyIterable,
FlatIterable,
TakeIterable,
SkipIterable,
RangeIterable,
RepeatIterable,
DistinctIterable,
Grouping,
GroupIterable,
OrderIterable,
OrderIterableDescending,
ConcatIterable,
UnionIterable,
GroupJoinIterable,
JoinIterable,
PageIterable]);

exports.from = from;
exports.fromArrayLike = fromArrayLike;
exports.fromIterable = fromIterable;
exports.fromObject = fromObject;
exports.range = range;
exports.repeat = repeat;
