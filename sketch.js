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
let prev_pl = MAX_PL;
const Levels = [[1, 'calm'],[2, 'Concerned'],[3, 'Worried'],[4, 'NERVOUS'],[5, 'ANXIOUS']];
const LevelsMap = new Map(Levels);
const MAX_NEWCONFIRMED = 80000;

// -------------------- Video vatiables ----------------------------------------
let videos = [];
let hd,videoY,videoH;    // hd - display height, videoY - Y coordinate of video texture to align pic by bottom of the screen, videoH - real displayed height

// -------------------- NEWS data variables --------------------------------
let tind = [0,1,2,3,4,5];
let Titles = [];
// -------------------- Text Draw variables -------------------------------------
let project_descritption;
let drawtext_counter = 0;
let TEXT_UPATE_SPEED = 30;
let fontRegular, fontBold;

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

let fl_noLoop = true;
let fl_allowtoclick = false;
let fl_StartImageReady = false;
let fl_blockUser = false;
let fl_videoReady = false;
let fl_LinePicReady = false;
let StartScreenPic,LinePic, Video, test_pic;
let timerID;

/* ============================================================================= */
/* ============================================================================= */
// 
function preload() {
  console.log('Preload begin');

  CalculatePanicLevel();   
  GetNewsData(); 

  //DebugStartFunction();

  project_descritption = loadStrings('assets/description.txt');
  fontRegular = loadFont('assets/font/AvenirNextCyr-Regular.ttf');
  fontBold = loadFont('assets/font/AvenirNextCyr-Bold.ttf');
  //test_pic = loadImage('assets/test_alpha_pic.png');
  console.log('Preload end');
}

function setup() {
  console.log('Setup begin');
  
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0,0);

  background(0);
  updateVideoSize();
  udpateTextParams();
  imageMode(CENTER);
  textFont(fontRegular);

  
  StartScreenPic = loadImage('assets/image/'+PanicLevel+'.jpg', ()=> fl_StartImageReady = true );
  LinePic = loadImage('assets/image/line_horisontal_50.png', ()=> fl_LinePicReady = true );
 
  if(false){
    Video = createVideo('assets/video/'+PanicLevel+'.mp4', ()=>fl_videoReady = true ); //(i,fl_pl));
    Video.hide();
  }else{
    for (let i = 0; i < MAX_PL; i++) {    
        if( i == PanicLevel-1){
          videos.push(createVideo('assets/video/'+str(i+1)+'.mp4')); //(i,fl_pl));
        }else{
          videos.push(createVideo('assets/video/'+str(i+1)+'.mp4',()=>fl_videoReady = true)); //(i,fl_pl));
        }
        videos[i].hide();
    }
  }
  console.log('Setup end'); 
}

function draw() {
  background(0);
  if (fl_noLoop === false) {
    //image(Video, windowWidth/2, videoY, windowWidth, hd);
    drawImage(PanicLevel);
    drawTitles(PanicLevel);
    drawDescr(PanicLevel);
    //drawLine(PanicLevel);
    //drawDebug();
  } else {    
    if (fl_StartImageReady === true)  {                                  // if image ready display image
      image(StartScreenPic, windowWidth/2, videoY, windowWidth, hd);
      if(checkWindowSize() != 'Error'){                                 // if resolution correct - display welcome text
        fl_blockUser = false;
        ShowWelcomeTitle();
        if((fl_allowtoclick === true)&&(fl_videoReady === true)&&(fl_LinePicReady === true)){           // if all data collected - display continue text
          ShowContinueTitle();
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
    
    fl_allowtoclick = true;
    console.log('Total results: ' + Titles.length);    
    console.log('---------------------------------');
  })
  .catch((err) => {
    console.log(err);
    console.log('Upload debug data');
    loadJSON('assets/NewsData2002.json',(jsondata)=>{
      fl_allowtoclick = true
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
  if((fl_allowtoclick == false)||(fl_blockUser == true)) {  // dont allow user to click unitl everything be ready or if resolution is bad
    return;
  }

  if(fl_noLoop == true){        // if start image displayed
                                // then start animation
    setTimeout(function(){
      fl_noLoop = false;
      console.log("Start to draw, 100 ms passed");
  }, 100);
    
    videos[PanicLevel-1].loop();    
    //Video.loop();
  }else{
    //console.log('Mouse pressed at ('+mouseX+','+mouseY+')');
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);              //windowWidth/VIDEO_ASPECT);
  updateVideoSize();
  udpateTextParams();
  if(fl_noLoop == true){                                // it's mean we still display start picture
    background(0);
    image(StartScreenPic, windowWidth/2, videoY, windowWidth, hd);                    // update pic
    if (fl_allowtoclick == true) ShowContinueTitle();   // check if continue text should be displayed
  } 
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
  const h = (w*188)/1679;
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
  PanicLevel = 5;
  PANICLEVEL_GLOBAL = PanicLevel;
  loadJSON('assets/TestNewsData.json',(jsondata)=>{
    fl_allowtoclick = true
    Titles = jsondata['data'];
    console.log('Total results: ' + Titles.length);  
  });

}  