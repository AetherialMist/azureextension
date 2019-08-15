This project uses outdated versions of Typescript and the vss-web-extension-sdk.
This is because of typing conflicts with the newest versions (as of Aug 12, 2019).
An issue was posted to microsoft's git regarding this back in Oct 12, 2018,
and has yet to be resolved (this issue even referenced older versions than current).
The "fixes" that many devs have found is to manually change type files (".d.ts") inside the
node_modules directory. Those changes would be lost whenever a clean install is
performed though.

# Sprint Summary

###Refresh Sprint Data functionality:

Refresh Sprint Data clicked -> gather all raw sprint data for selected projects
-> summarize gathered sprint data -> update displayed information

This process can take up to several minutes, as many rest api calls are made.

###Some notable comments on api calls:
- wiqls can only get work item IDs. Microsoft documentation says otherwise. However,
this has been a known "problem" for over a year, and Microsoft has not changed anything.
- wiqls can only retrieve up to 20,000 IDs per request
- witClient (work item tracking) can only retrieve up to 200 detailed work items per request.
So if a wiql is made and a potential 20,000 work item IDs are returned. In order to get all
20,000 detailed work items, the IDs will need to be broken down into 100 blocks of 200 IDs for the
witClient calls.
- Microsoft uses a different date-time format than javascript. The second javascript interprets
any variable as a Date object, javascript converts the variable to javascript date-time format.
This causes problems with any rest clients using as "asOf" paramerter that expects a Date obejct.
Since they expect a Microsoft formatted Date object. This was avoided by converting a javascript
Date object, to the equivalent Microsoft format and storing the result as a string (this prevents
javascript from converting the date-time information back into javascript format). Methods
requiring a Date parameter were instead passed the string version as "any". This is not the most
elegant tactic, but playing keep-away with javascript doesn't leave many choices.
- When retrieving the list of sprints for a project, sprints are created under "ProjectName Team".
So all Fusion sprints are under the team "Fusion Team". Even if the sprint is for a specific team
such as "Masterminds", the sprint is actually stored under "Fusion Team" when using the rest api.

###Timestamps of Sprints

- The first day of a sprint is spent planning and committing to work items. Because of this, the list
of committed items isn't accurrate until the second day (people need time to formalize their committed 
items on the first day). For this reason, the list of committed items is tracked starting from the second
day of the sprint.
 - Additional items committed to after this point are not counted in the committed category.
If they are completed during the given sprint, they will be counted under the AllCompelted category, otherwise
they will be added to the backlog and eventually completed during a different sprint (where they will also be
counted under the AllCompleted category).
- Completed work items for a sprint are considered any work items that were committed to specifically for
the given sprint during the planning day. If a team completes a work item from the backlog, that item is not
considered in the percent completed.

##Resources:
- Microsoft sample extensions: https://github.com/microsoft/vsts-extension-samples
- Azure Rest API: https://docs.microsoft.com/en-us/rest/api/azure/devops/?view=azure-devops-rest-4.1
- Develop Extensions: https://docs.microsoft.com/en-us/azure/devops/extend/?toc=%2Fazure%2Fdevops%2Fextend%2Ftoc.json&bc=%2Fazure%2Fdevops%2Fextend%2Fbreadcrumb%2Ftoc.json&view=azure-devops

###Setup:
- Clone repo using git.
- Open project in Visual Studio Code.
- In the terminal, run `npm install` then `npm run build` to build the project.

###To Publish
- Make sure the version number in the `vss-extension.json` has been incremented.
- Make sure the publisher field is correct. It should be the name of the account publishing this.
- build the project.
- In the visual studio marketplace as the publisher, publish/update the extension (the .vsix file).
- For additional guidance, look through the Develop Extensions Resourse listed in this readme.
