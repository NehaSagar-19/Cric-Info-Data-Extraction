//node Activity.js --source https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results

const minimist = require("minimist");
const fs = require("fs");
const axios = require("axios");
const jsdom = require("jsdom");
const excel4Node = require('excel4node');

const args = minimist(process.argv);
//console.log(args.source);
let promise = axios.get(args.source);
promise.then(function(response){
    html = response.data;
    let dom = new jsdom.JSDOM(html);
    let document = dom.window.document;
    let matches = [];
    let scoreblock = document.querySelectorAll('div.match-score-block');
    //console.log(scoreblock.length);
    for(let i=0;i<scoreblock.length;i++){
        let match = {};
        let teams = scoreblock[i].querySelectorAll('p.name');
        let teamsScore = scoreblock[i].querySelectorAll('span.score');
        let result = scoreblock[i].querySelector('div.status-text > span');
        match.t1 = teams[0].textContent;
        match.t2 = teams[1].textContent;
        if(teamsScore.length==2){
            match.score1 = teamsScore[0].textContent;
            match.score2 = teamsScore[1].textContent;
        }
        else if(teamsScore.length==1){
            match.score1 = teamsScore[0].textContent;
            match.score2 = '';
        }
        else{
            match.score1 = '';
            match.score2 = '';
        }
        match.result = result.textContent;
        matches.push(match);
        
    }
    //console.log(matches);
    let teamsArray = [];
    for(let i=0;i<matches.length;i++){
        makeTeamsjson(matches[i],teamsArray);
    }
    //console.log(JSON.stringify(teamsArray));
    fs.writeFileSync('teams.json',JSON.stringify(teamsArray));
});

function makeTeamsjson(match,teamsArray){
    let inteams = -1;
    for(let i=0;i<teamsArray.length;i++){
        if(match.t1==teamsArray[i].name){
            inteams = i;
            teamsArray[inteams].match.push({
                vs: match.t2,
                s1: match.score1,
                s2: match.score2,
                result: match.result
            })
            break;
        }
    }
    if(inteams == -1){
        let matchData = {};
        matchData.name = match.t1;
        matchData.match = [];

        teamsArray.push(matchData);
    }

    inteams = -1
    for(let i=0;i<teamsArray.length;i++){
        if(match.t2==teamsArray[i].name){
            inteams = i;
            teamsArray[inteams].match.push({
                vs: match.t1,
                s1: match.score2,
                s2: match.score1,
                result: match.result
            })
            break;
        }
    }
    if(inteams == -1){
        let matchData = {};
        matchData.name = match.t2;
        matchData.match = [];
        teamsArray.push(matchData);
    }
    
}

