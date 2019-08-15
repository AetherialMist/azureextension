/**
 * teamData should be stored by regular indexing.
 * So that forEach and fori loops can be ran.
 * e.x. teamData[0] => (instance of TeamData)
 * 
 * 'id' and '__etag' are used for Document storing in the microsoft system
 */
export type SprintSummary = {
    sprintNumber: number,
    teamData: TeamData[],
    id?: string,
    __etag?: number
}

export type CombinedTeam = {
    combinedName: string,
    teams: string[],
    startingSprint: number,
    id?: string,
    __etag?: number
}

/**
 * Used strictly inside summarizer.ts
 * 
 * teamData should be stored by indexing with the team name.
 * So that entries can be refered to by their team name.
 * forEach and fori loops can NOT be ran when this method is used.
 * e.x. teamData['B Team'] => (instance of TeamData)
 */
export type HashedSprintSummary = {
    sprintNumber: number,
    hashedTeamData: TeamData[]
}

export type TeamData = {
    team: string,
    committed: number,
    completed: number,
    percentCompleted: number,
    allCompleted: number
}

export type SprintData = {
    sprintNumber: number,
    path: string,
    startDateTime: string,
    finishDateTime: string,
    committedIDs?: number[],
    committedByTeam?: any,
    completedIDs?: number[],
    completedByTeam?: any,
    allCompletedIDs?: number[],
    allCompletedByTeam?: any
}

export type WorkItemBrief = {
    'id': number,
    'team': string
}