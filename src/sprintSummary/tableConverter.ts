import { SprintSummary, TeamData, HashedSprintSummary, CombinedTeam } from './contracts'

export const delimiter = '|'
const DECIMAL_PLACES = 2

const availableColumns: Columns = {
    'Committed': pushCommittedByTeam,
    'Completed': pushCompletedByTeam,
    'AllCompleted': pushAllCompletedByTeam,
    'PercentCompleted': pushPercentCompletedByTeam
}
const availableSprintTotalColumns: Columns = {
    'Committed': pushCommittedBySprint,
    'Completed': pushCompletedBySprint,
    'AllCompleted': pushAllCompletedBySprint,
    'PercentCompleted': pushPercentCompletedBySprint
}
const availableTeamTotalColumns: Columns = {
    'Committed': pushTotalCommittedByTeam,
    'Completed': pushTotalCompletedByTeam,
    'AllCompleted': pushTotalAllCompletedByTeam,
    'PercentCompleted': pushTotalPercentCompletedByTeam
}
const availableTotalColumns: Columns = {
    'Committed': pushTotalCommitted,
    'Completed': pushTotalCompleted,
    'AllCompleted': pushTotalAllCompleted,
    'PercentCompleted': pushTotalPercentCompelted
}

export let availableColumnKeys: string[] = Object.keys(availableColumns)

let combinedTeams: CombinedTeam[] = []
let columnsToInclude: string[] = []
let sb: string[] = [] // String Builder

export function convertToTable(sprintSummaries: SprintSummary[], teams: string[]): string {
    sb = []
    let excelConverterInfo: TableConverterInfo = getTableConverterInfo(sprintSummaries, teams)

    pushHeaderRows(excelConverterInfo)
    pushSprintRows(excelConverterInfo)
    pushTeamTotals(excelConverterInfo)

    let excelFormat: string = sb.join('')
    return excelFormat
}

function getTableConverterInfo(sprintSummaries: SprintSummary[], teamsToShow: string[]): TableConverterInfo {
    let hashedSprintSummaries: HashedSprintSummary[] = convertSprintSummariesToHashedSprintSummaries(sprintSummaries)
    let sprintNumbers: number[] = getSprintNumbers(sprintSummaries)
    teamsToShow.sort()

    let excelConverterInfo: TableConverterInfo = {
        teamsToShow: teamsToShow,
        hashedSprintSummaries: hashedSprintSummaries,
        sprintNumbers: sprintNumbers,
        hashedTeamCommittedTotals: [],
        hashedTeamCompletedTotals: [],
        hashedTeamAllCompletedTotals: [],
        hashedSprintCommittedTotals: [],
        hashedSprintCompletedTotals: [],
        hashedSprintAllCompletedTotals: [],
        totalCommitted: 0,
        totalCompleted: 0,
        totalAllCompleted: 0
    }
    updateCombinedTeams(excelConverterInfo)
    updateTeamTotals(excelConverterInfo)
    updateSprintTotals(excelConverterInfo)
    updateTotals(excelConverterInfo)

    return excelConverterInfo
}

/**
 * See Types.SprintSummary and Types.SprintSummaryUsingHash to understand the purpose of this method
 * TL;DR: incompatibilities using forEach and fori loops
 * 
 * The returned sprintNumbers will be in sorted order from least to greatest
 * @param sprintSummaries 
 */
function convertSprintSummariesToHashedSprintSummaries(sprintSummaries: SprintSummary[]): HashedSprintSummary[] {
    let hashedSprintSummaries: HashedSprintSummary[] = []

    sprintSummaries.forEach((sprintSummary: SprintSummary) => {
        let hashedTeamData: TeamData[] = []

        let allTeamData: TeamData[] = sprintSummary.teamData
        allTeamData.forEach((teamData: TeamData) => {
            let teamName = teamData.team
            hashedTeamData[teamName] = teamData
        })

        let entry: HashedSprintSummary = {
            sprintNumber: sprintSummary.sprintNumber,
            hashedTeamData: hashedTeamData
        }

        hashedSprintSummaries[sprintSummary.sprintNumber] = entry
    })

    return hashedSprintSummaries
}

function getSprintNumbers(sprintSummaries: SprintSummary[]): number[] {
    let sprintNumbers: number[] = []

    sprintSummaries.forEach((sprintSummary: SprintSummary) => {
        let sprintNumber = sprintSummary.sprintNumber
        sprintNumbers.push(sprintNumber)
    })

    sprintNumbers.sort((a: number, b: number) => {
        return a - b
    })

    return sprintNumbers
}

function updateTeamTotals(excelConverterInfo: TableConverterInfo): void {
    let teams: string[] = excelConverterInfo.teamsToShow
    let teamCommittedTotals: number[] = excelConverterInfo.hashedTeamCommittedTotals
    let teamCompletedTotals: number[] = excelConverterInfo.hashedTeamCompletedTotals
    let teamAllCompletedTotals: number[] = excelConverterInfo.hashedTeamAllCompletedTotals
    let hashedSprintSummaries: HashedSprintSummary[] = excelConverterInfo.hashedSprintSummaries
    let sprintNumbers: number[] = excelConverterInfo.sprintNumbers

    for (let i = 0; i < sprintNumbers.length; i++) {
        let hashedSprintSummary: HashedSprintSummary = hashedSprintSummaries[sprintNumbers[i]]
        let hashedTeamData: TeamData[] = hashedSprintSummary.hashedTeamData

        teams.forEach((team: string) => {
            let teamData: TeamData = hashedTeamData[team]
            if (teamData) {
                let teamName = teamData.team

                // Be careful with references/values
                let teamCommittedTotal: number = teamCommittedTotals[teamName]
                teamCommittedTotals[teamName] = teamCommittedTotal ? +teamCommittedTotal + teamData.committed : +teamData.committed

                let teamCompletedTotal: number = teamCompletedTotals[teamName]
                teamCompletedTotals[teamName] = teamCompletedTotal ? +teamCompletedTotal + teamData.completed : +teamData.completed

                let teamAllCompletedTotal: number[] = teamAllCompletedTotals[teamName]
                teamAllCompletedTotals[teamName] = teamAllCompletedTotal ? +teamAllCompletedTotal + teamData.allCompleted : +teamData.allCompleted
            }
        })
    }
}

function updateSprintTotals(excelConverterInfo: TableConverterInfo): void {
    let teams: string[] = excelConverterInfo.teamsToShow
    let sprintCommittedTotals: number[] = excelConverterInfo.hashedSprintCommittedTotals
    let sprintCompletedTotals: number[] = excelConverterInfo.hashedSprintCompletedTotals
    let sprintAllCompletedTotals: number[] = excelConverterInfo.hashedSprintAllCompletedTotals
    let hashedSprintSummaries: HashedSprintSummary[] = excelConverterInfo.hashedSprintSummaries
    let sprintNumbers: number[] = excelConverterInfo.sprintNumbers

    for (let i = 0; i < sprintNumbers.length; i++) {
        let sprintNumber: number = sprintNumbers[i]
        let hashedSprintSummary: HashedSprintSummary = hashedSprintSummaries[sprintNumber]
        let hashedTeamData: TeamData[] = hashedSprintSummary.hashedTeamData

        teams.forEach((team: string) => {
            let teamData: TeamData = hashedTeamData[team]

            if (teamData) {
                let committed = teamData.committed
                let completed = teamData.completed
                let allCompleted = teamData.allCompleted

                let sprintCommittedTotal: number = sprintCommittedTotals[sprintNumber]
                sprintCommittedTotals[sprintNumber] = sprintCommittedTotal ? +sprintCommittedTotal + committed : +committed

                let sprintCompletedTotal: number = sprintCompletedTotals[sprintNumber]
                sprintCompletedTotals[sprintNumber] = sprintCompletedTotal ? +sprintCompletedTotal + completed : +completed

                let sprintAllCompletedTotal: number = sprintAllCompletedTotals[sprintNumber]
                sprintAllCompletedTotals[sprintNumber] = sprintAllCompletedTotal ? +sprintAllCompletedTotal + allCompleted : +allCompleted
            }
        })
    }
}

function updateTotals(excelConverterInfo: TableConverterInfo): void {
    // total committed
    let sprintNumbers: number[] = excelConverterInfo.sprintNumbers
    let sprintCommittedTotals = excelConverterInfo.hashedSprintCommittedTotals
    let sprintCompletedTotals = excelConverterInfo.hashedSprintCompletedTotals
    let sprintAllCompletedTotals = excelConverterInfo.hashedSprintAllCompletedTotals

    let totalCommitted = 0
    let totalCompleted = 0
    let totalAllCompleted = 0
    sprintNumbers.forEach((sprintNumber) => {
        totalCommitted = sprintCommittedTotals[sprintNumber] ? sprintCommittedTotals[sprintNumber] + totalCommitted : totalCommitted
        totalCompleted = sprintCompletedTotals[sprintNumber] ? sprintCompletedTotals[sprintNumber] + totalCompleted : totalCompleted
        totalAllCompleted = sprintAllCompletedTotals[sprintNumber] ? sprintAllCompletedTotals[sprintNumber] + totalAllCompleted : totalAllCompleted
    })

    excelConverterInfo.totalCommitted = totalCommitted
    excelConverterInfo.totalCompleted = totalCompleted
    excelConverterInfo.totalAllCompleted = totalAllCompleted
}

// === Push ===

function pushHeaderRows(excelConverterInfo: TableConverterInfo): void {
    let teams: string[] = excelConverterInfo.teamsToShow

    sb.push('Sprint', delimiter) // Sprint|
    teams.forEach((team) => {
        // TeamName|<empty>|<empty>|
        sb.push(team, delimiter)
        for (let i = 1; i < columnsToInclude.length; i++) {
            sb.push(delimiter)
        }
    })
    sb.push('Sprint Totals', delimiter)
    for (let i = 1; i < columnsToInclude.length; i++) {
        sb.push(delimiter)
    }

    sb.push('\n') // Next Row

    sb.push(delimiter) // <empty>|

    // '<=' is because the final Sprint Total columns
    for (let i = 0; i <= teams.length; i++) {
        for (let k = 0; k < columnsToInclude.length; k++) {
            sb.push(columnsToInclude[k], delimiter)
        }
    }

    sb.push('\n') // Next Row
}

function pushSprintRows(excelConverterInfo: TableConverterInfo): void {
    let hashedSprintSummaries: HashedSprintSummary[] = excelConverterInfo.hashedSprintSummaries
    let sprintNumbers: number[] = excelConverterInfo.sprintNumbers
    let teams: string[] = excelConverterInfo.teamsToShow

    for (let i = 0; i < sprintNumbers.length; i++) {
        sb.push(`Sprint ${sprintNumbers[i]}${delimiter}`)
        let hashedSprintSummary: HashedSprintSummary = hashedSprintSummaries[sprintNumbers[i]]
        let hashedTeamData: TeamData[] = hashedSprintSummary.hashedTeamData
        teams.forEach((team: string) => {
            let teamData: TeamData = hashedTeamData[team]

            for (let k = 0; k < columnsToInclude.length; k++) {
                let columnName: string = columnsToInclude[k]
                let columnFunction = availableColumns[columnName]
                columnFunction(teamData)
            }
        })

        for (let k = 0; k < columnsToInclude.length; k++) {
            let columnName: string = columnsToInclude[k]
            let totalColumnFunction = availableSprintTotalColumns[columnName]
            totalColumnFunction(excelConverterInfo, sprintNumbers[i])
        }
        sb.push('\n') // Next Row/Sprint
    }
}

function pushTeamTotals(excelConverterInfo: TableConverterInfo): void {
    let teams: string[] = excelConverterInfo.teamsToShow

    sb.push('Totals', delimiter)

    teams.forEach((team: string) => {
        for (let i = 0; i < columnsToInclude.length; i++) {
            let columnName: string = columnsToInclude[i]
            let columnFunction = availableTeamTotalColumns[columnName]
            columnFunction(excelConverterInfo, team)
        }
    })

    // Sprint Totals columns
    for (let i = 0; i < columnsToInclude.length; i++) {
        let columnName: string = columnsToInclude[i]
        let columnFunction = availableTotalColumns[columnName]
        columnFunction(excelConverterInfo)
    }

    // sb.push('\n') // Next Row
}

// === By Team ===

function pushCommittedByTeam(teamData: TeamData): void {
    let entry: string = '0'
    if (teamData) {
        entry = `${teamData.committed}`
    }
    pushColumn(entry)
}

function pushCompletedByTeam(teamData: TeamData): void {
    let entry: string = '0'
    if (teamData) {
        entry = `${teamData.completed}`
    }
    pushColumn(entry)
}

function pushAllCompletedByTeam(teamData: TeamData): void {
    let entry: string = '0'
    if (teamData) {
        entry = `${teamData.allCompleted}`
    }
    pushColumn(entry)
}

function pushPercentCompletedByTeam(teamData: TeamData): void {
    let entry: string = 'N/A%'
    if (teamData) {
        let denominator: number = teamData.committed
        let numerator: number = teamData.allCompleted
        let percent: number = getPercent(numerator, denominator)
        entry = `${percent.toFixed(DECIMAL_PLACES)}%`
    }
    pushColumn(entry)
}

function pushTotalCommittedByTeam(excelConverterInfo: TableConverterInfo, teamName: string): void {
    let teamTotalCommitted = excelConverterInfo.hashedTeamCommittedTotals[teamName]
    let entry: string = '0'

    if (teamTotalCommitted) {
        entry = `${teamTotalCommitted}`
    }
    pushColumn(entry)
}

function pushTotalCompletedByTeam(excelConverterInfo: TableConverterInfo, teamName: string): void {
    let teamTotalCompleted = excelConverterInfo.hashedTeamCompletedTotals[teamName]
    let entry: string = '0'

    if (teamTotalCompleted) {
        entry = `${teamTotalCompleted}`
    }
    pushColumn(entry)
}

function pushTotalAllCompletedByTeam(excelConverterInfo: TableConverterInfo, teamName: string): void {
    let totalAllCompleted = excelConverterInfo.hashedTeamAllCompletedTotals[teamName]
    let entry: string = '0'

    if (totalAllCompleted) {
        entry = `${totalAllCompleted}`
    }
    pushColumn(entry)
}

function pushTotalPercentCompletedByTeam(excelConverterInfo: TableConverterInfo, teamName: string): void {
    let denominator = excelConverterInfo.hashedTeamCommittedTotals[teamName]
    let numerator = excelConverterInfo.hashedTeamAllCompletedTotals[teamName]
    let totalPercentCompleted = getPercent(numerator, denominator)
    let entry = `${totalPercentCompleted.toFixed(DECIMAL_PLACES)}%`
    pushColumn(entry)
}

// === By Sprint ===

function pushCommittedBySprint(excelConverterInfo: TableConverterInfo, sprintNumber: number): void {
    let entry: string = '0'
    if (excelConverterInfo.hashedSprintCommittedTotals[sprintNumber]) {
        entry = `${excelConverterInfo.hashedSprintCommittedTotals[sprintNumber]}`
    }
    pushColumn(entry)
}

function pushCompletedBySprint(excelConverterInfo: TableConverterInfo, sprintNumber: number): void {
    let entry: string = '0'
    if (excelConverterInfo.hashedSprintCompletedTotals[sprintNumber]) {
        entry = `${excelConverterInfo.hashedSprintCompletedTotals[sprintNumber]}`
    }
    pushColumn(entry)
}

function pushAllCompletedBySprint(excelConverterInfo: TableConverterInfo, sprintNumber: number): void {
    let entry: string = '0'
    if (excelConverterInfo.hashedSprintAllCompletedTotals[sprintNumber]) {
        entry = `${excelConverterInfo.hashedSprintAllCompletedTotals[sprintNumber]}`
    }
    pushColumn(entry)
}

function pushPercentCompletedBySprint(excelConverterInfo: TableConverterInfo, sprintNumber: number): void {
    let denominator: number = excelConverterInfo.hashedSprintCommittedTotals[sprintNumber]
    let numerator: number = excelConverterInfo.hashedSprintAllCompletedTotals[sprintNumber]
    let percentTotal = getPercent(numerator, denominator)
    let entry = `${percentTotal.toFixed(DECIMAL_PLACES)}%`
    pushColumn(entry)
}

// === Totals

function pushTotalCommitted(excelConverterInfo: TableConverterInfo): void {
    pushColumn(`${excelConverterInfo.totalCommitted}`)
}

function pushTotalCompleted(excelConverterInfo: TableConverterInfo): void {
    pushColumn(`${excelConverterInfo.totalCompleted}`)
}

function pushTotalAllCompleted(excelConverterInfo: TableConverterInfo): void {
    pushColumn(`${excelConverterInfo.totalAllCompleted}`)
}

function pushTotalPercentCompelted(excelConverterInfo: TableConverterInfo): void {
    let denominator: number = excelConverterInfo.totalCommitted
    let numerator: number = excelConverterInfo.totalAllCompleted
    let totalPercentCompleted: number = getPercent(numerator, denominator)
    let entry: string = `${totalPercentCompleted.toFixed(DECIMAL_PLACES)}%`
    pushColumn(entry)
}

// ===

function getPercent(numerator: number, denominator: number): number {
    let percent: number = 0
    if (denominator && numerator && denominator !== 0) {
        percent = numerator / denominator * 100
    }
    return percent
}

function pushColumn(entry: string): void {
    sb.push(`${entry}${delimiter}`)
}

// === Combined Teams ===

function updateCombinedTeams(excelConverterInfo: TableConverterInfo): void {
    let sprintNumbers: number[] = excelConverterInfo.sprintNumbers
    let hashedSummaries: HashedSprintSummary[] = excelConverterInfo.hashedSprintSummaries

    combinedTeams.forEach((combinedTeam: CombinedTeam) => {
        for (let i = 0; i < sprintNumbers.length; i++) {
            let sprintNumber: number = sprintNumbers[i]

            if (sprintNumber >= combinedTeam.startingSprint) {
                let hashedSummary: HashedSprintSummary = hashedSummaries[sprintNumber]
                updateCombinedTeamForSprint(combinedTeam, hashedSummary)
            }
        }
    })
}

function updateCombinedTeamForSprint(combinedTeam: CombinedTeam, hashedSummary: HashedSprintSummary): void {
    let hashedTeamData: TeamData[] = hashedSummary.hashedTeamData
    let oldTeams: string[] = combinedTeam.teams

    ensureTeamDataExists(combinedTeam.combinedName, hashedTeamData)
    let newTeamData: TeamData = hashedTeamData[combinedTeam.combinedName]

    if (newTeamData) {
        oldTeams.forEach((oldTeam: string) => {
            let oldTeamData: TeamData = hashedTeamData[oldTeam]
            if (oldTeamData) {
                moveOldTeamDataToNewTeamData(oldTeamData, newTeamData)
                hashedTeamData[oldTeam] = undefined
            }
        })
    }
}

function ensureTeamDataExists(teamName: string, hashedTeamData: TeamData[]): void {
    if (!hashedTeamData[teamName]) {
        let emptyTeamData: TeamData = {
            committed: 0, completed: 0, allCompleted: 0, percentCompleted: 0, team: teamName
        }
        hashedTeamData[teamName] = emptyTeamData
    }
}

function moveOldTeamDataToNewTeamData(oldTeamData: TeamData, newTeamData: TeamData): void {
    let oldCommitted: number = oldTeamData.committed
    let oldCompleted: number = oldTeamData.completed
    let oldAllCompleted: number = oldTeamData.allCompleted

    oldTeamData.committed = 0
    oldTeamData.completed = 0
    oldTeamData.allCompleted = 0
    oldTeamData.percentCompleted = 0

    newTeamData.committed = newTeamData.committed ? +newTeamData.committed + oldCommitted : +oldCommitted
    newTeamData.completed = newTeamData.completed ? +newTeamData.completed + oldCompleted : +oldCompleted
    newTeamData.allCompleted = newTeamData.allCompleted ? +newTeamData.allCompleted + oldAllCompleted : +oldAllCompleted

    let newPercent = 0
    if (newTeamData.committed) {
        newPercent = newTeamData.completed / newTeamData.committed * 100
    }
    newTeamData.percentCompleted = newPercent
}

// ===

export function setCombinedTeams(newCombinedTeams: CombinedTeam[]): void {
    combinedTeams = newCombinedTeams
}

export function selectColumnsToInclude(columns: string[]): void {
    columnsToInclude = columns
}

/**
 * hashedSprintSummaries should be indexed using sprint numbers
 * All team total arrays should be indexed using team names (a sort of hash)
 * All sprint total arrays should be indexed using sprint numbers
 */
type TableConverterInfo = {
    teamsToShow: string[],
    hashedSprintSummaries: HashedSprintSummary[],
    sprintNumbers: number[]
    hashedTeamCommittedTotals: number[],
    hashedTeamCompletedTotals: number[],
    hashedTeamAllCompletedTotals: number[],
    hashedSprintCommittedTotals: number[],
    hashedSprintCompletedTotals: number[],
    hashedSprintAllCompletedTotals: number[],
    totalCommitted: number,
    totalCompleted: number,
    totalAllCompleted: number
}

type Columns = {
    'Committed': any,
    'Completed': any,
    'AllCompleted': any,
    'PercentCompleted': any
}