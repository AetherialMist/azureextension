import { SprintData, TeamData, SprintSummary } from './contracts'
import * as _ from './lodashSub'

export class Summarizer {

    private static summarizedData: SprintSummary[] = []

    public static getSummarizedData(): SprintSummary[] {
        return Summarizer.summarizedData
    }

    /**
     * Takes in an array of SprintData arrays, where the first dimension is project and second dimension is by Sprint number.
     * Returns an array of SprintSummary, where the dimension is by Sprint number regardless of project. 
     * @param allProjectsSprintDataArrays 
     */
    public getSummarizedDataFromProjects(allProjectsSprintDataArrays: SprintData[][]): SprintSummary[] {
        let flattenedSprintData: SprintData[] = this.getFlattenedSprintData(allProjectsSprintDataArrays)

        let sprintSummaries: SprintSummary[] = this.getSummarizedData(flattenedSprintData)
        Summarizer.summarizedData = sprintSummaries
        return sprintSummaries
    }

    private getSummarizedData(flattenedSprintData: SprintData[]): SprintSummary[] {
        let groupedSprintNumber: SprintData[][] = this.groupBySprintNumber(flattenedSprintData)

        let sprintSummaries: SprintSummary[] = this.summarizeSprints(groupedSprintNumber)

        return sprintSummaries
    }

    private getFlattenedSprintData(allProjectsSprintData: SprintData[][]): SprintData[] {
        let flattenedSprintData: SprintData[] = []
        allProjectsSprintData.forEach((projectSprintData: SprintData[]) => {
            flattenedSprintData = flattenedSprintData.concat(projectSprintData)
        })
        return flattenedSprintData
    }

    private groupBySprintNumber(flattenedSprintData: SprintData[]): SprintData[][] {
        let groupedSprints: SprintData[][] = []
        let sprintNumbers: number[] = _.map(flattenedSprintData, 'sprintNumber')
        sprintNumbers = _.uniq(sprintNumbers)
        sprintNumbers.sort((a: number, b: number) => {
            return a - b
        })
        sprintNumbers.forEach((sprintNumber: number) => {
            let groupedSprint: SprintData[] = _.filter(flattenedSprintData, { 'sprintNumber': sprintNumber })
            groupedSprints.push(groupedSprint)
        })
        return groupedSprints
    }

    private summarizeSprints(groupedSprints: SprintData[][]): SprintSummary[] {
        let allSummaries: SprintSummary[] = []
        groupedSprints.forEach((groupedSprint) => {
            let sprintSummary = this.getSummary(groupedSprint)
            allSummaries.push(sprintSummary)
        })

        return allSummaries
    }

    private getSummary(sprintDataArray: SprintData[]): SprintSummary {
        return {
            sprintNumber: sprintDataArray[0].sprintNumber,
            teamData: this.getTeamData(sprintDataArray)
        }
    }

    private getTeamData(allSprintData: SprintData[]): TeamData[] {
        let allTeams: string[] = this.getAllTeams(allSprintData)
        let allTeamData: TeamData[] = []

        let allCommitedByTeams = {}
        let allCompletedByTeams = {}
        let allAllCompletedByTeams = {}

        allSprintData.forEach((sprintData: SprintData) => {
            /**
             * committedByTeam is an object such as { 'A Team': 3, 'B Team': 4 }
             * Object.assign assigns all the properties from 
             * committedByTeam into allCommitedByTeams
             */
            Object.assign(allCommitedByTeams, sprintData.committedByTeam)
            Object.assign(allCompletedByTeams, sprintData.completedByTeam)
            Object.assign(allAllCompletedByTeams, sprintData.allCompletedByTeam)
        })

        allTeams.forEach((team) => {
            let committed = allCommitedByTeams[team] ? allCommitedByTeams[team] : 0
            let completed = allCompletedByTeams[team] ? allCompletedByTeams[team] : 0
            let allCompleted = allAllCompletedByTeams[team] ? allAllCompletedByTeams[team] : 0
            let percentCompleted = committed !== 0 ? (completed / committed * 100) : 0

            allTeamData.push({
                team: team,
                committed: committed,
                completed: completed,
                percentCompleted: percentCompleted,
                allCompleted: allCompleted
            })
        })

        return allTeamData
    }

    private getAllTeams(allSprintData: SprintData[]): string[] {
        let allTeams: string[] = []

        allSprintData.forEach((sprintData: SprintData) => {
            let commitedTeams: string[] = []
            if (sprintData.committedByTeam) {
                commitedTeams = Object.keys(sprintData.committedByTeam)
            }

            let completedTeams: string[] = []
            if (sprintData.completedByTeam) {
                completedTeams = Object.keys(sprintData.completedByTeam)
            }

            let allCompletedTeams: string[] = []
            if (sprintData.allCompletedByTeam) {
                allCompletedTeams = Object.keys(sprintData.allCompletedByTeam)
            }

            allTeams = allTeams.concat(commitedTeams, completedTeams, allCompletedTeams)
            allTeams = _.uniq(allTeams)
        })

        return allTeams
    }

}