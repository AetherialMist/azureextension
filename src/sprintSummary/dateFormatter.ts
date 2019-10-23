/**
 * Converts a javascript Date object into a microsoft DateTime formatted string.
 * 
 * If no addDays is given, the default is '0'
 * 
 * if no setTime is given, the default is '23:59:00'
 * 
 * @param date 
 * @param addDays Amount of days to add to the resulting DateTime string
 * @param setTime Time in the format of 'HH:MM:SS'
 */
export function formatDate(date: Date, addDays: number = 0, setTime?: string) {
    let DEFAULT_TIME = '23:59:00'
    let time = setTime ? setTime : DEFAULT_TIME
    let monthDays = [31, 28, 31, 30, 31, 30, 31, 30, 31, 30, 31, 30]
    let MAX_MONTH = 11
    let year = date.getFullYear() // yyyy
    let month = date.getMonth() // 0-11
    let day = date.getDate() // 1-31

    if (addDays !== 0) {
        if ((year % 4 === 0 && year % 100 !== 0) || year % 400 == 0) {
            monthDays[1] = 29
        }
        day += addDays
        if (day > monthDays[month]) {
            day = day - monthDays[month]
            month++
        }
        if (month > MAX_MONTH) {
            month = 0
            year++
        }
        monthDays[1] = 28
    }
    month++ // To get 1-12 instead of 0-11
    return `${year}-${month}-${day}T${time}.000Z`
}
