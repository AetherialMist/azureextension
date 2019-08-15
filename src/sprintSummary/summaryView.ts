import Navigation = require("VSS/Controls/Navigation")
import Controls = require("VSS/Controls")
import Service = require("VSS/Service")
import { RestHandler } from "./restHandler"
import { DataGatherer } from "./sprintDataGatherer"
import { SprintData } from "./contracts"
import { Summarizer } from "./summarizer"
import * as TableConverter from './tableConverter'
import * as _ from './lodashSub'
import { DataService } from "./DataServices"
import { SharedData } from "./sharedData"
// import { OptionsHandler } from "./optionsHandler"
import { TableMaker } from "./htmlTableMaker"
import { SettingsBuilder } from "./htmlSettingsBuilder";

export class SettingsView extends Navigation.NavigationView {
    private _blockActive: boolean = false

    private _data: SharedData = new SharedData()

    private _requestHandler: RestHandler = new RestHandler()
    private _dataGatherer: DataGatherer = new DataGatherer()
    private _summarizer: Summarizer = new Summarizer()
    private _dataService: DataService = new DataService()
    private _settingsBuilder: SettingsBuilder = new SettingsBuilder(this._data)
    private _tableMaker: TableMaker = new TableMaker(this._data, this._settingsBuilder)

    public initialize() {
        this._setStoredToDefaults()

        this._dataService = Service.getService(DataService)
        this._dataService.initService()
            .then(() => {
                this._data.storedSprintSummaries = this._dataService.getLastSavedSprintSummaries()
                this._data.storedCombinedTeams = this._dataService.getCachedCombinedTeams()

                this._data.refreshAvailableTeams()
                this._getAndSetSavedSettings(this._loadDisplay)
            })
            .catch((reason: any) => {
                console.error('Oh no, something went wrong!')
                this._loadDisplay()
            })
    }

    private _setStoredToDefaults(): void {
        this._data.storedSprintSummaries = []
        this._data.storedCombinedTeams = []
        this._data.storedSelectedProjects = []
        this._data.storedSelectedColumns = []
        this._data.storedSelectedTeams = []
        this._data.startingSprint = 0
        this._data.endingSprint = 100
    }

    private _getAndSetSavedSettings(callback: () => void) {
        this._dataService.getSavedUserValue<Settings>(this._data.settingsKey)
            .then((settings: Settings) => {
                try {
                    this._data.storedSelectedProjects = settings.selectedProjects
                    this._data.storedSelectedColumns = settings.selectedColumns
                    this._data.storedSelectedTeams = settings.selectedTeams
                    this._data.startingSprint = settings.startingSprint
                    this._data.endingSprint = settings.endingSprint
                } catch (error) {
                    console.error(`Settings mismatch`)
                } finally {
                    callback()
                }
            })
            .catch((reason: any) => {
                console.error('Settings failed to load. May not exist yet.')
                callback()
            })
    }

    private _loadDisplay = async (): Promise<void> => {
        this._data._pageContainer = document.getElementById('page-container') as HTMLDivElement

        this._data.availableProjects = await this._requestHandler.getProjectNames()
        this._data.availableColumns = TableConverter.availableColumnKeys

        this._settingsBuilder.buildSettingsContainer()

        this._setRefreshSprintDataButtonOnClick()
        this._setRefreshTableButtonOnClick()

        this._appendTableDiv()
        this._addSpacer(200)

        this._tableMaker.refreshTable()
    }

    private _addSpacer(height: number) {
        let spacer: HTMLDivElement = document.createElement('div')
        spacer.className = 'spacer'
        spacer.style.height = `${height}px`
        this._data._pageContainer.appendChild(spacer)
    }

    private _appendTableDiv() {
        let summaryDiv: HTMLDivElement = document.getElementById('summary') as HTMLDivElement

        let tableDiv: HTMLDivElement = document.createElement('div')
        tableDiv.className = 'table-div'
        tableDiv.id = this._data.getElementID('table', 'div')
        summaryDiv.appendChild(tableDiv)
    }

    // === Refresh Buttons ===

    private _setRefreshSprintDataButtonOnClick(): void {
        let that = this
        let refreshButton: HTMLInputElement = document.getElementById('refresh-sprint-data') as HTMLInputElement
        refreshButton.onclick = () => {
            if (confirm('Refreshing Sprint Data may take a few minutes. Are you sure?')) {
                this._refreshSprintData().then((value) => {
                    that._settingsBuilder.refreshTeamColumn()
                    that._refreshTable()
                }, (error) => {

                })
            }
        }
    }

    private _setRefreshTableButtonOnClick() {
        let refreshButton: HTMLInputElement = document.getElementById('refresh-table') as HTMLInputElement
        refreshButton.onclick = () => {
            this._refreshTable()
        }
    }

    private async _refreshSprintData(): Promise<void> {
        this._attemptBlockingMethod(async (callback) => {
            this._updateRefreshSprintDataStatus('Refresh Started. May take several minutes.')
            try {
                let settings: Settings = this._updateLocalSettings()

                await this._refreshSprintSummaries()
                this._tableMaker.refreshTable()
                this._saveSettings(settings, (value) => {
                    this._updateRefreshSprintDataStatus('Refresh Complete. Settings Saved.')
                })
            } catch (error) {
                console.log(error)
                this._updateRefreshSprintDataStatus('Failed to finish refresh.')
            } finally {
                callback()
            }
        })
    }

    private _refreshTable() {
        this._attemptBlockingMethod((callback) => {
            this._updateRefreshTableStatus('Refreshing Table. Please Wait.')
            try {
                let settings: Settings = this._updateLocalSettings()

                this._tableMaker.refreshTable()
                this._saveSettings(settings, (value) => {
                    this._updateRefreshTableStatus('Refresh Complete. Settings Saved.')
                })
            } catch (error) {
                this._updateRefreshTableStatus('Failed to finish refresh')
            } finally {
                callback()
            }
        })
    }

    private _attemptBlockingMethod(callback: (innerCallback: () => void) => void): boolean {
        if (this._blockActive) {
            return false
        }
        this._blockActive = true
        callback(() => {
            this._blockActive = false
        })
        return true
    }

    private _updateRefreshTableStatus(text: string): void {
        this._updateParagraph('refresh-table-status', text)
        this._updateParagraph('refresh-sprint-data-status', '')
    }

    private _updateRefreshSprintDataStatus(text: string): void {
        this._updateParagraph('refresh-sprint-data-status', text)
        this._updateParagraph('refresh-table-status', '')
    }

    private _updateParagraph(id: string, text: string) {
        let para: HTMLParagraphElement = document.getElementById(id) as HTMLParagraphElement
        para.innerHTML = text
    }

    private _updateLocalSettings(): Settings {
        let sprintRange = this._settingsBuilder.getSprintRange()
        this._data.storedSelectedProjects = this._settingsBuilder.getCheckedProjects()
        this._data.storedSelectedColumns = this._settingsBuilder.getCheckedColumns()
        this._data.storedSelectedTeams = this._settingsBuilder.getCheckedTeams()
        this._data.startingSprint = sprintRange.starting
        this._data.endingSprint = sprintRange.ending

        let settings: Settings = {
            selectedProjects: this._data.storedSelectedProjects,
            selectedColumns: this._data.storedSelectedColumns,
            selectedTeams: this._data.storedSelectedTeams,
            startingSprint: this._data.startingSprint,
            endingSprint: this._data.endingSprint
        }
        return settings
    }

    private async _saveSettings(settings: Settings, callback: (value: any) => void) {
        this._dataService.saveUserValue(this._data.settingsKey, settings).then((value: Settings) => {
            callback(value)
        })
    }

    // ===

    private async _refreshSprintSummaries() {
        let projectTeamPairs: ProjectTeamPair[] = this._getProjectTeamPairs(this._data.storedSelectedProjects)
        let newSprintData: SprintData[][] = await this._dataGatherer.getSprintDataForProjects(projectTeamPairs)
        this._data.storedSprintSummaries = this._summarizer.getSummarizedDataFromProjects(newSprintData)
        this._dataService.setSavedSprintSummaries(this._data.storedSprintSummaries)
    }

    private _getProjectTeamPairs(projects: string[]): ProjectTeamPair[] {
        let projectTeamPairs: { project: string, team: string }[] = []
        projects.forEach((project) => {
            projectTeamPairs.push({ project: project, team: `${project} Team` })
        })
        return projectTeamPairs
    }
}

Controls.Enhancement.registerEnhancement(SettingsView, "settings-view")

type ProjectTeamPair = {
    project: string,
    team: string
}

export type Settings = {
    selectedTeams: string[],
    selectedColumns: string[],
    selectedProjects: string[],
    startingSprint: number,
    endingSprint: number
}