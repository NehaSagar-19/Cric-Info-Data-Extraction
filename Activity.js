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
    writeToExcel(teamsArray);
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

function writeToExcel(teamsArray){
    let workbook = new excel4Node.Workbook();
    let myStyle = workbook.createStyle({
        font: {
          bold: true
        },
      });
    for(let i=0;i<teamsArray.length;i++){
        let sheetname = teamsArray[i].name;
        let currSheet = workbook.addWorksheet(sheetname); 
        currSheet.cell(1, 1).string('VS').style(myStyle);
        currSheet.cell(1, 2).string('S1').style(myStyle);
        currSheet.cell(1, 3).string('S2').style(myStyle);
        currSheet.cell(1, 4).string('RESULT').style(myStyle);
        for(let j=0;j<teamsArray[i].match.length;j++){
            currSheet.cell(2+j,1).string(teamsArray[i].match[j].vs);
            currSheet.cell(2+j,2).string(teamsArray[i].match[j].s1);
            currSheet.cell(2+j,3).string(teamsArray[i].match[j].s2);
            currSheet.cell(2+j,4).string(teamsArray[i].match[j].result);
        }
    }
    workbook.write('teams.csv');
}
