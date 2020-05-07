/*
  # In-the-field-of-Anxiety
    The project describes anxious feelings about the information field these days. 
    The web server display the most popular information trends and correlates them with open data on Covid-19
    to determine the level of anxiety about the situation in the world.

    Made using p5js library and news data by NewsAPI.org
*/

let canvas;
const MAX_PL = 5;
let PanicLevel = MAX_PL;  // 5 - very nervous, 1 - totally calm
let prev_pl = PanicLevel; // store previous panic level to detect changes
let pl_dir = -1;          // var fo debug switching between levels

const Levels = [[1, 'calm'],[2, 'Concerned'],[3, 'Worried'],[4, 'NERVOUS'],[5, 'ANXIOUS']];
const LevelsMap = new Map(Levels);
const MAX_NEWCONFIRMED = 90000;

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

let fl_noLoop = true;
let fl_allowtoclick = false;

/* ============================================================================= */
/* ============================================================================= */

function preload() {
  console.log('Preload begin');

  CalculatePanicLevel();    
  GetNewsData();

  for (let i = 0; i < MAX_PL; i++) {    
      videos.push(createVideo('assets/video/'+str(i+1)+'.mp4')); //(i,fl_pl));
      videos[i].hide();
  }

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
  imageMode(CENTER);
  textFont(fontRegular);
  DisplayStartImage(PanicLevel);

  console.log('Setup end'); 
}


function draw() {
  if (fl_noLoop == false) {
    background(0);
    drawImage(PanicLevel);
    drawTitles(PanicLevel);
    drawDescr(PanicLevel);
  }
}

/* ----------------- EVENTS -------------------------------------------------------------- */
function CalculatePanicLevel(){ // get stat for prev day

  // Calc prev day
  let pday = day()-1;
  let pmon = month();
  let pyear = year();
  if (pday == 0) {
    pday = 30;
    pmon = pmon - 1;
    if (pmon == 2){ // if prev is February
      pday = 28;
    }
    if (pmon == 0){
      pmon = 12;
      pyear = pyear - 1;
    }
  }

  let mon_sep = '-';
  let day_sep = '-';
  if (pmon <10) mon_sep += '0';
  if(pday < 10) day_sep += '0';

  console.log('Covid stat request data: '+pyear+mon_sep+pmon+day_sep+pday);
  const cov_api = "https://api.covid19api.com/world?from="+pyear+mon_sep+pmon+day_sep+pday+"T00:00:00Z&to="+pyear+mon_sep+pmon+day_sep+pday+"T23:59:59Z";
  loadJSON(cov_api, CovidDataUpdate); // here we caclucalte current panic level

}

function CovidDataUpdate(data){
  console.log('-------- COVID UPDATE -----------');
  const { NewConfirmed } = data[0];  
  for(let i = 1; i < MAX_PL; i++){
    if(NewConfirmed <= (MAX_NEWCONFIRMED*i)/(MAX_PL-1)){
      PanicLevel = i;
      break;
    }
  }

  prev_pl = PanicLevel;
  console.log('New cases: ' + NewConfirmed+'\nMAX: '+ MAX_NEWCONFIRMED + '\nLevel: '+100*(NewConfirmed/MAX_NEWCONFIRMED));
  console.log('PANIC LEVEL set to: ' + PanicLevel);
  console.log('---------------------------------');
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
    
    ShowContinueTitle();
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
  textSize(15); 
  text('click to continue',width/2, height*0.52);
  pop();
}

function DisplayStartImage(pl){
  loadImage('assets/image/'+pl+'.jpg', DrawStartImageCallback);
}

function DrawStartImageCallback(StartImage){
  image(StartImage, windowWidth/2, videoY, windowWidth, hd);

  push();
  noStroke();
  fill('white');
  textSize(20); 
  textAlign(CENTER);
  text('welcome to the field of ANXIETY',width/2, height/2);
  pop();

  // only DEBUG
  //ShowContinueTitle();
}

function mousePressed() {  
  if(fl_allowtoclick == false) {  // dont allow user to click unitl everything be ready
    return;
  }

  if(fl_noLoop == true){        // if start image displayed
                                // then start animation
    setTimeout(function(){
      fl_noLoop = false;
      console.log("Start to draw, 100 ms passed");
  }, 100);
    
    videos[PanicLevel-1].loop();    

  }/* else {    // debug event to change Panic level

    PanicLevel += pl_dir;
    
    if (PanicLevel > 5) {
      pl_dir = -1;
      PanicLevel = 5;
    } 
    
    if(PanicLevel < 1){
      pl_dir = 1;
      PanicLevel = 1;
    }

    console.log('Panic level is ' + str(PanicLevel));
  }*/
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);              //windowWidth/VIDEO_ASPECT);
  updateVideoSize();
  if(fl_noLoop == true){                                // it's mean we still display start picture
    background(0);
    DisplayStartImage(PanicLevel);                     // update pic
    if (fl_allowtoclick == true) ShowContinueTitle();   // check if continue text should be displayed
  }
}

/* ------------------- Draw functions ---------------------------------------------------- */

function drawImage(pl){ // pl - panic level
  
  if(pl != prev_pl){    // if panic level changed
    videos[prev_pl-1].pause();
    videos[pl-1].loop();
    prev_pl = pl;
    console.log('Switch video to' + str(pl-1));
  }

  image(videos[pl-1], windowWidth/2, videoY, windowWidth, hd);
}

function drawTitles(pl){ // fast twit animation
  const TEXT_N_FIELDS = 5;
  const TEXT_X_COORD  = 0.05*width;
  const TEXT_HEIGHT   = 0.9*videoH;
  const TEXT_Y_COORD = (height - videoH)*0.5 + TEXT_X_COORD;//(height - TEXT_HEIGHT)*0.5; 
  const TEXT_WIDTH    = 0.25*width;
  const Y_STEP = TEXT_HEIGHT/TEXT_N_FIELDS;
  const TOTAL_TITLES = Titles.length;

  push();

  noStroke();
  fill('white');
  textSize(18); 
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
  textSize(22);
  textAlign(LEFT);
  text('In the field of anxiety', DESCR_X, DESCR_Y);
  
  textFont(fontRegular);
  text(LevelsMap.get(pl), DESCR_X, DESCR_Y+28);
  textSize(15);
  text(project_descritption, DESCR_X, DESCR_Y+50, 0.25*width, 0.1*height); 
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