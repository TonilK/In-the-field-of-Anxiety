/*
  # In-the-field-of-Anxiety
    The project describes anxious feelings about the information field these days. 
    The web server display the most popular information trends and correlates them with open data on Covid-19
    to determine the level of anxiety about the situation in the world.

    Made using p5js library.
    News data is getting from NewsAPI.org.
    Covid data is getting from the NovelCOVID API.
*/

let canvas;
const MAX_PL = 5;
let PANICLEVEL_GLOBAL = MAX_PL; // set value at the begining
let PanicLevel = MAX_PL;  // 5 - very nervous, 1 - totally calm. can be changed during session
let next_pl,prev_pl = MAX_PL;
const Levels = [[1, 'calm'],[2, 'Concerned'],[3, 'Worried'],[4, 'NERVOUS'],[5, 'ANXIOUS']];
const LevelsMap = new Map(Levels);
const MAX_NEWCONFIRMED = 80000;

// -------------------- Media variables ----------------------------------------
let videos = [];
let hd,videoY,videoH;    // hd - display height, videoY - Y coordinate of video texture to align pic by bottom of the screen, videoH - real displayed height
let StartScreenPic,LinePic, Video, test_pic, timerID,SwitchId;
// -------------------- NEWS data variables --------------------------------
let tind = [0,1,2,3,4,5];
let Titles = [];
// -------------------- Text Draw variables -------------------------------------
let project_descritption;
let drawtext_counter = 0;
let TEXT_UPATE_SPEED = 30;
let fontRegular, fontBold;

let lbar_counter = 0;
let dot_counter = 0;
let lbar='   ';

let TEXT_N_FIELDS = 5;
let fontSize = { normal:{
                          Debug: 20,
                          DescrText: 15, // 15
                          DescrHeader: 20,
                          TilesText: 18,
                          StartHeader: 20, //20
                          ContinueTitle: 15 //15
                        },
                  small:{
                          Debug: 20,
                          DescrText: 10,
                          DescrHeader: 15,
                          TilesText: 12,
                          StartHeader: 12,
                          ContinueTitle: 10
                        }   
};
let fontSizeTag = "normal";

// logic flags
let fl_noLoop = true;
let fl_blockUser = false;
let fl_switching = false;
// data ready flags
let FlagDataReady = {
  StartImage:false,
  Video:false,
  LinePic:false,
  News:false,
  ProjDescr:false,
  FontReg:false,
  FontBold:false
};

/* ============================================================================= */
/* ============================================================================= */
// 
function preload() {
}

function setup() {
  console.log('Setup begin');
  
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);
  background(0);
  ShowWaitingTitle();

  updateVideoSize();
  udpateTextParams();
  imageMode(CENTER);
  
  //GetNewsData();
  //DebugStartFunction();

  // Download news data

  loadJSON('assets/NewsData.json',(jsondata)=>{
    console.log('-------- NEWS DOWNLOADED --------');
    FlagDataReady.News = true
    Titles = jsondata['data'];
    console.log('Total titles: ' + Titles.length);  
  });



  project_descritption = loadStrings('assets/description.txt', ()=> FlagDataReady.ProjDescr = true);
  fontRegular = loadFont('assets/font/AvenirNextCyr-Regular.ttf',()=>{FlagDataReady.FontReg = true; textFont(fontRegular);});
  fontBold = loadFont('assets/font/AvenirNextCyr-Bold.ttf',()=>FlagDataReady.FontBold = true);
  LinePic = loadImage('assets/image/line_horisontal_small.png', ()=> FlagDataReady.LinePic = true );
 
  // Get COVID data and when its done download necessary start image and videos
  loadJSON("https://disease.sh/v2/all?yesterday=true", data => {
    console.log('-------- COVID UPDATE -----------');
    console.log(data);
    const { todayCases } = data;  
    for(let i = 1; i < MAX_PL; i++){
      if(todayCases <= (MAX_NEWCONFIRMED*i)/(MAX_PL-1)){
        PanicLevel = i;
        break;
      }
    }
  
    prev_pl = PanicLevel;
    PANICLEVEL_GLOBAL = PanicLevel;
    console.log('New cases: ' + todayCases+'\nMAX: '+ MAX_NEWCONFIRMED + '\nLevel: '+100*(todayCases/MAX_NEWCONFIRMED));
    console.log('PANIC LEVEL set to: ' + PanicLevel);
    console.log('---------------------------------');

    console.log('Preparing video and images');
    StartScreenPic = loadImage('assets/image/'+PanicLevel+'.jpg', ()=> FlagDataReady.StartImage = true );
    for (let i = 0; i < MAX_PL; i++) {    
        if( i == PanicLevel-1){
          videos.push(createVideo('assets/video/'+str(i+1)+'.mp4')); //(i,fl_pl));
        }else{
          videos.push(createVideo('assets/video/'+str(i+1)+'.mp4',()=>FlagDataReady.Video = true)); //(i,fl_pl));
        }
        videos[i].hide();
    }
  });

  console.log('Setup end'); 
}

function draw() {
  background(0);
  if (fl_noLoop === false) {
    drawImage(PanicLevel);
    drawTitles(PanicLevel);
    drawDescr(PanicLevel);
    //drawDebug();
  } else {   
    if (FlagDataReady.StartImage === true)  {                           // if image ready display image
      image(StartScreenPic, windowWidth/2, videoY, windowWidth, hd);
      if(checkWindowSize() != 'Error'){                                 // if resolution correct - display welcome text
        fl_blockUser = false;
        ShowWelcomeTitle();
        if(CheckDataReady()){           // if all data collected - display continue text
          ShowContinueTitle();
        }else{
          ShowWaitingTitle();
        }
      } else {                                                          // else display forbiden text and block click possibility
        fl_blockUser = true;
        ShowForbiddenTitle();
      }
    }
  }
}

/* ----------------- EVENTS -------------------------------------------------------------- */
function CalculatePanicLevel(){ // get stat for prev day
  loadJSON("https://disease.sh/v2/all?yesterday=true", data => {
    console.log('-------- COVID UPDATE -----------');
    console.log(data);
    const { todayCases } = data;  
    for(let i = 1; i < MAX_PL; i++){
      if(todayCases <= (MAX_NEWCONFIRMED*i)/(MAX_PL-1)){
        PanicLevel = i;
        break;
      }
    }
  
    prev_pl = PanicLevel;
    PANICLEVEL_GLOBAL = PanicLevel;
    console.log('New cases: ' + todayCases+'\nMAX: '+ MAX_NEWCONFIRMED + '\nLevel: '+100*(todayCases/MAX_NEWCONFIRMED));
    console.log('PANIC LEVEL set to: ' + PanicLevel);
    console.log('---------------------------------');
  });
}
        
async function getNewsData(country){
  let textdata = [];
  let src, ttl;
  const proxyurl = "https://cors-anywhere.herokuapp.com/";
  const api = proxyurl+'https://newsapi.org/v2/top-headlines?country='+country +'&pageSize=100&apiKey=92ec6d834dc8406d8293647200d8c0cd';
  const response = await fetch(api, { method: 'GET'});
  const newsdata = await response.json();
  console.log(newsdata);
  const {articles} = newsdata;

  for(let i = 0; i < articles.length; i++){
      
      if(articles[i].author != null){
        src = articles[i].author;
      } else if (articles[i].source.name != null) {
        src = articles[i].source.name;
      } else {
        src = 'Anonymous';
      }

      ttl = articles[i].title;

      textdata.push({source:src, title:ttl});
  }

  return textdata;
}

function GetNewsData(){
  const countries = ['us','br','ru','de','au'];
  let NewsPromises = [];
  for(let i = 0; i < countries.length; i++){
    NewsPromises.push(getNewsData(countries[i]));
  }

  Promise.all(NewsPromises)
  .then((result) => {
    console.log('---------- NEWS UPDATE -----------');
    for(let i = 0; i < result.length; i++){
      console.log('Country: ' + countries[i] + '. Results: ' + result[i].length);
      for(let j = 0; j < result[i].length; j++){
        Titles.push(result[i][j]);
      }
    }
    
    FlagDataReady.News = true;
    console.log('Total results: ' + Titles.length);    
    console.log('---------------------------------');
  })
  .catch((err) => {
    console.log(err);
    console.log('Upload debug data');
    loadJSON('assets/NewsData2002.json',(jsondata)=>{
      FlagDataReady.News = true
      Titles = jsondata['data'];
      console.log('Total results: ' + Titles.length);  
    });
  });

}

function ShowContinueTitle(){
  push();
  noStroke();
  fill('white');
  textAlign(CENTER);
  textSize(fontSize[fontSizeTag].ContinueTitle); 
  text('click to continue',width/2, height*0.52);
  pop();
}

function ShowWaitingTitle(){
  push();
  noStroke();
  fill('white');
  textAlign(LEFT);
  textSize(fontSize[fontSizeTag].ContinueTitle);

  if(++lbar_counter > 30){
    lbar_counter = 0;
    lbar = '.'.repeat(dot_counter);
    if(++dot_counter > 3){
      dot_counter = 0;
    }
  }

  text('loading'+lbar,width*0.47, height*0.52);
  pop();
}

function ShowWelcomeTitle(){
  push();
  noStroke();
  fill('white');
  textSize(fontSize[fontSizeTag].StartHeader); 
  textAlign(CENTER);
  text('welcome to the field of ANXIETY',width/2, height/2);
  pop();
}

function ShowForbiddenTitle(){
  push();
  noStroke();
  fill('white');
  textAlign(CENTER);
  textSize(fontSize[fontSizeTag].StartHeader); 
  text('For better experience please use bigger screen',width/2, height/2);
  pop();
}

function mousePressed() {  
  if((CheckDataReady() === false)||(fl_blockUser === true)) {  // dont allow user to click unitl everything be ready or if resolution is bad
    return;
  }

  if(fl_noLoop == true){        // if start image displayed
                                // then start animation
    setTimeout(function(){
      fl_noLoop = false;
      console.log("Start to draw, 100 ms passed");
  }, 100);
    
    videos[PanicLevel-1].loop();    
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);              //windowWidth/VIDEO_ASPECT);
  updateVideoSize();
  udpateTextParams();
}

function CheckDataReady(){
  for(key in FlagDataReady){
    if(FlagDataReady[key] === false){
      return false;
    }
  }
  return true;
}

/* ------------------- Draw functions ---------------------------------------------------- */

function drawTitles(pl){ // fast twit animation

  const TEXT_X_COORD  = 0.05*width;
  const TEXT_HEIGHT   = 0.9*videoH;
  const TEXT_Y_COORD = (height - videoH)*0.5 + TEXT_X_COORD;//(height - TEXT_HEIGHT)*0.5; 
  const TEXT_WIDTH    = 0.25*width;
  const Y_STEP = TEXT_HEIGHT/TEXT_N_FIELDS;
  const TOTAL_TITLES = Titles.length;

  push();

  noStroke();
  fill('white');
  textSize(fontSize[fontSizeTag].TilesText); 
  textAlign(LEFT);

  if(drawtext_counter++ > TEXT_UPATE_SPEED) {   
    drawtext_counter = 0;
    TEXT_UPATE_SPEED = int(random(400/pl));
    tind.pop();                                 // delete last one
    tind.unshift( int(random(TOTAL_TITLES)) ); // select random index from buffer
  }

  for(let i=0;i<TEXT_N_FIELDS;i++){
    const ci = tind[i]; // current index
    const y = TEXT_Y_COORD + i*Y_STEP;
    
    // draw name
    textFont(fontBold); 
    text(Titles[ci].source, TEXT_X_COORD, y,TEXT_WIDTH, 25);

    // draw  title text
    textFont(fontRegular);
    text(Titles[ci].title, TEXT_X_COORD, y + 25, TEXT_WIDTH, Y_STEP - 50);
  }

  pop();
}

function drawDescr(pl){
  const DESCR_X = 0.7*width;
  const DESCR_Y = (height - videoH)*0.5 + 0.05*width;//0.675*height;

  push();
  noStroke();
  fill('white');
  textFont(fontBold);
  textSize(fontSize[fontSizeTag].DescrHeader);
  textAlign(LEFT);

  // header
  const header = 'In the field of anxiety';
  const textHeight = fontSize[fontSizeTag].DescrHeader*1.5;
  text(header, DESCR_X, DESCR_Y);
  textFont(fontRegular);
  text(LevelsMap.get(pl), DESCR_X, DESCR_Y+textHeight); // textH was 28

  // level pics
  push();
  const w = 2*textWidth(header);
  const h = (w*79)/709;//(w*188)/1679;
  const x = DESCR_X+w/2
  const y = DESCR_Y+2.2*textHeight;
  image(LinePic, x, y, w, h);

  // draw rect on level pics
  const rx = DESCR_X + (MAX_PL - pl)*w/5;
  const ry = y - h/2;
  noFill();
  stroke('white');
  rect(rx, ry, w/5, h);
  pop();


  if(mouseIsPressed){
    if( (mouseY >= (y-h/2)) && (mouseY <= (y + h/2)) ) {
      for(let i = 1; i < MAX_PL+1; i++){
        const leftborder = DESCR_X + (MAX_PL - i)*w/5;
        const rigthborder = leftborder + w/5;
        if( mouseX >= leftborder && mouseX < rigthborder){
          PanicLevel = i;
          //console.log('Level select: ' + PanicLevel);
          break;
        }
      }
    }
  }

  // description
  textSize(fontSize[fontSizeTag].DescrText);
  text(project_descritption, DESCR_X, DESCR_Y+0.7*videoH, 0.25*width, 0.5*height); 
  pop();

}

function drawDebug(){
  push();
  noStroke();
  fill('white');
  textAlign(RIGHT);
  textSize(fontSize[fontSizeTag].Debug); 
  text('Width: '+windowWidth+'\nHeight: '+windowHeight+'\nSize: '+checkWindowSize(),width, height/4);
  pop();
}

function drawLine(pl){
  let h = 0.4*videoH;
  let w = (h*328)/919;
  const x = 0.95*width-w/2
  const y = h/2 + 0.05*width;
  image(LinePic, x, y, w, h);
}

function drawImage(pl){                           // pl - panic level
  
  if(pl != prev_pl){                              // if panic level changed - it can be changed only from bar switch
    videos[prev_pl-1].pause();
    videos[pl-1].loop();
    prev_pl = pl;
    console.log('Switch video to' + str(pl-1));
    console.log('Clear timer: ' + timerID);
    clearTimeout(timerID);
    if(pl != PANICLEVEL_GLOBAL){                  // Start timer to return clobal panic level it nothing happened
        timerID = setTimeout(()=>{
          PanicLevel = PANICLEVEL_GLOBAL;
          console.log('Timer: '+timerID+'. Panic level returned to Global: ' + PANICLEVEL_GLOBAL);
        },60000);
        console.log('Start timer ' + timerID);
    }
  }
  image(videos[pl-1], windowWidth/2, videoY, windowWidth, hd);
}

function drawImage2(pl){                           // pl - panic level
  
  if(pl != prev_pl){                              // if panic level changed - it can be changed only from bar switch
    image(videos[prev_pl-1], windowWidth/2, videoY, windowWidth, hd); // show prev
    if(fl_switching === true){
      if(pl != next_pl){
        console.log('New destination video!');
        console.log('Clear switch timer: ' + SwitchId);
        clearTimeout(SwitchId);     // kill switch proc
        videos[next_pl-1].pause();  //  pause dest vide
        fl_switching = false;       // this start new switch proc
      } else {
        console.log('Wait switch timer ' +  SwitchId + ' to finish');
      }

    } else{ // start new switch proc
      fl_switching = true;
      next_pl = pl;
      videos[next_pl-1].loop();
      SwitchId = setTimeout(()=>{
        console.log('Switch timer: '+SwitchId+'. Switch v' + (prev_pl-1) + ' to v' + (PanicLevel-1));
        videos[prev_pl-1].pause();
        prev_pl = PanicLevel;
        fl_switching = false;
      },200);
      console.log('Start switch timer ' + SwitchId);
      console.log('Switch video to' + str(next_pl-1));

      console.log('Clear timer: ' + timerID);
      clearTimeout(timerID);
      if(pl != PANICLEVEL_GLOBAL){                  // Start timer to return clobal panic level it nothing happened
          timerID = setTimeout(()=>{
            PanicLevel = PANICLEVEL_GLOBAL;
            console.log('Timer: '+timerID+'. Panic level returned to Global: ' + PANICLEVEL_GLOBAL);
          },60000);
          console.log('Start timer ' + timerID);
      }
    }   
  }else{
    image(videos[pl-1], windowWidth/2, videoY, windowWidth, hd); 
  }

}

function updateVideoSize(){           // set image to fit width
  hd = 9*windowWidth/16;              // video aspev = 16/9
  videoY = windowHeight/2;
  videoH = hd;
  if(hd > windowHeight) {             // if image is too high for current width, then align it 
    videoY -=  (hd - windowHeight)/2; // by bottom side
    videoH = windowHeight;
  }
}

function udpateTextParams(){
  // default font size
  const res = checkWindowSize();
  if (res == 'big') {
      fontSizeTag = "normal";
      TEXT_N_FIELDS = 6;
  } else if (res == 'medium') {
    fontSizeTag = "normal";
    TEXT_N_FIELDS = 5;
  } else{
    fontSizeTag = "small"
    TEXT_N_FIELDS = 5;
  }  

}

function checkWindowSize(){
  if( (windowWidth < 1000) || (windowHeight < 500) || (windowWidth < windowHeight) ) return "Error";
  else if((windowWidth < 1200) || (windowHeight < 700)) return "small";
  else if(windowWidth < 1800)  return "medium";
  else  return "big";
}

function DebugStartFunction(){
  console.log('DEBUG SETUP');
  //PanicLevel = 5;
  //PANICLEVEL_GLOBAL = PanicLevel;
  loadJSON('assets/NewsData.json',(jsondata)=>{
    FlagDataReady.News = true
    Titles = jsondata['data'];
    console.log('Total results: ' + Titles.length);  
  });

}  