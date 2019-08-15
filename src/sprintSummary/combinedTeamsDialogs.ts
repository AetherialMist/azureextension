import Utils_UI = require('VSS/Utils/UI')
import Controls = require('VSS/Controls')
import Dialogs = require('VSS/Controls/Dialogs')
import { CombinedTeam } from './contracts'
import * as _ from './lodashSub'

let domElem = Utils_UI.domElem

export interface CombinedTeamsDialogOptions extends Dialogs.IModalDialogOptions {
    combinedTeam?: CombinedTeam
}

export class CombinedTeamsDialog extends Dialogs.ModalDialogO<CombinedTeamsDialogOptions> {

    private _combinedTeam: CombinedTeam

    private _$container: JQuery
    private _$inputCombinedName: JQuery
    private _$inputTeams: JQuery
    private _$inputStartingSprint: JQuery

    public initializeOptions(options?: any) {
        super.initializeOptions($.extend({}, options))
    }

    public initialize() {
        super.initialize()

        this._appendContainer()
        this._appendCombinedNameFieldToContainer()
        this._appendCombinedTeamsFieldToContainer()
        this._appendStartingSprintNumberFieldToContainer()

        if (this._options.combinedTeam) {
            this._updateFields()
        }

        this.updateOkButton(true)
    }

    private _appendContainer() {
        this._$container = $(domElem('div')).appendTo(this._element)
    }

    private _appendCombinedNameFieldToContainer() {
        let inputIDCombinedName: string = 'combinedName' + Controls.getId()
        this._appendLabelToContainer('Combined Name:', inputIDCombinedName)
        this._$inputCombinedName = this._appendInputInDiv('input', inputIDCombinedName, 'text')
    }

    private _appendCombinedTeamsFieldToContainer() {
        let inputIDCombinedTeams: string = 'combinedTeams' + Controls.getId()
        this._appendLabelToContainer(
            `Combined Teams, use a comma separated list, white space ` +
            `before and after each name is removed! e.x. 'A Team, B Team, C Team'`,
            inputIDCombinedTeams
        )
        this._$inputTeams = this._appendInputInDiv('textArea', inputIDCombinedTeams, 'text')
    }

    private _appendStartingSprintNumberFieldToContainer() {
        let inputIDStartingSprint: string = 'startingSprint' + Controls.getId()
        this._appendLabelToContainer('Starting Sprint Number:', inputIDStartingSprint)
        this._$inputStartingSprint = this._appendInputInDiv('input', inputIDStartingSprint, 'number')
    }

    private _appendLabelToContainer(text: string, id: string): JQuery {
        return $(domElem('label'))
            .attr('for', id)
            .text(text)
            .appendTo(this._$container)
    }

    /**
     * Returns the input element.
     * 
     * @param elementType html tag
     * @param id html id
     * @param type html type
     */
    private _appendInputInDiv(elementType: string, id: string, type: string): JQuery {
        let inputDiv: JQuery = this._appendDivToContainer()
        return this._appendInput(inputDiv, elementType, id, type)
    }

    private _appendInput(parent: JQuery, elementType: string, id: string, type: string): JQuery {
        return $(domElem(elementType))
        .attr('type', type)
        .attr('id', id)
        .appendTo(parent)
    }

    private _appendDivToContainer(): JQuery {
        return $(domElem('div'))
            .appendTo(this._$container)
    }

    private _updateFields() {
        let combinedTeam: CombinedTeam = this._options.combinedTeam
        let teams = _.convertArrayToList(combinedTeam.teams)

        this._$inputCombinedName.val(combinedTeam.combinedName)
        this._$inputTeams.val(teams)
        this._$inputStartingSprint.val(`${combinedTeam.startingSprint}`)
    }

    public getTitle(): string {
        return this._options.title
    }

    public onOkClick(): any {
        let combinedName = $.trim(this._$inputCombinedName.val())
        let startingSprint = +$.trim(this._$inputStartingSprint.val())
        let teams: string[] = this._$inputTeams.val().split(',')
        teams = this._trimEachElement(teams)

        this._combinedTeam = {
            combinedName: combinedName,
            teams: teams,
            startingSprint: startingSprint
        }
        this.processResult(this._combinedTeam)
    }

    private _trimEachElement(elements: string[]): string[] {
        let newElements: string[] = []
        for (let i = 0; i < elements.length; i++) {
            newElements.push($.trim(elements[i]))
        }
        return newElements
    }
}