import { DataService } from './DataServices'
import { SprintSummary } from './contracts'

export class SprintSummaryService {
    private static SPRINT_SUMMARY_COLLECTION_NAME: string = 'SprintSummaries'
    private _toDelete: number
    private _deletedSoFar: number

    public static getSprintSummaryCollectionName(): string {
        return SprintSummaryService.SPRINT_SUMMARY_COLLECTION_NAME
    }

    private _dataService: DataService = new DataService()
    private _lastSavedSprintSummaries: SprintSummary[] = []

    public constructor(dataServiceHandler: DataService, cachedSummaries: SprintSummary[]) {
        this._dataService = dataServiceHandler
        this._lastSavedSprintSummaries = cachedSummaries
    }

    public getLastSavedSprintSummaries(): SprintSummary[] {
        return this._lastSavedSprintSummaries
    }

    public setSavedSprintSummaries(sprintSummaries: SprintSummary[]): void {
        if (this._lastSavedSprintSummaries.length === 0) {
            this._createAllSprintSummaries(sprintSummaries)
        } else {
            this._deleteAllSavedSprintSummaries(() => {
                this._createAllSprintSummaries(sprintSummaries)
            })
        }
    }

    private _deleteAllSavedSprintSummaries(callback: () => void): void {
        this._toDelete = this._lastSavedSprintSummaries.length
        this._deletedSoFar = 0

        // Use a copy of the array, not the actual array!
        let copyOfCachedSprintSummaries: SprintSummary[] = []

        this._lastSavedSprintSummaries.forEach((cachedSprintSummary: SprintSummary) => {
            copyOfCachedSprintSummaries.push(cachedSprintSummary)
        })

        copyOfCachedSprintSummaries.forEach((copy) => {
            this._deleteSprintSummary(copy, callback)
        })
    }

    private _deleteSprintSummary(sprintSummary: SprintSummary, callback: () => void) {
        this._dataService.deleteDocument(SprintSummaryService.SPRINT_SUMMARY_COLLECTION_NAME, sprintSummary, DataService.getUserLevel())
            .then(() => {
                this._removeCachedSprintSummary(sprintSummary)
                this._deleteAllCallbackCounter(callback)
            })
    }

    private _deleteAllCallbackCounter(callback: () => void) {
        this._deletedSoFar++
        if (this._deletedSoFar === this._toDelete) {
            callback()
        }
    }

    private _removeCachedSprintSummary(toRemove: SprintSummary): void {
        let newSprintSummaries: SprintSummary[] = []
        this._lastSavedSprintSummaries.forEach((cached) => {
            if (cached.id !== toRemove.id) {
                newSprintSummaries.push(cached)
            }
        })
        this._lastSavedSprintSummaries = newSprintSummaries
    }

    private _createAllSprintSummaries(sprintSummaries: SprintSummary[]): void {
        sprintSummaries.forEach((sprintSummary) => {
            this._createSprintSummary(sprintSummary)
        })
    }

    private _createSprintSummary(sprintSummary: SprintSummary): void {
        sprintSummary.__etag = -1
        this._dataService.createDocument(SprintSummaryService.SPRINT_SUMMARY_COLLECTION_NAME, sprintSummary, DataService.getUserLevel())
            .then((savedSprintSummary) => {
                this._addCachedSprintSummary(savedSprintSummary)
            })

    }

    private _addCachedSprintSummary(sprintSummary: SprintSummary): void {
        this._lastSavedSprintSummaries.push(sprintSummary)
    }
}