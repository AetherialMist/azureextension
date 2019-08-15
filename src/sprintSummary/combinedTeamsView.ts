import Utils_Core = require('VSS/Utils/Core')
import Service = require('VSS/Service')
import Controls = require('VSS/Controls')
import Dialogs = require('VSS/Controls/Dialogs')
import Menus = require('VSS/Controls/Menus')
import Navigation = require('VSS/Controls/Navigation')
import { CombinedTeamsDialog } from './combinedTeamsDialogs'
import { CombinedTeamsGrid } from './combinedTeamsGrid'
import { CombinedTeam } from './contracts'
import { DataService } from './DataServices'

let delegate = Utils_Core.delegate;

export class CombinedTeamsView extends Navigation.NavigationView {

    private _dialogHeight: number = 300
    private _dialogWidth: number = 300

    private _toolbar: Menus.MenuBar
    private _grid: CombinedTeamsGrid
    private _dataService: DataService

    private static MenuCommands = {
        DELETE_SELECTED_TEAM: 'delete-selected-teams',
        EDIT_TEAM: 'edit-team',
        NEW_TEAM: 'new-team',
        REFRESH_TEAMS: 'refresh-teams',
    }

    public initialize() {
        this._dataService = Service.getService(DataService)
        this._dataService.initService().then(() => {
            this._createToolbar()
            this._createGridContainer()
            this._updateMenubarItems()

            this._onDataLoaded()
        }).catch((reason: any) => {
            console.error('Failed to load services.')
        })

        this._bind(CombinedTeamsGrid.Events.TEAM_MENU_ITEM_CLICKED, delegate(this, this._onContextMenuItemClick))
        this._bind(CombinedTeamsGrid.Events.SELECTED_TEAM_CHANGED, delegate(this, this._onSelectedTeamChanged))
        this._bind(CombinedTeamsGrid.Events.TEAM_DOUBLE_CLICK, delegate(this, this._onTeamDoubleClick))

        $('.add-first-team-link').click(() => {
            this._createNewTeam()
        })
    }

    private _createToolbar() {
        let $toolbarContainer: JQuery = this._element.find('.teams-toolbar-container')
        this._toolbar = this._createMenuBar($toolbarContainer)
    }

    private _createGridContainer() {
        let $gridContainer = this._element.find('.teams-grid-container')
        this._grid = <CombinedTeamsGrid>Controls.BaseControl.createIn(CombinedTeamsGrid, $gridContainer, {
            viewModel: this._dataService
        })
    }

    private _createMenuBar($container): Menus.MenuBar {
        return <Menus.MenuBar>Controls.BaseControl.createIn(Menus.MenuBar, $container, {
            items: this._createMenubarItems(),
            executeAction: Utils_Core.delegate(this, this._onMenuItemClick)
        })
    }

    private _createMenubarItems() {
        let items = []

        items.push({ id: CombinedTeamsView.MenuCommands.NEW_TEAM, text: 'New', title: 'New Team', showText: false, icon: 'icon-add-small' })
        items.push({ separator: true })
        items.push({ id: CombinedTeamsView.MenuCommands.EDIT_TEAM, text: 'Edit', title: 'Edit Team', showText: false, icon: 'icon-edit' })
        items.push({ id: CombinedTeamsView.MenuCommands.REFRESH_TEAMS, text: 'Refresh', title: 'Refresh Teams', showText: false, icon: 'icon-refresh' })
        items.push({ id: CombinedTeamsView.MenuCommands.DELETE_SELECTED_TEAM, text: 'Delete', title: 'Delete Teams', showText: false, icon: 'icon-delete' })

        return items
    }

    private _onContextMenuItemClick(e?, args?) {
        this._onMenuItemClick(args)
    }

    private _onMenuItemClick(e?) {
        let command = e.get_commandName()
        switch (command) {
            case CombinedTeamsView.MenuCommands.NEW_TEAM:
                this._createNewTeam()
                break
            case CombinedTeamsView.MenuCommands.EDIT_TEAM:
                this._editTeam(this._grid.getSelectedTeam())
                break
            case CombinedTeamsView.MenuCommands.REFRESH_TEAMS:
                this._refreshTeams()
                break
            case CombinedTeamsView.MenuCommands.DELETE_SELECTED_TEAM:
                this._deleteTeam(this._grid.getSelectedTeam())
                break
        }
    }

    private _onDataLoaded() {
        this._updateGrid(this._dataService.getCachedCombinedTeams())
    }

    private _updateGrid(combinedTeams: CombinedTeam[]) {
        this._grid.setSource(combinedTeams)
    }

    private _setSelectedTeam(combinedTeamToSelect: CombinedTeam) {
        $.each(this._dataService.getCachedCombinedTeams(), (i: number, combinedTeam: CombinedTeam) => {
            if (combinedTeam.id == combinedTeamToSelect.id) {
                this._grid.setSelectedDataIndex(i)
                return
            }
        })
    }

    private _onSelectedTeamChanged(e?, selectedCombinedTeam?) {
        this.delayExecute('updateMenuItems', 250, true, this._updateMenubarItems)
    }

    private _onTeamDoubleClick(e?, combinedTeam?) {
        if (combinedTeam) {
            this._editTeam(combinedTeam)
        }
    }

    private _updateMenubarItems() {
        let selectedTeams = this._grid.getSelectedTeams()

        this._toolbar.updateCommandStates([{ id: CombinedTeamsView.MenuCommands.EDIT_TEAM, disabled: selectedTeams.length !== 1 }])
        this._toolbar.updateCommandStates([{ id: CombinedTeamsView.MenuCommands.DELETE_SELECTED_TEAM, disabled: selectedTeams.length === 0 }])
    }

    private _deleteTeam(combinedTeam: CombinedTeam) {
        if (confirm('Are you sure you want to delete this combined team?')) {
            this._dataService.deleteCombinedTeam(combinedTeam,
                () => {
                    this._updateGrid(this._dataService.getCachedCombinedTeams())
                }
            )
        }
    }

    private _createNewTeam() {
        this._showTeamDialog('Create Combined Team', null, (newCombinedTeam: CombinedTeam) => {
            this._dataService.addCombinedTeam(newCombinedTeam,
                () => {
                    this._updateGrid(this._dataService.getCachedCombinedTeams())
                    this._setSelectedTeam(newCombinedTeam)
                }
            )
        })
    }

    private _editTeam(combinedTeam: CombinedTeam) {
        this._showTeamDialog('Edit Combined Team', combinedTeam, (editedCombinedTeam: CombinedTeam) => {
            this._dataService.updateCombinedTeam(combinedTeam, editedCombinedTeam,
                () => {
                    this._updateGrid(this._dataService.getCachedCombinedTeams())
                    this._setSelectedTeam(editedCombinedTeam)
                }
            )
        })
    }

    private _showTeamDialog(title: string, combinedTeam: CombinedTeam, okCallback: any) {
        Dialogs.show(CombinedTeamsDialog, {
            height: this._dialogHeight,
            width: this._dialogWidth,
            resizable: true,
            okCallback: okCallback,
            title: title,
            combinedTeam: combinedTeam,
        })
    }

    private _refreshTeams() {
        this._dataService.refresh()
    }
}

Controls.Enhancement.registerEnhancement(CombinedTeamsView, 'combined-teams-view')
