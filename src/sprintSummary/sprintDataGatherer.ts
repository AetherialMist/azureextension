/// <reference path='../../node_modules/vss-web-extension-sdk/typings/vss.d.ts' />
import { RestHandler } from './restHandler'
import { WorkItem } from 'TFS/WorkItemTracking/Contracts'
import { TeamSettingsIteration } from 'TFS/Work/Contracts'
import { SprintData, WorkItemBrief } from './contracts'
import * as _ from './lodashSub'
import * as moment from './dateFormatter'

export class DataGatherer {

    private static allProjectSprintData: SprintData[][] = []

    public static getAllProjectSprintData(): SprintData[][] {
        return DataGatherer.allProjectSprintData
    }

    private requestHandler: RestHandler = new RestHandler()
    private fields: string[] = ['System.Id', 'System.AreaPath', 'System.State']
    private BlockSize: number = 200

    public async getSprintDataForProjects(info: { project: string, team: string }[]) {
        let allProjectSprintData: SprintData[][] = []
        for (let i = 0; i < info.length; i++) {
            let projectSprintData: SprintData[] = await this.getSprintDataForProject(info[i].project, info[i].team)
            allProjectSprintData.push(projectSprintData)
        }
        DataGatherer.allProjectSprintData = allProjectSprintData
        return allProjectSprintData
    }

    private async getSprintDataForProject(project: string, team: string): Promise<SprintData[]> {
        let allSprintData: SprintData[] = []
        let teamSettingsIterations: TeamSettingsIteration[] = await this.requestHandler.getTeamSettingsIterations(project, team)

        for (let i = 0; i < teamSettingsIterations.length; i++) {
            let sprintData: SprintData = await this.transformTeamSettingsItteration(teamSettingsIterations[i])
            allSprintData.push(sprintData)
        }
        return allSprintData
    }

    private async transformTeamSettingsItteration(teamSettingsIteration: TeamSettingsIteration): Promise<SprintData> {
        let nameParts = teamSettingsIteration.name.split(' ')
        let sprintNumber = +nameParts[1]

        // Reason for adding one day: The first day of a sprint is spent planning and choosing
        // what to commit to. So by getting the time at ~midnight the next day, any planned comits
        // should be posted by then.
        let startDate = moment.formatDate(teamSettingsIteration.attributes.startDate, 1)
        let finishDate = moment.formatDate(teamSettingsIteration.attributes.finishDate)

        let sprintData: SprintData = {
            sprintNumber: sprintNumber,
            path: teamSettingsIteration.path,
            startDateTime: startDate,
            finishDateTime: finishDate
        }

        await this.updateCommittedSprintData(sprintData)
        await this.updateCompletedSprintData(sprintData)
        await this.updateAllCompletedSprintData(sprintData)

        return sprintData
    }

    // === Committed ===

    private async updateCommittedSprintData(sprintData: SprintData): Promise<void> {
        let committedWorkItems: WorkItemBrief[] = await this.getCommittedWorkItems(sprintData)
        sprintData.committedIDs = _.map(committedWorkItems, 'id')
        sprintData.committedByTeam = _.countBy(committedWorkItems, 'team')
    }

    private async getCommittedWorkItems(sprintData: SprintData): Promise<WorkItemBrief[]> {
        let allIDs: number[] = await this.getCommittedIDs(sprintData)
        let idBlocks: number[][] = this.breakIntoBlocks(allIDs, this.BlockSize)
        let workItemBriefs: WorkItemBrief[] = await this.getWorkItemBriefsByBlocks(idBlocks)
        return workItemBriefs
    }

    private async getCommittedIDs(sprintData: SprintData): Promise<number[]> {
        let query: string = `Select [Id] From WorkItems ` +
            `Where ([Work Item Type] = 'Bug' OR [Work Item Type] = 'User Story') ` +
            `AND [Iteration Path] UNDER '${sprintData.path}' ASOF '${sprintData.startDateTime}'`
        let ids = await this.requestHandler.getWorkItemIDsByWiql(query)
        return ids
    }

    // === Completed ===

    private async updateCompletedSprintData(sprintData: SprintData): Promise<void> {
        let completedWorkItems: WorkItemBrief[] = await this.getCompletedWorkItems(sprintData)
        sprintData.completedIDs = _.map(completedWorkItems, 'id')
        sprintData.completedByTeam = _.countBy(completedWorkItems, 'team')
    }

    private async getCompletedWorkItems(sprintData: SprintData): Promise<WorkItemBrief[]> {
        let asOf: string = sprintData.finishDateTime
        let committedIDs: number[] = sprintData.committedIDs
        let idBlocks: number[][] = this.breakIntoBlocks(committedIDs, this.BlockSize)

        let filter = (workItems: WorkItem[]) => {
            let newWorkItems: WorkItem[] = []
            workItems.forEach((workItem: WorkItem) => {
                let state = workItem.fields['System.State']
                let shouldPush = state == 'Closed' || state == 'Resolved' || state == 'Removed'

                if (shouldPush) {
                    newWorkItems.push(workItem)
                }
            })
            return newWorkItems
        }
        let allWorkItemBriefs: WorkItemBrief[] = await this.getWorkItemBriefsByBlocks(idBlocks, asOf, filter)
        return allWorkItemBriefs
    }

    // === AllCompleted ===

    private async updateAllCompletedSprintData(sprintData: SprintData): Promise<void> {
        let allCompletedWorkItems: WorkItemBrief[] = await this.getAllCompletedWorkItems(sprintData)
        sprintData.allCompletedIDs = _.map(allCompletedWorkItems, 'id')
        sprintData.allCompletedByTeam = _.countBy(allCompletedWorkItems, 'team')
    }

    private async getAllCompletedWorkItems(sprintData: SprintData): Promise<WorkItemBrief[]> {
        let asOf: string = sprintData.finishDateTime
        let allCompletedIDs: number[] = await this.getAllCompletedIDs(sprintData)
        let idBlocks: number[][] = this.breakIntoBlocks(allCompletedIDs, this.BlockSize)
        let allWorkItemBriefs: WorkItemBrief[] = await this.getWorkItemBriefsByBlocks(idBlocks, asOf)
        return allWorkItemBriefs
    }

    private async getAllCompletedIDs(sprintData: SprintData): Promise<number[]> {
        let query: string = `Select [Id] From WorkItems ` +
            `Where ([Work Item Type] = 'Bug' OR [Work Item Type] = 'User Story') ` +
            `AND ([State] = 'Closed' OR [State] = 'Resolved') ` +
            `AND [Iteration Path] UNDER '${sprintData.path}' ASOF '${sprintData.finishDateTime}'`
        let ids: number[] = await this.requestHandler.getWorkItemIDsByWiql(query)
        return ids
    }

    // === Shared Utility ===

    private async getWorkItemBriefsByBlocks(idBlocks: number[][], asOf: any = undefined, filterFunction: (workItems: WorkItem[]) => WorkItem[] = undefined): Promise<WorkItemBrief[]> {
        let allWorkItemBriefs: WorkItemBrief[] = []
        for (let i = 0; i < idBlocks.length; i++) {
            let workItems: WorkItem[] = await this.requestHandler.getWorkItemsByID(idBlocks[i], this.fields, asOf)
            if (filterFunction) {
                workItems = filterFunction(workItems)
            }
            let workItemBriefs: WorkItemBrief[] = this.transformWorkItems(workItems)
            allWorkItemBriefs = allWorkItemBriefs.concat(workItemBriefs)
        }
        return allWorkItemBriefs
    }

    private transformWorkItems(workItems: WorkItem[]): WorkItemBrief[] {
        let workItemBriefs: WorkItemBrief[] = []
        workItems.forEach((workItem: WorkItem) => {
            let areaPath = workItem.fields['System.AreaPath']
            let team = this.getTeamName(areaPath)
            workItemBriefs.push({ 'id': workItem.id, 'team': team })
        })
        return workItemBriefs
    }

    private breakIntoBlocks(arr: any[], size: number): any[][] {
        let blocks: any[][] = []
        let currentBlockSize = 0
        let currentIndex = 0

        while (arr[currentIndex]) {
            let block: any[] = []

            currentBlockSize = 0
            while (arr[currentIndex] && currentBlockSize < size) {
                block.push(arr[currentIndex])
                currentIndex++
                currentBlockSize++
            }

            blocks.push(block)
        }
        return blocks
    }

    /**
     * @param areaPath 
     */
    private getTeamName(areaPath: string): string {
        let areaPathParts = areaPath.split('\\')
        return areaPathParts[1]
    }
}