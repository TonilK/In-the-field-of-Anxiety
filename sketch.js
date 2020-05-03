let canvas;
let PANIC_LEVEL = 5; // 5 - very nervous, 1 - totally calm
let prev_pl = PANIC_LEVEL; // store previous panic level to detect changes
let pl_dir = -1;
// -------------------- Video vatiables ----------------------------------------
let videos = [];
let whichVideo = 0;
let button;
let currvideo = 0;
let Nv = 5; // total nums of video
let video_aspect = 16/9;
let wd,hd,videoY;    // wd - dispaly width, hd - display height, videoY - Y coordinate of video texture to align pic by bottom of the screen 

// -------------------- Twitter data variables --------------------------------
let dataObj = {}; // Global object to hold results from the loadJSON call
let data = [];
let tags = []; // global array of tags
let tags_color = []; // tags color
let tags_select = []; // tags color
let t_accname = [];
let t_dispname = [];
let texts = [];
let tind = [0,1,2,3,4,5];

// -------------------- Text Draw setings -------------------------------------
let project_descritption;
let drawtags_counter = 0;
let TAGS_UPATE_SPEED = 30;
let drawtext_counter = 0;
let TEXT_UPATE_SPEED = 30;
let TWIT_SPEED = 5;

let fontRegular, fontBold;
let TEXT_N_FIELDS = 5;

let newTwit = 0; // select random twit from buffer
let fl_startTwitAnomation = false;
let fl_TwitAnimationEnd = true;

const Levels = [  [1, 'calm'],
[2, 'Concerned'],
[3, 'Worried'],
[4, 'NERVOUS'],
[5, 'ANXIOUS']];


const LevelsMap = new Map(Levels);
let vid,fl_play;
let fl_noLoop = true;
let wlc_img;
/* ============================================================================= */
/* ============================================================================= */
function preload() {
  console.log('Preload begin');
  
  for (let i = 0; i < Nv; i++) {    
      videos.push(createVideo('assets/video/'+str(i+1)+'.mp4')); //(i,fl_pl));
      videos[i].hide();
  }

  /*project_descritption = */loadStrings('assets/description.txt', txtLoaded);
  dataObj = loadJSON('assets/twt_data.json');
  fontRegular = loadFont('assets/font/AvenirNextCyr-Regular.ttf');
  fontBold = loadFont('assets/font/AvenirNextCyr-Bold.ttf');

  wlc_img = loadImage('assets/image/'+PANIC_LEVEL+'.jpg',);
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
  updateTwitterData();


  image(wlc_img, windowWidth/2, videoY, wd, hd);
  
  noStroke();
  fill('white');
  textSize(20); 
  textAlign(CENTER);
  text('welcome to the field of ANXIETY',width/2, height/2);
  
  textSize(15); 
  text('click to continue',width/2, height*0.52);
  
  textAlign(LEFT);
  console.log('Setup end');

}


function draw() {
  if (fl_noLoop == false) {
    background(0);
    drawImage(PANIC_LEVEL);
    drawTags(PANIC_LEVEL);
    drawText(PANIC_LEVEL);
    drawDescr(PANIC_LEVEL);
  }
}

/* ----------------- EVENTS -------------------------------------------------------------- */

function mousePressed() {  // debug event to change Panic level

  if(fl_noLoop == true){
    
    setTimeout(function(){
      fl_noLoop = false;
      console.log("Start to draw, 100 ms passed");
  }, 100);
    

    videos[PANIC_LEVEL-1].loop();
    

  } else {

    PANIC_LEVEL += pl_dir;
    
    if (PANIC_LEVEL > 5) {
      pl_dir = -1;
      PANIC_LEVEL = 5;
    } 
    
    if(PANIC_LEVEL < 1){
      pl_dir = 1;
      PANIC_LEVEL = 1;
    }

    console.log('Panic level is ' + str(PANIC_LEVEL));
  }
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);//windowWidth/video_aspect);
  //canvas.position(0,0);
  /*
  for(let i = 0;  i < Nv; i++){
    videos[i].size(windowHeight*video_aspect, windowHeight);
  }*/

  updateVideoSize();
}

function keyPressed(){
  //canvas.clear();
  addNewTwit();
}

function vidload() {
  console.log('Video loaded');
 // videos[fl_play].hide()
  //vid.play();
}

function txtLoaded(result) {
  console.log('Description text loaded');
  project_descritption = result;
}
/* ------------------- Draw functions ---------------------------------------------------- */
function updateTwitterData(){
  let data = dataObj["data"];

  for(let i = 0; i < data.length; i++){
    tags.push(data[i]['tag']);
    t_accname.push(data[i]['account']);
    t_dispname.push(data[i]['account']);
    texts.push(data[i]['text']);
  }
}

function drawImage(pl){ // pl - panic level
  
  if(pl != prev_pl){    // if panic level changed
    videos[prev_pl-1].pause();
    videos[pl-1].loop();
    prev_pl = pl;
    console.log('Switch video to' + str(pl-1));
  }

  image(videos[pl-1], windowWidth/2, videoY, wd, hd);
}

function drawTags(pl){
  let text_x = 4*width/5;
  let text_y = 0.07*height;
  let step_y = 30;
  let flags = [];

  if(drawtags_counter++ > TAGS_UPATE_SPEED) {
    drawtags_counter = 0;

    for(let i=0;i<tags.length;i++){
      tags_color[i] = true;
      if(random(10) < pl){  // create false flag with probability propotional to panic level
        tags_color[i] = false;
      }
    }

    shuffle(tags,true);
    TAGS_UPATE_SPEED = int(random([25,50,100,150,200,250])/pl);
    return;
  }

  push();
  noStroke();
  fill('white');
  textSize(18);
  for(let i=0;i<tags.length;i++){
    if(tags_color[i]) { text(tags[i],text_x,text_y + step_y*i); }    
  }
  pop();
}

function drawText(pl){ // fast twit animation
  let TEXT_X_COORD  = 0.05*width;
  let TEXT_Y_COORD  = 0.07*height;
  let TEXT_HEIGHT   = 0.9*height;
  let TEXT_WIDTH    = 0.3*width;
  let Y_STEP = TEXT_HEIGHT/TEXT_N_FIELDS;
 
  push();

  noStroke();
  fill('white');
  textSize(18); 
  textAlign(LEFT);
 

  if(drawtext_counter++ > TEXT_UPATE_SPEED) {
    drawtext_counter = 0;
    TEXT_UPATE_SPEED = int(random(200/pl));
    tind.pop(); // delete last one
    tind.unshift(  int(random(20)) ); // select random twit from buffer
  }

  if(fl_startTwitAnomation) {
    console.log('Start new animation');
    fl_startTwitAnomation = false;
    tind.pop(); // delete last one
    tind.unshift( newTwit ); // select random twit from buffer
  }


  for(let i=0;i<TEXT_N_FIELDS;i++){
    let ci = tind[i]; // current index
    let y = TEXT_Y_COORD + i*Y_STEP;

    // draw name
    textFont(fontBold);
    text(t_dispname[ci], TEXT_X_COORD, y,TEXT_WIDTH, 25);

    //draw account name
    textFont(fontRegular);
    text('\t@'+t_accname[ci], TEXT_X_COORD + textWidth(t_dispname[ci]), y, TEXT_WIDTH, 25);

    // draw twit text
    text(texts[ci], TEXT_X_COORD, y + 25, TEXT_WIDTH, Y_STEP - 50);
  }

  pop();
}

function drawDescr(pl){
  let DESCR_X = 0.7*width;
  let DESCR_Y = 0.8*height;

  push();
  noStroke();
  fill('white');
  textFont(fontBold);
  textSize(22);
  text('In the field of anxiety', DESCR_X, DESCR_Y);
  
  textFont(fontRegular);
  text(LevelsMap.get(pl), DESCR_X, DESCR_Y+28);
  textSize(15);
  text(project_descritption, DESCR_X, DESCR_Y+50, 0.25*width, 0.1*height); 
  pop();

}

function addNewTwit() {
  newTwit = int(random(20)); // select random twit from buffer
  fl_startTwitAnomation = true;
  console.log('addNewTwit');
}

function updateVideoSize(){

  wd = windowWidth;
  hd = wd/video_aspect;
  videoY = windowHeight/2;
  if(hd > windowHeight) {
    videoY -=  (hd - windowHeight)/2;
  }

  /*
  let vH = windowWidth/video_aspect;
  let vY = 0;
  if(vH > windowHeight) {
    vY -=  (vH - windowHeight);
  }
  for(let i = 0;  i < Nv; i++){
    videos[i].size(windowWidth, vH);
    videos[i].position(0,vY);
  }*/

  //hd = windowHeight - 2*r;
  //wd = hd*video_aspect;
}