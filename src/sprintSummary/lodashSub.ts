/*
 * Due to the extension not working well when importing
 * additional modules (conflicting imports and addressablility^1 
 * being the main problems), the functions needed to be added manually
 * into the project. There is probably a semi-simple solution to this
 * problem. However, Cordell Stocker (cstocker@karmak.com) could not
 * find a working solution in a reasonable amount of time.
 * 
 * Source Code (and credit): https://github.com/lodash/lodash
 * 
 * ^1: Any module/file used must have a filepath added to the vss-extension.json.
 */

/**
 * Iterates over the arr, and returns an array of all values found using
 * the given attr.
 * 
 * (element of arr)[attr] = value. 
 * 
 * Order is not garenteed.
 * 
 * Example:
 * ex = [
 *   {'team': 'A Team', 'item': 4},
 *   {'team': 'B Team', 'item': 7},
 *   {'team': 'A Team', 'item': 1},
 * ]
 * 
 * map(ex, 'item') => [4, 7, 1]
 * map(ex, 'team') => ['A Team', 'B Team', 'A Team']
 * 
 * @param arr An array of key-value pairs, or an array objects with property-value pairs.
 * @param attr The key/property name.
 */
export function map(arr: any[], attr: string): any[] {
    let returnArr: any[] = []
    arr.forEach((el) => {
        let elAttr = el[attr]
        if (elAttr) {
            returnArr.push(elAttr)
        }
    })
    return returnArr
}

/**
 * Iterates over the arr, and returns an object of property-value pairs.
 * Where the properties are all values stored at (element of arr)[attr],
 * and the values are how many times (element of arr)[attr] appeard
 * throughout the arr.
 * 
 * Example:
 * 
 * ex = [
 *   {'team': 'A Team', 'time': '08:00'}, 
 *   {'team': 'B Team, 'time': '12:00'}, 
 *   {'team': 'A Team', 'time': '20:00'}
 * ]
 * 
 * countBy(ex, 'team') => {
 *   'A Team': 2,
 *   'B Team': 1
 * }
 * 
 * countBy(ex, 'time') => {
 *   '08:00': 1,
 *   '12:00': 1,
 *   '20:00': 1
 * }
 * 
 * @param arr An array of key-value pairs, or an array of objects with property-value pairs.
 * @param attr The key/property name.
 */
export function countBy(arr: any[], attr: string): any {
    let obj = {}
    arr.forEach((el) => {
        let elAttr = el[attr]
        if (elAttr) {
            if (obj[elAttr]) {
                obj[elAttr] = +obj[elAttr] + 1
            } else {
                obj[elAttr] = 1
            }
        }
    })
    return obj
}

/**
 * Returns a duplicate-free version of the passed in arr.
 * Order is not garenteed.
 * 
 * Example:
 * 
 * ex = [5, 6, 4, 5, 5, 6]
 * 
 * uniq(ex) => [5, 6, 4]
 * 
 * @param arr An array or array of objects
 */
export function uniq<T>(arr: T[]): T[] {
    let uniq: T[] = []
    let hash: T[] = []
    arr.forEach((el: T) => {
        if (!hash[`${el}`]) {
            hash[`${el}`] = el
            uniq.push(el)
        }
    })
    return uniq
}

/**
 * Returns an array of objects from the given objArr that have a matching
 * property-value pair to the objFilter. Order is not garenteed
 * 
 * Example:
 * 
 * exArr = [
 *   {'team': 'A Team', 'item': 3},
 *   {'team': 'B Team', 'item': 6},
 *   {'team': 'A Team', 'item': 8},
 * ]
 * 
 * exFilter = {'team': 'B Team'}
 * 
 * filter(exArr, exFilter) => [
 *   {'team': 'B Team', 'item': 6}
 * ]
 * 
 * @param objArr A regular index array
 * @param objFilter An object with a single property-value pair. e.x. objFilter = { 'propName': 'value' }
 */
export function filter<T>(objArr: T[], objFilter: any): T[] {
    let returns: T[] = []
    let propertyName: string = Object.getOwnPropertyNames(objFilter)[0]
    let filter: any = objFilter[propertyName]

    objArr.forEach((el: T) => {
        if (el[propertyName] === filter) {
            returns.push(el)
        }
    })

    return returns
}

/**
 * Returns if the two arrays contain the same elements,
 * but not neccessarily in the same order.
 * 
 * Example:
 * 
 * ex1 = [4, 3, 1, 7]
 * 
 * ex2 = [7, 4, 1, 3]
 * 
 * contentsMatch(ex1, ex2) => true
 * 
 * @param firstArr An array or array of objects
 * @param secondArr An array or array of objects
 */
export function contentsMatch(firstArr: any[], secondArr: any[]): boolean {
    let containsOnly = true

    let firstHash: any[] = []
    firstArr.forEach((firstEl) => {
        firstHash[`${firstEl}`] = firstEl
    })

    let secondHash: any[] = []
    secondArr.forEach((secondEl) => {
        secondHash[`${secondEl}`] = secondEl
    })

    firstArr.forEach((firstEl) => {
        if (!secondHash[`${firstEl}`]) {
            containsOnly = false
        }
    })

    secondArr.forEach((secondEl) => {
        if (!firstHash[`${secondEl}`]) {
            containsOnly = false
        }
    })

    return containsOnly
}

/**
 * Turns an array of strings, into a comma separated list.
 * 
 * Whitespace of the strings is preseved, and no whitespace is added
 * between items.
 * 
 * @param items 
 */
export function convertArrayToList(items: string[]): string {
    let sb: string[] = []
    for (let i = 0; i < items.length - 1; i++) {
        sb.push(items[i], ',')
    }
    sb.push(items[items.length - 1])
    return sb.join('')
}