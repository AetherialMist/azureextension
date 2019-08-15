import Grids = require('VSS/Controls/Grids')
import { CombinedTeam } from './contracts'
import * as _ from './lodashSub'

export class CombinedTeamsGrid extends Grids.GridO<any> {

    public static Events = {
        TEAM_DOUBLE_CLICK: 'teamDoubleClick',
        SELECTED_TEAM_CHANGED: 'selectedTeamChanged',
        TEAM_MENU_ITEM_CLICKED: 'teamMenuItemClicked'
    }

    public initializeOptions(options?: any) {
        super.initializeOptions($.extend({
            sharedMeasurements: false,
            allowMoveColumns: false,
            allowMultiSelect: true,
            gutter: {
                contextMenu: false
            },
            cssClass: 'teams-grid',
            columns: this._getColumns(),
            sortOrder: this._getSortOrder(),
            initialSelection: false
        }, options))
    }

    public setSource(combinedTeams: CombinedTeam[]) {
        let options = this._options

        options.source = combinedTeams
        options.columns = this._columns
        options.sortOrder = this._sortOrder

        this.initializeDataSource()
        this.onSort(options.sortOrder)

        this._selectRowFunction(combinedTeams)
    }

    private _selectRowFunction(combinedTeams: CombinedTeam[]) {
        let prevSelection = this.getSelectedTeam()
        if (combinedTeams && combinedTeams.length > 0) {
            let indexToSelect = 0
            if (prevSelection) {
                for (let i = 0; i < combinedTeams.length; i++) {
                    if (combinedTeams[i] && combinedTeams[i].id === prevSelection.id) {
                        indexToSelect = this._getRowIndex(i)
                        break
                    }
                }
            }
            this._selectRow(indexToSelect)
        }
    }

    public onRowDoubleClick(eventArgs): any {
        let combinedTeam = this.getSelectedTeam()
        if (combinedTeam) {
            this._fire(CombinedTeamsGrid.Events.TEAM_DOUBLE_CLICK, combinedTeam)
        }
    }

    public getSelectedTeams(): any[] {
        let selectedTeams = []
        for (let rowIndex in this._selectedRows) {
            if (this._selectedRows.hasOwnProperty(rowIndex)) {
                selectedTeams.push(this._dataSource[this._selectedRows[rowIndex]])
            }
        }
        return selectedTeams
    }

    public getSelectedTeam(): CombinedTeam {
        let selectedDataIndex = this._selectedRows[this._selectedIndex]
        return (typeof (selectedDataIndex) === 'number') ? this._dataSource[selectedDataIndex] : null
    }

    public selectedIndexChanged(selectedRowIndex, selectedDataIndex) {
        super.selectedIndexChanged(selectedRowIndex, selectedDataIndex)
        this._fire(CombinedTeamsGrid.Events.SELECTED_TEAM_CHANGED, this._dataSource[selectedDataIndex])
    }

    private _getColumns() {
        let columns = []

        columns.push(this._createColumn('combinedName', 'Combined Name', 150, this._getCombinedNameFunction(this)))
        columns.push(this._createColumn('teams', 'Teams', 300, this._getTeamsFunction(this)))
        columns.push(this._createColumn('startingSprint', 'Starting Sprint', 120, this._getStartingSprintFunction(this)))

        return columns
    }

    private _createColumn(index: string, text: string, width: number, columnFunction: (dataIndex, columnIndex, columnOrder) => void) {
        return {
            index: index,
            text: text,
            width: width,
            getColumnValue: columnFunction
        }
    }

    private _getCombinedNameFunction(grid: CombinedTeamsGrid): (dataIndex, columnIndex, columnOrder) => void {
        return (dataIndex, columnIndex, columnOrder) => {
            let combinedTeam: CombinedTeam = grid._dataSource[dataIndex]
            return combinedTeam.combinedName
        }
    }

    private _getStartingSprintFunction(grid: CombinedTeamsGrid): (dataIndex, columnIndex, columnOrder) => void {
        return (dataIndex, columnIndex, columnOrder) => {
            let combinedTeam: CombinedTeam = grid._dataSource[dataIndex]
            return combinedTeam.startingSprint
        }
    }

    private _getTeamsFunction(grid: CombinedTeamsGrid): (dataIndex, columnIndex, columnOrder) => void {
        return (dataIndex, columnIndex, columnOrder) => {
            let combinedTeam: CombinedTeam = grid._dataSource[dataIndex]
            return _.convertArrayToList(combinedTeam.teams)
        }
    }

    private _getSortOrder() {
        let sortColumns = []
        sortColumns.push({ index: 'combinedName', order: 'asc' })
        return sortColumns
    }
}