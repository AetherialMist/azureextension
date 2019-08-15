import Service = require('VSS/Service')
import WitClient = require('TFS/WorkItemTracking/RestClient')
import WorkClient = require('TFS/Work/RestClient')
import CoreClient = require('TFS/Core/RestClient')
import { TeamContext, TeamProjectReference } from 'TFS/Core/Contracts'
import { TeamSettingsIteration } from 'TFS/Work/Contracts'
import { WorkItem, WorkItemType, Wiql, WorkItemQueryResult, WorkItemReference } from 'TFS/WorkItemTracking/Contracts'

/**
 * A class to handle Rest API calls to the organization the extension is installed in
 * 
 * 
 * 
 * https://docs.microsoft.com/en-us/rest/api/azure/devops/?view=azure-devops-rest-5.0
 */
export class RestHandler {
    private witClient = Service.getCollectionClient(WitClient.WorkItemTrackingHttpClient4)
    private workClient = Service.getCollectionClient(WorkClient.WorkHttpClient4)
    private coreClient = Service.getCollectionClient(CoreClient.CoreHttpClient4)

    /**
     * Returns an array of all project names by the organization.
     */
    public async getProjectNames(): Promise<string[]> {
        let projectNames: string[] = []
        let projects: TeamProjectReference[] = []

        try {
            projects = await this.coreClient.getProjects()
        } catch (error) {
            console.log('Failed to retrieve TeamProjectReference[].')
        }

        projects.forEach((project) => {
            projectNames.push(project.name)
        })

        return projectNames
    }

    /**
     * @param project The name of the project
     */
    public async getWorkItemTypeNamesForProject(project: string): Promise<string[]> {
        let workItemTypeNames: string[] = []
        let workItemTypes: WorkItemType[] = []

        try {
            workItemTypes = await this.witClient.getWorkItemTypes(project)
        } catch (error) {
            console.log(`Failed to retrieve all work item types for ${project}.`)
        }

        workItemTypes.forEach((workItemType: WorkItemType) => {
            workItemTypeNames.push(workItemType.name)
        })

        return workItemTypeNames
    }

    /**
     * 
     * @param ids Array of WorkItem IDs
     * @param fields WorkItem fields to be included
     * @param asOf DateTime of WorkItem history to view
     */
    public async getWorkItemsByID(ids: number[], fields: string[], asOf: any = undefined): Promise<WorkItem[]> {
        let workItems: WorkItem[] = []

        try {
            workItems = await this.witClient.getWorkItems(ids, fields, asOf)
        } catch (error) {
            console.log(`Failed to retrieve work items.`)
        }

        return workItems
    }

    /**
     * wiqls have a limit of 20,000 on IDs returned.
     * 
     * Despite Microsoft documentation, Wiqls can only be used to get the ID field.
     * Regardless of which fields are included in the select clause, IDs will be the only
     * field returned (even if [Id] is excluded from the select clause).
     * 
     * example: getWorkItemIDsByWiql("Select [Id] From WorkItems Where [Work Item Type] = 'Bug'")
     * 
     * @param query the query as a string.
     */
    public async getWorkItemIDsByWiql(query: string): Promise<number[]> {
        let workItemReferences: WorkItemReference[] = []
        let ids: number[] = []
        let wiql: Wiql = {
            query: query
        }

        try {
            let workItemQueryResult: WorkItemQueryResult = await this.witClient.queryByWiql(wiql)
            workItemReferences = workItemQueryResult.workItems
        } catch (error) {
            console.log(`Failed to retrieve work items. query: ${query}`)
        }

        workItemReferences.forEach((workItemReference: WorkItemReference) => {
            ids.push(workItemReference.id)
        })
        
        return ids
    }

    /**
     * Returns an array of basic sprint information
     * for the given team and project.
     * 
     * If an error is thrown while retrieving the
     * iterations, an empty array will be returned
     * and a message printed to the console.
     * 
     * Use 'project' and 'team' using the example
     * url as a guide.
     * https://dev.azure.com/{tenent}/{project}/{team}/_apis/work/teamsettings/iterations
     * 
     * @param project the name of the project.
     * @param team the name of the team,
     */
    public async getTeamSettingsIterations(project: string, team: string): Promise<TeamSettingsIteration[]> {
        let sprintList: TeamSettingsIteration[] = []
        let teamContext: TeamContext = {
            project: project,
            projectId: undefined,
            team: team,
            teamId: undefined

        }

        try {
            sprintList = await this.workClient.getTeamIterations(teamContext)
        } catch (error) {
            console.log(`Failed to retrieve TeamSettingsIteration[].`)
        }

        return sprintList
    }


}