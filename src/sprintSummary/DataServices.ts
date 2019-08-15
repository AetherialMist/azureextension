import Service = require('VSS/Service')
import Extension_Data = require('VSS/SDK/Services/ExtensionData')
import { SprintSummary, CombinedTeam } from './contracts'
import { SprintSummaryService } from './summaryServices'
import { CombinedTeamsService } from './combinedTeamsServices'

export class DataService extends Service.VssService {
    private static USER_LEVEL: string = 'User'
    private static SHARED_LEVEL: string = 'Default'
    private static LOADED: string = 'LOADED'
    private static FAILED: string = 'FAILED'

    private _servicesToLoad: number = 2
    private _servicesLoaded: number = 0
    private _successfulServicesLoaded: number = 0
    private _failedServicesLoaded: number = 0

    private _sprintSummaryService: SprintSummaryService
    private _combinedTeamService: CombinedTeamsService

    public static getUserLevel() {
        return DataService.USER_LEVEL
    }

    public static getSharedLevel() {
        return DataService.SHARED_LEVEL
    }

    /**
     * Any sub-servive that fails to load saved documents
     * will be loaded with an empty cache.
     */
    public async initService(): Promise<DataService> {
        let that = this
        return new Promise<DataService>((resolve, reject) => {
            this._loadData()
                .then((value: LoadStatus) => {
                    resolve(that)
                })
                .catch((reason: any) => {
                    reject(that)
                })
        })
    }

    public async refresh(): Promise<LoadStatus> {
        return this._loadData()
    }

    /**
     * Sets the local cache(s) to the saved values.
     * 
     * This method will always resolve its Promise.
     * Any sub-servive that fails to load will be
     * loaded with an empty cache.
     * 
     * Unsaved changes will be lost.
     */
    private async _loadData(): Promise<LoadStatus> {
        return new Promise<LoadStatus>((resolve, reject) => {
            this._loadService(resolve, this._loadSprintSummaryService())
            this._loadService(resolve, this._loadCombinedTeamsService())
        })
    }

    private _loadService(resolve: (status: LoadStatus) => void, promise: Promise<void>) {
        promise.then(() => {
            this._loadServicePromiseHelper(resolve, DataService.LOADED)
        }).catch((reason: any) => {
            this._loadServicePromiseHelper(resolve, DataService.FAILED)
        })
    }

    private async _loadSprintSummaryService(): Promise<void> {
        let that = this
        return new Promise<void>((resolve, reject) => {
            let sprintSummaryCollectionName: string = SprintSummaryService.getSprintSummaryCollectionName()
            that.getDocuments<SprintSummary>(sprintSummaryCollectionName, DataService.USER_LEVEL)
                .then((value: SprintSummary[]) => {
                    that._sprintSummaryService = new SprintSummaryService(that, value)
                    resolve()
                })
                .catch((reason: any) => {
                    that._sprintSummaryService = new SprintSummaryService(that, [])
                    reject(reason)
                })
        })
    }

    private async _loadCombinedTeamsService(): Promise<void> {
        let that = this
        return new Promise<void>((resolve, reject) => {
            let combinedTeamCollectionName: string = CombinedTeamsService.getCombinedTeamsCollectionName()
            that.getDocuments<CombinedTeam>(combinedTeamCollectionName, DataService.SHARED_LEVEL)
                .then((value: CombinedTeam[]) => {
                    that._combinedTeamService = new CombinedTeamsService(that, value)
                    resolve()
                })
                .catch((reason: any) => {
                    that._combinedTeamService = new CombinedTeamsService(that, [])
                    reject(reason)
                })
        })
    }

    private _loadServicePromiseHelper(resolve: (loadStatus: LoadStatus) => void, status: string): void {
        this._servicesLoaded++

        if (status === DataService.LOADED) {
            this._successfulServicesLoaded++
        }
        else if (status === DataService.FAILED) {
            this._failedServicesLoaded++
        }

        if (this._servicesLoaded === this._servicesToLoad) {
            resolve({ success: this._successfulServicesLoaded, failed: this._failedServicesLoaded })
        }
    }

    // === Wrappers ===

    public getLastSavedSprintSummaries(): SprintSummary[] {
        return this._sprintSummaryService.getLastSavedSprintSummaries()
    }

    public setSavedSprintSummaries(sprintSummaries: SprintSummary[]): void {
        this._sprintSummaryService.setSavedSprintSummaries(sprintSummaries)
    }

    public getCachedCombinedTeams(): CombinedTeam[] {
        return this._combinedTeamService.getCachedCombinedTeams()
    }

    public addCombinedTeam(combinedTeam: CombinedTeam, callback: () => void): void {
        this._combinedTeamService.addCombinedTeam(combinedTeam, callback)
    }

    public deleteCombinedTeam(combinedTeam: CombinedTeam, callback: () => void): void {
        this._combinedTeamService.deleteCombinedTeam(combinedTeam, callback)
    }

    public updateCombinedTeam(original: CombinedTeam, edited: CombinedTeam, callback: () => void): void {
        this._combinedTeamService.updateCombinedTeam(original, edited, callback)
    }

    // === Services ===

    public deleteDocument(collectionName: string, doc: any, scope: string): Promise<void> {
        return new Promise((resolve, reject) => {
            let documentOptions = { scopeType: scope }
            this._getDataService()
                .then((dataService) => {
                    dataService.deleteDocument(collectionName, doc.id, documentOptions).then(
                        () => {
                            resolve()
                        },
                        (reason: any) => {
                            reject(reason)
                        }
                    )
                })
                .catch((reason: any) => {
                    reject(reason)
                })
        })
    }

    public createDocument<T>(collectionName: string, doc: T, scope: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let documentOptions = { scopeType: scope }
            this._getDataService()
                .then((dataService) => {
                    dataService.createDocument(collectionName, doc, documentOptions).then(
                        (savedDoc: T) => {
                            resolve(savedDoc)
                        },
                        (reason: any) => {
                            reject(reason)
                        }
                    )
                })
                .catch((reason: any) => {
                    reject(reason)
                })
        })
    }

    public getDocuments<T>(collectionName: string, scope: string): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            let scopeType = { scopeType: scope }
            this._getDataService()
                .then((dataService: Extension_Data.ExtensionDataService) => {
                    dataService.getDocuments(collectionName, scopeType).then(
                        (value: T[]) => {
                            resolve(value)
                        },
                        (reason: any) => {
                            reject(reason)
                        }
                    )
                })
                .catch((reason: any) => {
                    reject(reason)
                })
        })
    }

    /**
     * Saves the key-value pair at the user level.
     * 
     * If the key does not exist, it will be added.
     * 
     * @param key the key of the key-value pair.
     * @param value the value of the key-value pair.
     */
    public saveUserValue<T>(key: string, value: T): Promise<T> {
        return this._saveValue(key, value, DataService.USER_LEVEL)
    }

    /**
     * Saves the key-value pair at the shared level.
     * 
     * If the key does not exist, it will be added.
     * 
     * @param key the key of the key-value pair.
     * @param value the value of the key-value pair.
     */
    public saveSharedValue<T>(key: string, value: T): Promise<T> {
        return this._saveValue(key, value, DataService.SHARED_LEVEL)
    }

    /**
     * Saves the key-value pair at the specified scope.
     * 
     * If the key does not exist, it will be added.
     * 
     * @param key the key of the key-value pair.
     * @param value the value of the key-value pair.
     * @param scope the scope that the key-value pair is stored.
     */
    private _saveValue<T>(key: string, value: T, scope: string): Promise<T> {
        return new Promise((resolve, reject) => {
            let documentOptions = { scopeType: scope }
            this._getDataService()
                .then((dataService) => {
                    dataService.setValue(key, value, documentOptions).then(
                        (value: T) => {
                            resolve(value)
                        },
                        (reason: any) => {
                            reject(reason)
                        }
                    )
                })
                .catch((reason: any) => {
                    reject(reason)
                })
        })
    }

    /**
     * Gets the value of the key-value pair stored within the user scope.
     * 
     * @param key the key of the key-value pair.
     */
    public async getSavedUserValue<T>(key: string): Promise<any> {
        return this._getSavedValue<T>(key, DataService.USER_LEVEL)
    }

    /**
     * Gets the value of the key-value pair stored within the shared scope.
     * 
     * @param key the key of the key-value pair.
     */
    public async getSavedSharedValue<T>(key: string): Promise<any> {
        return this._getSavedValue<T>(key, DataService.SHARED_LEVEL)
    }

    /**
     * Gets the value of the key-value pair stored within the given scope.
     * 
     * @param key the key of the key-value pair
     * @param scope the scope where the key-value pair is stored.
     */
    private async _getSavedValue<T>(key: string, scope: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let documentOptions = { scopeType: scope }
            this._getDataService().then((dataService) => {
                dataService.getValue<T>(key, documentOptions).then(
                    (value: T) => {
                        resolve(value)
                    },
                    (reason: any) => {
                        reject(reason)
                    }
                )
            }).catch((reason: any) => {
                reject(reason)
            })
        })
    }

    /**
     * Gets the Extension_Data.ExtensionDataService
     */
    private async _getDataService(): Promise<Extension_Data.ExtensionDataService> {
        return VSS.getService(VSS.ServiceIds.ExtensionData) as Promise<Extension_Data.ExtensionDataService>
    }
}

export type LoadStatus = {
    success: number,
    failed: number
}