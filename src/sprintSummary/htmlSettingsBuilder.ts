import { SharedData } from "./sharedData";


export class SettingsBuilder {
    private static MAX_OPTIONS_PER_COLUMN = 6;

    private _data: SharedData

    public constructor(data: SharedData) {
        this._data = data
    }

    public buildSettingsContainer(): void {
        this._buildLeftSettings()
        this._buildRightSettings()
    }

    private _buildLeftSettings(): void {
        let leftSettings: HTMLDivElement = document.getElementById('left-settings') as HTMLDivElement
        let columnGroup: HTMLDivElement = this._appendColumnGroup(leftSettings)

        this._appendProjectOptions(columnGroup)
        this._appendButtonInDiv(leftSettings, 'Refresh Sprint Data', 'refresh-sprint-data')
        this._appendParagraph(leftSettings, 'refresh-sprint-data-status')
    }

    private _buildRightSettings(): void {
        let rightSettings: HTMLDivElement = document.getElementById('right-settings') as HTMLDivElement
        let columnGroup: HTMLDivElement = this._appendColumnGroup(rightSettings)

        this._appendColumnOptions(columnGroup)
        this._appendTeamOptions(columnGroup)
        this._appendSprintRangeOptions(columnGroup)
        this._appendButtonInDiv(rightSettings, 'Refresh Table', 'refresh-table')
        this._appendParagraph(rightSettings, 'refresh-table-status')

        this.refreshTeamColumn()
    }

    private _appendProjectOptions(parentDiv: HTMLDivElement) {
        this._appendOptions(parentDiv, 'Projects', this._data.projectCheckboxSuffix, this._data.availableProjects, this._data.storedSelectedProjects)
    }

    private _appendColumnOptions(parentDiv: HTMLDivElement) {
        this._appendOptions(parentDiv, 'Columns', this._data.columnsCheckboxSuffix, this._data.availableColumns, this._data.storedSelectedColumns)
    }

    private _appendTeamOptions(parentDiv: HTMLDivElement) {
        this._appendOptions(parentDiv, 'teams', this._data.teamsCheckboxSuffix, this._data.availableTeams, this._data.storedSelectedTeams)
    }

    private _appendSprintRangeOptions(parentDiv: HTMLDivElement) {
        let columnDiv: HTMLDivElement = this._createColumnDiv('sprint-range')
        parentDiv.appendChild(columnDiv)

        this._appendHeader2InDiv(columnDiv, 'Sprint Range')

        let sectionDiv: HTMLDivElement = this._appendSectionDiv(columnDiv)
        columnDiv.appendChild(sectionDiv)

        this._appendNumberOption(sectionDiv, 'Min', 'sprint-min')
        let min: HTMLInputElement = document.getElementById('sprint-min') as HTMLInputElement
        min.value = `${this._data.startingSprint}`

        this._appendBreak(sectionDiv)
        this._appendNumberOption(sectionDiv, 'Max', 'sprint-max')
        let max: HTMLInputElement = document.getElementById('sprint-max') as HTMLInputElement
        max.value = `${this._data.endingSprint}`
    }

    public refreshTeamColumn(): void {
        let teamsChanged: boolean = this._data.refreshAvailableTeams()

        if (teamsChanged) {
            this._replaceTeamDiv()
        }
    }

    private _replaceTeamDiv() {
        let oldSelectedTeams: string[] = this.getCheckedTeams()

        let oldTeamDiv: HTMLDivElement = document.getElementById('teams-div') as HTMLDivElement
        let newTeamDiv: HTMLDivElement = this._createCheckboxColumn('teams', this._data.teamsCheckboxSuffix, this._data.availableTeams)
        let parentEle = oldTeamDiv.parentNode

        parentEle.replaceChild(newTeamDiv, oldTeamDiv)

        this._checkItems(oldSelectedTeams, this._data.teamsCheckboxSuffix)
    }

    // ===

    private _appendOptions(parentDiv: HTMLDivElement, title: string, suffix: string, available: string[], toCheck: string[]): void {
        let div: HTMLDivElement = this._createCheckboxColumn(title, suffix, available)
        parentDiv.appendChild(div)
        this._checkItems(toCheck, suffix)
    }

    private _createCheckboxColumn(title: string, suffix: string, items: string[]): HTMLDivElement {
        items = items.sort()

        let columnDiv: HTMLDivElement = this._createColumnDiv(title)
        this._appendHeader2InDiv(columnDiv, title)
        this._appendAllCheckboxSections(columnDiv, items, suffix)

        return columnDiv
    }

    private _appendAllCheckboxSections(columnDiv: HTMLDivElement, items: string[], suffix: string) {
        let sectionDiv: HTMLDivElement

        for (let i = 0; i < items.length; i++) {
            if (i % SettingsBuilder.MAX_OPTIONS_PER_COLUMN === 0) {
                sectionDiv = this._appendSectionDiv(columnDiv)
            }

            this._appendCheckboxOption(sectionDiv, items[i], suffix)
            this._appendBreak(sectionDiv)
        }
    }

    private _checkItems(items: string[], suffix: string): void {
        items.forEach((item: string) => {
            let checkboxID: string = this._data.getElementID(item, suffix)
            try {
                let checkbox: HTMLInputElement = document.getElementById(checkboxID) as HTMLInputElement
                if (checkbox) {
                    checkbox.checked = true
                }
            } catch (error) {
                console.log(`HTMLElement was not an HTMLInputElement`)
            }
        })
    }

    // === Get Options ===

    public getCheckedProjects(): string[] {
        return this._getCheckedItems(this._data.availableProjects, this._data.projectCheckboxSuffix)
    }

    public getCheckedTeams(): string[] {
        return this._getCheckedItems(this._data.availableTeams, this._data.teamsCheckboxSuffix)
    }

    public getCheckedColumns(): string[] {
        return this._getCheckedItems(this._data.availableColumns, this._data.columnsCheckboxSuffix)
    }

    private _getCheckedItems(items: string[], suffix: string): string[] {
        let checkedItems = []
        items.forEach((item: string) => {
            let checkboxID: string = this._data.getElementID(item, suffix)
            let checkbox: HTMLInputElement = document.getElementById(checkboxID) as HTMLInputElement
            if (checkbox) {
                let checked: boolean = checkbox.checked
                if (checked) {
                    checkedItems.push(item)
                }
            }
        })
        return checkedItems
    }

    public getSprintRange(): { starting: number, ending: number } {
        let startText = document.getElementById('sprint-min') as HTMLInputElement
        let endText = document.getElementById('sprint-max') as HTMLInputElement
        return { starting: +startText.value, ending: +endText.value }
    }

    // === HTMLElements ===

    private _appendParagraph(parentDiv: HTMLDivElement, id?: string): HTMLParagraphElement {
        let para: HTMLParagraphElement = document.createElement('p')
        if (id) {
            para.id = id
        }
        parentDiv.appendChild(para)
        return para
    }

    private _appendColumnGroup(parentDiv: HTMLDivElement): HTMLDivElement {
        let div: HTMLDivElement = this._createDiv('column-group')
        parentDiv.appendChild(div)
        return div
    }

    private _appendButtonInDiv(parentDiv: HTMLDivElement, title: string, id: string): HTMLDivElement {
        let div: HTMLDivElement = this._createDiv('button-div')
        parentDiv.appendChild(div)

        this._appendButton(div, title, id)
        return div
    }

    private _createColumnDiv(title: string): HTMLDivElement {
        title = title.replace(' ', '-')
        return this._createDiv('column-div', title)
    }

    private _appendSectionDiv(parentDiv: HTMLDivElement): HTMLDivElement {
        let div: HTMLDivElement = this._createDiv('section-div')
        parentDiv.appendChild(div)
        return div
    }

    private _appendHeader2InDiv(parentDiv: HTMLDivElement, title: string) {
        let headerDiv: HTMLDivElement = this._createDiv()
        this._appendHeader2(headerDiv, title)
        parentDiv.appendChild(headerDiv)
    }

    private _appendCheckboxOption(parentDiv: HTMLDivElement, item: string, suffix: string): HTMLLabelElement {
        let label: HTMLLabelElement = document.createElement('label')
        parentDiv.appendChild(label)

        let checkbox: HTMLInputElement = document.createElement('input')
        checkbox.id = this._data.getElementID(item, suffix)
        checkbox.type = 'checkbox'
        label.appendChild(checkbox)
        label.innerHTML = `${label.innerHTML}${item}`

        return label
    }

    private _appendNumberOption(parentDiv: HTMLDivElement, title: string, id: string): HTMLLabelElement {
        let label: HTMLLabelElement = document.createElement('label')
        parentDiv.appendChild(label)

        let input: HTMLInputElement = document.createElement('input')
        label.appendChild(input)
        input.type = 'number'
        input.id = id

        label.innerHTML = `${label.innerHTML}${title}`
        return label
    }

    private _createDiv(cssClass?: string, title?: string): HTMLDivElement {
        let div: HTMLDivElement = document.createElement('div')
        if (cssClass) {
            div.className = cssClass
        }
        if (title) {
            div.id = this._data.getElementID(title, 'div')
        }
        return div
    }

    private _appendHeader2(parentDiv: HTMLDivElement, title: string): HTMLHeadingElement {
        let header: HTMLHeadingElement = document.createElement('h2')
        header.innerHTML = title
        parentDiv.appendChild(header)

        return header
    }

    private _appendButton(parentDiv: HTMLDivElement, title: string, id: string): HTMLInputElement {
        let button: HTMLInputElement = document.createElement('input')
        button.id = id
        button.className = 'button'
        button.type = 'button'
        button.value = title
        parentDiv.appendChild(button)
        return button
    }

    private _appendBreak(parentDiv: HTMLDivElement): void {
        parentDiv.appendChild(document.createElement('br'))
    }
}