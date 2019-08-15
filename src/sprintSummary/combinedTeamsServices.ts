import { CombinedTeam } from './contracts'
import { DataService } from './DataServices'

export class CombinedTeamsService {

    private static COMBINED_TEAMS_COLLECTION_NAME: string = 'CombinedTeams'

    public static getCombinedTeamsCollectionName(): string {
        return CombinedTeamsService.COMBINED_TEAMS_COLLECTION_NAME
    }

    private _dataService: DataService
    private _cachedCombinedTeams: CombinedTeam[] = []

    public constructor(dataService: DataService, cachedCombinedTeams: CombinedTeam[]) {
        this._dataService = dataService
        this._cachedCombinedTeams = cachedCombinedTeams
    }

    public getCachedCombinedTeams(): CombinedTeam[] {
        return this._cachedCombinedTeams
    }

    public updateCombinedTeam(originalCombinedTeam: CombinedTeam, editedCombinedTeam: CombinedTeam, callback: () => void): void {
        editedCombinedTeam.id = originalCombinedTeam.id
        editedCombinedTeam.__etag = originalCombinedTeam.__etag
        this.deleteCombinedTeam(originalCombinedTeam, () => {
            this.addCombinedTeam(editedCombinedTeam, () => {
                callback()
            })
        })
    }

    public addCombinedTeam(combinedTeam: CombinedTeam, callback: () => void): void {
        this._dataService.createDocument(CombinedTeamsService.COMBINED_TEAMS_COLLECTION_NAME, combinedTeam, DataService.getSharedLevel())
            .then((savedCombinedTeam) => {
                this._addCachedCombinedTeam(savedCombinedTeam)
                callback()
            })
    }

    public deleteCombinedTeam(combinedTeam: CombinedTeam, callback: () => void): void {
        this._dataService.deleteDocument(CombinedTeamsService.COMBINED_TEAMS_COLLECTION_NAME, combinedTeam, DataService.getSharedLevel())
            .then(() => {
                this._removeCachedCombinedTeam(combinedTeam)
                callback()
            })
    }

    private _addCachedCombinedTeam(combinedTeam: CombinedTeam): void {
        this._cachedCombinedTeams.push(combinedTeam)
    }

    private _removeCachedCombinedTeam(toRemove: CombinedTeam): void {
        let newCombinedTeams: CombinedTeam[] = []
        this._cachedCombinedTeams.forEach((cached) => {
            if (cached.id !== toRemove.id) {
                newCombinedTeams.push(cached)
            }
        })
        this._cachedCombinedTeams = newCombinedTeams
    }
}