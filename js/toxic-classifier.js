const sampleComments = [
    'That cheese is very good yes of course that is because you stink like a pig',
    'Thanks, I appreciate your attitude, we need more people like you',
    'That mother fucker I will maul him with a bouche knife if he fucking touches or ruins my love life',
    'Oh shut the fuck up, I only know as the idiot you are by virtue of your degradation of this project with your stupidity.'
    ];

// The minimum prediction confidence.
const threshold = 0.9;

let model, labels;

labels = ['identity_attack','insult','obscene','severe_toxicity','sexual_explicit','threat','toxicity'];

$(document).ready(function() {    
    let samples = [];
    for (let comment of sampleComments) {
      samples.push(initToxicLabels(comment));
    }
    
    displayTable(samples, false, false, 0);

    // load model
    toxicity.load(threshold).then(mdl => {
        model = mdl;
        labels = [];
        classifyToxicity(samples).then(results =>{
          $('.progress').addClass('d-none');
          displayTable(results, false, true, 0);
        })
    })
});

function initToxicLabels(text){
  var obj = {text : text};
  for (let label of labels) {
    obj[label] = null;
  }
  return obj;
}

function displayTable(data, append, hasResult, replaceRowID){
  let wrapper = $('#table-wrapper');
  if(!append){
    wrapper.empty();
  }else if(replaceRowID > 0){
    $("#"+replaceRowID).remove();
  }
  
  if(window.matchMedia("(max-width: 767px)").matches){
      // The viewport is less than 768 pixels wide, mobile device
      return generateTable(data, 'card', ["text"], wrapper, hasResult, replaceRowID);
  } else{
      // The viewport is at least 768 pixels wide, tablet or desktop
      let columns = Object.keys(data[0]);
      if(!append){
        generateTableHead(columns, wrapper);
      }
      return generateTable(data, 'table', ["text"].concat(labels), wrapper, hasResult, replaceRowID);
  }
}

async function classifyToxicity(comments){
    //classify samples
    await model.classify(comments.map(d => d.text)).then(labels => {
        //result is an array of labels
        labels.forEach(item => getLabelResults(item, comments));
    });
    return comments;
}

function getLabelResults(item, comments){
    if(labels.indexOf(item.label)<0){
        labels.push(item.label);
    }
    //results is an array of preditions of input samples
    item.results.forEach(function(prediction, index){
        comments[index][item.label] = prediction.match;
    });
}

function generateTableHead(columns, parentElement) {
    let header = $('<div class="row result-header"></div>');
    for (let columnName of columns) {
        let css = "column d-inline";
        if(columnName == 'text'){
          css = css +" text-column-header";
        }
        let column = '<div class="'+css+'">'+columnName.replace('_',' ')+'</div>';
        header.append(column);
    }
    parentElement.append(header);
}

function generateTable( data, view, columns,  parentElement, hasResult) {
  let body = $('<div class="row result-body"></div>');
  let classifying = '<div class="progress progress-bar progress-bar-striped progress-bar-animated col-md-7 col-10 offset-md-4 offset-1">Classifying</div>';
  let lastRowID = 0;
  let isLastRowToxic = false;
  for (let element of data) {
      let date = new Date();
      let timestamp = date.getTime();
      lastRowID = timestamp;
      isLastRowToxic = false;
      let row = $('<div id="'+lastRowID+'" class="row col-12 result-row '+view+'-view"></div>');
      
      // display columns 
      for (let key of columns) {
          let css = "column d-inline";
          let value = "&nbsp;";
          if(key == 'text'){
            value = element[key];
            css = css + ' text-column-content-'+view;
          }
          else if(element[key]){
            value = '<i class="fa fa-exclamation-triangle"></i>'
            isLastRowToxic = true;
          }
          let cell = '<div class="'+css+'">'+value+'</div>';
          row.append(cell);
      }
      // card view display header 
      if(view == 'card'){
        let rowColumns = $('<div class="col-6 p-0"></div>');
        generateTableHead( labels, rowColumns);
        row.append(rowColumns);
        let rowValues = $('<div class="col-6 p-0"></div>');
        isLastRowToxic = generateTable([element], 'table', labels, rowValues, hasResult).IsLastRowToxic;
        row.append(rowValues);
      } 
      else {
        if(!hasResult){
          row.append(classifying);
        }
      }
      if(hasResult){
        if(isLastRowToxic){
          row.addClass('alert alert-danger')
        }else{
          row.addClass('alert alert-success')
        }
      }
      body.append(row);
    }
    parentElement.append(body);
    return {
            LastRowID: lastRowID, 
            IsLastRowToxic: isLastRowToxic
            };
}

$("#btn-classify").click(function () {
  let comment = [];
  comment.push(initToxicLabels($('#classify-new-text-input').val()));
  rowID = displayTable(comment, true, false, 0).LastRowID;

  classifyToxicity(comment).then(results =>{
    displayTable(results, true, true, rowID);
    $('#classify-new-text-input').val('');
  })
});


$('#classify-new-text-input').keyup(function(e){
   if(e.keyCode == 13)
   {
    $("#btn-classify").click();
   }
});