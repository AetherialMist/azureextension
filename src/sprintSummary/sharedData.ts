import { SprintSummary, CombinedTeam, TeamData } from './contracts'
import * as _ from './lodashSub'

export class SharedData {

    public projectCheckboxSuffix: string = 'projects-checkbox'
    public teamsCheckboxSuffix: string = 'teams-checkbox'
    public columnsCheckboxSuffix: string = 'columns-checkbox'

    public settingsKey: string = 'settingskey'

    public availableProjects: string[] = []
    public availableColumns: string[] = []
    public availableTeams: string[] = []

    public storedSprintSummaries: SprintSummary[] = []
    public storedCombinedTeams: CombinedTeam[] = []
    
    public storedSelectedProjects: string[] = []
    public storedSelectedColumns: string[] = []
    public storedSelectedTeams: string[] = []

    public _pageContainer: HTMLDivElement
    public _optionsContainer: HTMLDivElement

    public startingSprint: number
    public endingSprint: number

    public getElementID(item: string, suffix: string): string {
        return `${item}-${suffix}`
    }

    public refreshAvailableTeams(): boolean {
        let changed: boolean = false
        let teamHash = []
        let teams: string[] = []

        this.storedSprintSummaries.forEach((sprintSummary: SprintSummary) => {
            sprintSummary.teamData.forEach((teamData: TeamData) => {
                let teamName = teamData.team
                if (!teamHash[teamName]) {
                    teamHash[teamName] = teamName
                    teams.push(teamName)
                }
            })
        })

        let combinedTeams: CombinedTeam[] = this.storedCombinedTeams
        combinedTeams.forEach( (combinedTeam) => {
            teams.push(combinedTeam.combinedName)
        })
        teams = _.uniq(teams)

        if (!_.contentsMatch(teams, this.availableTeams)) {
            changed = true
            this.availableTeams = teams
        }
        return changed
    }
}