@isTest
private class GanttDataRetrieverTest {
    static testMethod void testGetProjectsAndTasks(){
        Account account = new Account(
            Name = 'Test Account'
        );
        insert account;

        Project__c project = new Project__c(
            Name = 'Test Project',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Due_Date__c = Date.newInstance(2020, 10, 31),
            Account__c = account.Id
        );
        insert project;

        Project_Task__c task = new Project_Task__c(
            Name = 'Test Task',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Current_Due_Date__c = Date.newInstance(2020, 9, 30),
            Parent__c = project.Id,
            Project__c = project.Id
        );
        insert task;

        Test.startTest();

        Map<String, Object> data = GanttDataRetriever.getGanttData();

        Test.stopTest();

        List<Project__c> projects = (List<Project__c>) data.get('projects');
        List<Project_Task__c> tasks = (List<Project_Task__c>) data.get('tasks');

        System.assertEquals(1, projects.size(), 'Incorrect number of projects.');
        System.assertEquals(1, tasks.size(), 'Incorrect number of tasks.');
    }

    static testMethod void testGetProjectsAndTasksIgnoreWeekly(){
        Account account = new Account(
            Name = 'Test Account'
        );
        insert account;

        Project__c project = new Project__c(
            Name = 'Test Project',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Due_Date__c = Date.newInstance(2020, 10, 31),
            Account__c = account.Id
        );
        insert project;

        Map <String, Schema.RecordTypeInfo> recordTypes = Project_Task__c.sObjectType.getDescribe().getRecordTypeInfosByName();

        Project_Task__c task1 = new Project_Task__c(
            Name = 'Test Task',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Current_Due_Date__c = Date.newInstance(2020, 9, 30),
            Parent__c = project.Id,
            Project__c = project.Id,
            RecordTypeId = recordTypes.get('Task').getRecordTypeId()
        );
        insert task1;

        Project_Task__c task2 = new Project_Task__c(
            Name = 'Test Task',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Current_Due_Date__c = Date.newInstance(2020, 9, 30),
            Parent__c = project.Id,
            Project__c = project.Id,
            RecordTypeId = recordTypes.get('Weekly Objective').getRecordTypeId()
        );
        insert task2;

        Test.startTest();

        Map<String, Object> data = GanttDataRetriever.getGanttData();

        Test.stopTest();

        List<Project__c> projects = (List<Project__c>) data.get('projects');
        List<Project_Task__c> tasks = (List<Project_Task__c>) data.get('tasks');

        System.assertEquals(1, projects.size(), 'Incorrect number of projects.');
        System.assertEquals(1, tasks.size(), 'Incorrect number of tasks.');
    }

    static testMethod void testGetProjectsAndTasksIgnoreCompleteArchived(){
        Account account = new Account(
            Name = 'Test Account'
        );
        insert account;

        Project__c project1 = new Project__c(
            Name = 'Test Project 1',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Due_Date__c = Date.newInstance(2020, 10, 31),
            Account__c = account.Id,
            Status__c = 'In Progress'
        );
        insert project1;

        Project__c project2 = new Project__c(
            Name = 'Test Project 2',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Due_Date__c = Date.newInstance(2020, 10, 31),
            Account__c = account.Id,
            Status__c = 'Complete'
        );
        insert project2;

        Project__c project3 = new Project__c(
            Name = 'Test Project 3',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Due_Date__c = Date.newInstance(2020, 10, 31),
            Account__c = account.Id,
            Status__c = 'Archived'
        );
        insert project3;

        Map <String, Schema.RecordTypeInfo> recordTypes = Project_Task__c.sObjectType.getDescribe().getRecordTypeInfosByName();

        Project_Task__c task1 = new Project_Task__c(
            Name = 'Test Task 1',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Current_Due_Date__c = Date.newInstance(2020, 9, 30),
            Parent__c = project1.Id,
            Project__c = project1.Id,
            RecordTypeId = recordTypes.get('Task').getRecordTypeId()
        );
        insert task1;

        Project_Task__c task2 = new Project_Task__c(
            Name = 'Test Task 2',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Current_Due_Date__c = Date.newInstance(2020, 9, 30),
            Parent__c = project2.Id,
            Project__c = project2.Id,
            RecordTypeId = recordTypes.get('Task').getRecordTypeId()
        );
        insert task2;

        Project_Task__c task3 = new Project_Task__c(
            Name = 'Test Task 3',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Current_Due_Date__c = Date.newInstance(2020, 9, 30),
            Parent__c = project3.Id,
            Project__c = project3.Id,
            RecordTypeId = recordTypes.get('Task').getRecordTypeId()
        );
        insert task3;

        Project_Task__c task4 = new Project_Task__c(
            Name = 'Test Task 4',
            Start_Date__c = Date.newInstance(2020, 8, 31),
            Current_Due_Date__c = Date.newInstance(2020, 9, 30),
            Parent__c = project3.Id,
            Project__c = project3.Id,
            Status__c = 'Completed',
            RecordTypeId = recordTypes.get('Task').getRecordTypeId()
        );
        insert task4;

        Test.startTest();

        Map<String, Object> data = GanttDataRetriever.getGanttData();

        Test.stopTest();

        List<Project__c> projects = (List<Project__c>) data.get('projects');
        List<Project_Task__c> tasks = (List<Project_Task__c>) data.get('tasks');

        System.assertEquals(1, projects.size(), 'Incorrect number of projects.');
        System.assertEquals(1, tasks.size(), 'Incorrect number of tasks.');
    }

    static testMethod void testGetProjectsGroups() {
        Project_Group__c projectgroup = new Project_Group__c(Name = 'Test Group');
        insert projectgroup;
        
        Test.startTest();

        List<Project_Group__c> groups = GanttDataRetriever.getGanttProjectGroups();

        Test.stopTest();

        System.assertEquals(1, groups.size(), 'Incorrect number of Project Gropus.');
    }
}