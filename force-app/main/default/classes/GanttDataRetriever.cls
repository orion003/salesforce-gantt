public with sharing class GanttDataRetriever {

    @RemoteAction
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getGanttData() {
        final String WEEKLY_OBJECTIVE_NAME = 'Weekly Objective';
        final List<String> FILTER_OUT_PROJECT_STATUS = new String[]{'Complete', 'Archived'};
        final List<String> FILTER_OUT_TASK_STATUS = new String[]{'Completed', 'Not Completed'};

        // fetching the Records via SOQL
        List<Project__c> Projects = new List<Project__c>();
        Projects = [
            SELECT Id, 
                Name, 
                Start_Date__c, 
                Due_Date__c, 
                Project_Group__r.Name, 
                Project_Group__r.Gantt_Colour__c
            FROM Project__c
            WHERE Status__c NOT IN :FILTER_OUT_PROJECT_STATUS
            ];

        List<Project_Task__c> Tasks = new List<Project_Task__c>();
        Tasks = [
            SELECT Id, 
                Name, 
                Start_Date__c, 
                Current_Due_Date__c, 
                Parent__c, 
                Project__r.Id 
            FROM Project_Task__c
            WHERE RecordType.Name != :WEEKLY_OBJECTIVE_NAME
            AND Project__r.Status__c NOT IN :FILTER_OUT_PROJECT_STATUS
            AND Status__c NOT IN :FILTER_OUT_TASK_STATUS
        ];

        List<GanttLink__c> Links = new List<GanttLink__c>();
        Links = [SELECT Id, Type__c, Source__c, Target__c FROM GanttLink__c];

        Map<String, Object> result = new Map<String, Object>{'projects' => Projects, 'tasks' => Tasks, 'links' => Links };
        return result;
   }

   @RemoteAction
   @AuraEnabled(cacheable=true)
   public static List<Project_Group__c> getGanttProjectGroups() {
       List<Project_Group__c> groups = new List<Project_Group__c>();
       groups = [
            SELECT Id,
                Name
            FROM Project_Group__c
            ORDER BY Name
       ];

       return groups;
   }
}