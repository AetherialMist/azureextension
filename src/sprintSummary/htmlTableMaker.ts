import { SharedData } from './sharedData'
import { SprintSummary, CombinedTeam } from './contracts'
import * as TableConverter from './tableConverter'
import { SettingsBuilder } from './htmlSettingsBuilder'

export class TableMaker {
    
    private _data: SharedData
    private _settingsBuilder: SettingsBuilder

    public constructor(data: SharedData, optionsHandler: SettingsBuilder) {
        this._data = data
        this._settingsBuilder = optionsHandler
    }

    public refreshTable(): void {
        let filteredSummaries: SprintSummary[] = this._getFilteredSummaries()

        let columns: string[] = this._settingsBuilder.getCheckedColumns()
        let teams: string[] = this._settingsBuilder.getCheckedTeams()
        let combinedTeams: CombinedTeam[] = this._data.storedCombinedTeams

        TableConverter.setCombinedTeams(combinedTeams)
        TableConverter.selectColumnsToInclude(columns)
        let tableFormattedText: string = TableConverter.convertToTable(filteredSummaries, teams)

        let tableID: string = this._data.getElementID('table', 'div')
        let oldTableDiv: HTMLDivElement = document.getElementById(tableID) as HTMLDivElement
        let newTableDiv: HTMLDivElement = this._buildTable(tableFormattedText)

        let parentEle = oldTableDiv.parentNode
        parentEle.replaceChild(newTableDiv, oldTableDiv)
    }

    private _getFilteredSummaries(): SprintSummary[] {
        let filteredSummaries: SprintSummary[] = []
        let allSummaries: SprintSummary[] = this._data.storedSprintSummaries
        let start = this._data.startingSprint ? this._data.startingSprint : 0
        let end = this._data.endingSprint ? this._data.endingSprint : 100

        allSummaries.forEach( (sprintSummary) => {
            if (start <= sprintSummary.sprintNumber && sprintSummary.sprintNumber <= end) {
                filteredSummaries.push(sprintSummary)
            }
        })

        return filteredSummaries
    }

    private _buildTable(text: string): HTMLDivElement {
        let tableDiv: HTMLDivElement = document.createElement('div')
        tableDiv.className = 'table-div'
        tableDiv.id = this._data.getElementID('table', 'div')

        let table: HTMLTableElement = document.createElement('table')
        tableDiv.appendChild(table)

        let rows: string[] = text.split('\n')
        this._addTableHeaderRow(table, rows)
        this._addTableNonHeaderRows(table, rows)

        return tableDiv
    }

    private _addTableHeaderRow(table: HTMLTableElement, rows: string[]) {
        let firstRowColumns: string[] = rows[0].split(TableConverter.delimiter)
        let teamSpacing: number = this._getTableSpacingBetweenTeams(rows[0])

        let firstRow: HTMLTableRowElement = document.createElement('tr')
        table.appendChild(firstRow)

        let sprintColumn: HTMLTableHeaderCellElement = document.createElement('th')
        sprintColumn.innerHTML = firstRowColumns[0]
        sprintColumn.width = '50px'
        firstRow.appendChild(sprintColumn)

        let columnIndex = 1
        while (columnIndex < firstRowColumns.length - 1) {
            let teamColumn: HTMLTableHeaderCellElement = document.createElement('th')
            teamColumn.colSpan = teamSpacing
            teamColumn.innerHTML = firstRowColumns[columnIndex]
            firstRow.appendChild(teamColumn)

            columnIndex += teamSpacing
        }
    }

    private _addTableNonHeaderRows(table: HTMLTableElement, rows: string[]) {
        for (let i = 1; i < rows.length; i++) {
            let tableRow: HTMLTableRowElement = document.createElement('tr')
            table.appendChild(tableRow)

            let rowColumns: string[] = rows[i].split(TableConverter.delimiter)
            for (let k = 0; k < rowColumns.length - 1; k++) {
                let tableDataCell: HTMLTableDataCellElement = document.createElement('td')
                if (k === 0) {
                    let text = rowColumns[k]
                    text = text.replace(' ', '&nbsp')
                    tableDataCell.innerHTML = text

                } else {
                    tableDataCell.innerHTML = rowColumns[k]
                }
                tableRow.appendChild(tableDataCell)
            }
        }
    }

    private _getTableSpacingBetweenTeams(teamRow: string): number {
        let columns: string[] = teamRow.split('|')
        let delimiterCount = 1
        let colIndex = 2 // [0] = 'Sprint', [1] = 'First Team', [2]... = delimiter || 'Next Team'
        let tempCol = columns[colIndex]
        while (tempCol === '') {
            tempCol = columns[++colIndex]
            delimiterCount++
        }
        return delimiterCount
    }
}