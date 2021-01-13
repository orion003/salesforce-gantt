/* eslint-disable guard-for-in */
import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

import { createRecord, updateRecord, deleteRecord } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';

// Static resources
import GanttFiles from '@salesforce/resourceUrl/dhtmlxgantt703';

// Controllers
import getGanttData from '@salesforce/apex/GanttDataRetriever.getGanttData';
import getGanttProjectGroups from '@salesforce/apex/GanttDataRetriever.getGanttProjectGroups';

function unwrap(fromSF){
    const projects = unwrapProjects(fromSF.projects);
    const tasks = unwrapTasks(fromSF.tasks);

    mockProjectStartEnd(projects, tasks);
    colorTasks(projects, tasks);

    const data = projects.concat(tasks);
    const links = fromSF.links.map(a => ({
        id: a.Id,
        source: a.Source__c,
        target: a.Target__c,
        type: a.Type__c
    }));

    return { data, links };
}

function unwrapProjects(projects) {
    return projects.map(a => ({
        id: a.Id,
        text: a.Name,
        start_date: a.Start_Date__c,
        end_date: a.Due_Date__c,
        project_group: a.Project_Group__r ? a.Project_Group__r.Name : "",
        color: a.Project_Group__r.Gantt_Colour__c? a.Project_Group__r.Gantt_Colour__c : "",
        type: "project"
    })); 
}

function unwrapTasks(tasks) {
    return tasks.map(a => ({
        id: a.Id,
        text: a.Name,
        start_date: a.Start_Date__c,
        end_date: a.Current_Due_Date__c,
        parent: a.Parent__c == null ? a.Project__r.Id : a.Parent__c,
        type: "task"
    }));
}

function mockProjectStartEnd(projects, tasks) {
    var projectIds = [];
    for(var task of tasks){
        if(projectIds.indexOf(task.parent) < 0){
            projectIds.push(task.parent);
        }
    }

    for(var project of projects){
        if(projectIds.indexOf(project.id) < 0){
            if(project.start_date != null && project.end_date != null){
                var startTask = {
                    id: project.id + '_start_task',
                    text: 'Project Start',
                    start_date: project.start_date,
                    end_date: project.start_date,
                    parent: project.id,
                    type: "milestone"
                }
                tasks.push(startTask);

                var endTask = {
                    id: project.id + '_end_task',
                    text: 'Project End',
                    start_date: project.end_date,
                    end_date: project.end_date,
                    parent: project.id,
                    type: "milestone"
                }
                tasks.push(endTask);
            }
        }
    }
}

function colorTasks(projects, tasks) {
    for (var project of projects) {
        if (project.color != "") {
            for (var task of tasks) {
                if (project.id === task.parent) {
                    task.color = lightenDarkenColor(project.color, 50);
                }
            }
        }
    }
}

function lightenDarkenColor(hex, amount) {
  
    var usePound = false;
    if (hex[0] == "#") {
        hex = hex.slice(1);
        usePound = true;
    }
 
    var num = parseInt(hex,16);
 
    var r = (num >> 16) + amount;
    if (r > 255) r = 255;
    else if  (r < 0) r = 0;
 
    var b = ((num >> 8) & 0x00FF) + amount;
    if (b > 255) b = 255;
    else if  (b < 0) b = 0;
 
    var g = (num & 0x0000FF) + amount;
    if (g > 255) g = 255;
    else if (g < 0) g = 0;
 
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16);
}

export default class GanttView extends NavigationMixin(LightningElement) {
    
    static delegatesFocus = true;

    @api height;
    @track groupOptions;

    ganttInitialized = false;

    renderedCallback() {
        if (this.ganttInitialized) {
            return;
        }
        this.ganttInitialized = true;

        getGanttProjectGroups().then(d => {
            this.updateGroupOptions(d);
        });

        Promise.all([
            loadScript(this, GanttFiles + '/dhtmlxgantt.js'),
            loadStyle(this, GanttFiles + '/dhtmlxgantt.css'),
        ]).then(() => {
            this.initializeUI();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading Gantt',
                    message: error.message,
                    variant: 'error',
                }),
            );
        });
    }

    updateGroupOptions(data) {
        this.groupOptions = [
            {
                label: "Show All",
                value: "All"
            }
        ].concat(data.map(group => {
            return {
                label: group.Name,
                value: group.Name
            }
        }));
    }

    groupValue = "All";
    handleGroupChange(event) {
        if(event.detail.value === 'All') {
            this.groupValue = "All";
        }
        else {
            this.groupValue = event.detail.value;
        }

        gantt.refreshData();
    }

    zoomConfig = {
        levels: [
          {
            name:"day",
            scale_height: 27,
            min_column_width:50,
            scales:[
                {unit: "day", step: 1, format: "%d %M"}
            ]
          },
          {
             name:"week",
             scale_height: 27,
             min_column_width:50,
             scales:[
              {unit: "week", step: 1, format: function (date) {
               var dateToStr = gantt.date.date_to_str("%d %M");
               var endDate = gantt.date.add(date, -6, "day");
               var weekNum = gantt.date.date_to_str("%W")(date);
               return "#" + weekNum + ", " + dateToStr(date) + " - " + dateToStr(endDate);
               }}
             ]
           },
           {
             name:"month",
             scale_height: 27,
             min_column_width:50,
             scales:[
                {unit: "month", format: "%F %Y"}
             ]
            },
            {
              name:"year",
              scale_height: 27,
              min_column_width: 80,
              scales:[
                {unit: "year", step: 1, format: "%Y"}
            ]}
        ]
    };

    get scaleOptions() {
        return [
            {label: "Day", value: "day"},
            {label: "Week", value: "week"},
            {label: "Month", value: "month"},
            {label: "Year", value: "year"},
        ];
    }

    scaleValue = "month";
    handleScaleChange(event) {
        this.scaleValue = event.detail.value;
        gantt.ext.zoom.setLevel(this.scaleValue);

        gantt.resetLayout();
    }

    handleRefreshClick() {
        getGanttData().then(d => {
            gantt.clearAll();
            gantt.parse(unwrap(d));

            gantt.refreshData()
            gantt.resetLayout()
            gantt.render();
        });
    }

    initializeUI(){
        var ganttView = this;

        const root = this.template.querySelector('.thegantt');
        root.style.height = this.height + "px";

        gantt.templates.parse_date = date => new Date(date);
        gantt.templates.format_date = date => date.toISOString();

        gantt.config.columns = [
            {name:"text",           label:"Task name",  tree:true,      width:"*" },
            {name:"start_date",     label:"Start date", align:"center" },
        ];

        gantt.config.lightbox.project_sections = [
            {name:"description", height:70, map_to:"text", type:"textarea", focus:true},
            {name:"time",        height:72, map_to:"auto", type:"time"}
        ]

        gantt.config.lightbox.sections = [
            {name:"description", height:70, map_to:"text", type:"textarea", focus:true},
            {name:"time",        height:72, map_to:"auto", type:"time"}
        ]
        gantt.locale.labels.section_description = 'Name';

        gantt.config.sort = true;
        gantt.config.readonly = true;

        gantt.ext.zoom.init(this.zoomConfig);
        gantt.ext.zoom.setLevel(this.scaleValue);

        gantt.init(root);
        getGanttData().then(d => {
            gantt.parse(unwrap(d));
        });

        gantt.attachEvent("onBeforeTaskDisplay", function(id, task) {
            if(ganttView.groupValue === 'All' || task.project_group === ganttView.groupValue) {
                return true;
            }
            else if(task.parent != 0 && gantt.getTask(task.parent).project_group === ganttView.groupValue) {
                return true;
            }
    
            return false;
        });

        gantt.attachEvent("onTaskClick", function(id, event) {
            if (event.target.className == "gantt_task_content") {
                var recordType = "Project_Task__c";
                if(gantt.getTask(id).type === "project") {
                    recordType = "Project__c"
                }
    
                ganttView[NavigationMixin.Navigate]({
                    type: 'standard__recordPage',
                    attributes: {
                        recordId: id,
                        objectApiName: recordType,
                        actionName: 'view'
                    }
                });
            }

            return true;
        });

        gantt.createDataProcessor({
            task: {
                create: function(data) {
                    const insert = { apiName: "Project_Task__c", fields:{
                        Name : data.text,
                        Start_Date__c : data.start_date,
                        Current_Due_Date__c : data.end_date,
                        Parent__c : data.parent,
                        Progress__c : data.progress
                    }};
                    return createRecord(insert).then(res => {
                        return { tid: 1, ...res };
                    });
                },
                update: function(data, id) {
                    const update = { fields:{
                        Id: id,
                        Name : data.text,
                        Start_Date__c : data.start_date,
                        Current_Due_Date__c : data.end_date,
                        Parent__c : String(data.parent)
                    }};
                    return updateRecord(update).then(() => ({}));
                },
                delete: function(id) {
                    return deleteRecord(id).then(() => ({}));
                }
             },
             link: {
                create: function(data) {
                    const insert = { apiName: "GanttLink__c", fields:{
                        Source__c : data.source,
                        Target__c : data.target,
                        Type__c : data.type,
                    }};
                    return createRecord(insert).then(res => {
                        return { tid: res.id };
                    });
                },
                update: function(data, id) {
                    const update = { apiName: "GanttLink__c", fields:{
                        Id : id,
                        Source__c : data.source,
                        Target__c : data.target,
                        Type__c : data.type,
                    }};
                    return updateRecord(update).then(() => ({}));
                },
                delete: function(id) {
                    return deleteRecord(id).then(() => ({}));
                }
             }
        }).init(gantt);
    }
}