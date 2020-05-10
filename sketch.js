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
let PanicLevel = MAX_PL;  // 5 - very nervous, 1 - totally calm
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
let StartScreenPic, Video;

/* ============================================================================= */
/* ============================================================================= */
// 
function preload() {
  console.log('Preload begin');

  CalculatePanicLevel();    
  GetNewsData();

  /*for (let i = 0; i < MAX_PL; i++) {    
      videos.push(createVideo('assets/video/'+str(i+1)+'.mp4')); //(i,fl_pl));
      videos[i].hide();
  }*/

  project_descritption = loadStrings('assets/description.txt');
  fontRegular = loadFont('assets/font/AvenirNextCyr-Regular.ttf');
  fontBold = loadFont('assets/font/AvenirNextCyr-Bold.ttf');

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
  Video = createVideo('assets/video/'+PanicLevel+'.mp4', ()=>fl_videoReady = true ); //(i,fl_pl));
  Video.hide();

  console.log('Setup end'); 
}

function draw() {
  if (fl_noLoop == false) {
    background(0);
    image(Video, windowWidth/2, videoY, windowWidth, hd);
    //drawImage(PanicLevel);
    drawTitles(PanicLevel);
    drawDescr(PanicLevel);
    //drawDebug();
  } else {    
    if (fl_StartImageReady == true)  {                                  // if image ready display image
      image(StartScreenPic, windowWidth/2, videoY, windowWidth, hd);
      if(checkWindowSize() != 'Error'){                                 // if resolution correct - display welcome text
        fl_blockUser = false;
        ShowWelcomeTitle();
        if((fl_allowtoclick == true)&&(fl_videoReady = true)){                                   // if all data collected - display continue text
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
    console.log('New cases: ' + todayCases+'\nMAX: '+ MAX_NEWCONFIRMED + '\nLevel: '+100*(todayCases/MAX_NEWCONFIRMED));
    console.log('PANIC LEVEL set to: ' + PanicLevel);
    console.log('---------------------------------');
  });
}
        
async function getNewsData(country){
  let textdata = [];
  let src, ttl;
  const api = 'https://newsapi.org/v2/top-headlines?country='+country +'&pageSize=100&apiKey=8f614aa73d1648188ca02e2e71714dfe';
  const response = await fetch(api, { method: 'GET'});
  const newsdata = await response.json();
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
  .catch((err) => console.log(err));

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
    
    //videos[PanicLevel-1].loop();    
    Video.loop();
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
  const DESCR_Y = 0.675*height;

  push();
  noStroke();
  fill('white');
  textFont(fontBold);
  textSize(fontSize[fontSizeTag].DescrHeader);
  textAlign(LEFT);
  text('In the field of anxiety', DESCR_X, DESCR_Y);
  
  textFont(fontRegular);
  text(LevelsMap.get(pl), DESCR_X, DESCR_Y+28);
  textSize(fontSize[fontSizeTag].DescrText);
  text(project_descritption, DESCR_X, DESCR_Y+50, 0.25*width, 0.5*height); 
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