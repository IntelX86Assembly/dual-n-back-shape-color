const shapes=["triangle","square","pentagon","hexagon","septagon","octagon","nonagon","circle"];
const colors={purple:"#a970ff",blue:"#36a9ff",green:"#35e18a",yellow:"#ffe34d",orange:"#ff8b32",red:"#ff4568",pink:"#ff58b8",white:"#ffffff"};
const colorNames=Object.keys(colors);

const els={
 menuButton:document.getElementById("menuButton"),settingsPanel:document.getElementById("settingsPanel"),
 nbackInput:document.getElementById("nbackInput"),roundsInput:document.getElementById("roundsInput"),lengthInput:document.getElementById("lengthInput"),
 applySettings:document.getElementById("applySettings"),status:document.getElementById("status"),shape:document.getElementById("shape"),
 shapeButton:document.getElementById("shapeButton"),colorButton:document.getElementById("colorButton"),roundInfo:document.getElementById("roundInfo"),
 startButton:document.getElementById("startButton"),stopButton:document.getElementById("stopButton"),results:document.getElementById("results"),
 overallSummary:document.getElementById("overallSummary"),shapeResults:document.getElementById("shapeResults"),colorResults:document.getElementById("colorResults"),playAgain:document.getElementById("playAgain")
};

let config={n:2,rounds:20,length:2};
let game=null;
let stimulusTimer=null;
let gapTimer=null;

function randomItem(a){return a[Math.floor(Math.random()*a.length)]}

function showStimulus(s){
 els.shape.className=`shape ${s.shape}`;
 if(s.shape==="triangle"){
   els.shape.style.background="transparent";
   els.shape.style.borderBottomColor=colors[s.color];
 }else{
   els.shape.style.background=colors[s.color];
   els.shape.style.borderBottomColor="";
 }
}

function clearStimulus(){
 els.shape.className="shape";
 els.shape.style.background="transparent";
 els.shape.style.borderBottomColor="";
}

function clearTimers(){
 clearTimeout(stimulusTimer);
 clearTimeout(gapTimer);
 stimulusTimer=null;
 gapTimer=null;
}

function status(t){els.status.textContent=t}

function setRunning(r){
 els.startButton.disabled=r;
 els.stopButton.disabled=!r;
 els.shapeButton.disabled=!r;
 els.colorButton.disabled=!r;
}

/*
  Flash the appropriate button when F or J is pressed.
  This gives keyboard users the same visual feedback
  as a mouse click.
*/
function flashButton(button){
 button.classList.remove("keyboard-pressed");
 void button.offsetWidth;
 button.classList.add("keyboard-pressed");
 setTimeout(()=>button.classList.remove("keyboard-pressed"),180);
}

function startGame(){
 clearTimers();

 game={
   index:0,
   sequence:[],
   responses:[],
   shapeMatches:0,
   shapeCorrect:0,
   shapeWrong:0,
   colorMatches:0,
   colorCorrect:0,
   colorWrong:0,
   active:true
 };

 els.results.classList.add("hidden");
 clearStimulus();
 setRunning(true);
 status("Get ready…");
 els.roundInfo.textContent=`0 / ${config.rounds}`;

 gapTimer=setTimeout(showNext,500);
}

function showNext(){
 if(!game||!game.active)return;

 if(game.index>=config.rounds){
   finishGame();
   return;
 }

 const stimulus={
   shape:randomItem(shapes),
   color:randomItem(colorNames)
 };

 const i=game.index;

 game.sequence.push(stimulus);
 game.responses.push({shape:false,color:false});
 game.index++;

 showStimulus(stimulus);

 els.roundInfo.textContent=`Round ${game.index} / ${config.rounds}`;

 if(i<config.n){
   status(`Round ${game.index}`);
 }else{
   status("Match N-back? Press F and/or J");
 }

 setRunning(true);

 stimulusTimer=setTimeout(endStimulus,config.length*1000);
}

function endStimulus(){
 if(!game||!game.active)return;

 els.shapeButton.disabled=true;
 els.colorButton.disabled=true;

 /*
   Remove the shape immediately. Nothing remains
   visible between stimuli.
 */
 clearStimulus();

 /*
   Score only actual repeated stimuli.
 */
 scoreCurrentRound();

 if(game.index>=config.rounds){
   finishGame();
   return;
 }

 status("Next stimulus…");
 els.roundInfo.textContent=`Round ${game.index} / ${config.rounds}`;

 gapTimer=setTimeout(showNext,0);
}

/*
  New scoring system:
  - Only actual N-back matches count.
  - If a shape actually repeats N-back ago, that is one
    shape opportunity.
  - Pressing F on that repeated shape = correct.
  - Not pressing F on that repeated shape = wrong.
  - Non-repeating shapes are NOT included in shape score.
  - Same logic applies independently to color/J.
  - False alarms on non-matches are ignored completely.
*/
function scoreCurrentRound(){
 const i=game.index-1;
 const target=i-config.n;

 if(target<0)return;

 const current=game.sequence[i];
 const previous=game.sequence[target];
 const response=game.responses[i];

 const shapeMatch=current.shape===previous.shape;
 const colorMatch=current.color===previous.color;

 if(shapeMatch){
   game.shapeMatches++;

   if(response.shape){
     game.shapeCorrect++;
   }else{
     game.shapeWrong++;
   }
 }

 if(colorMatch){
   game.colorMatches++;

   if(response.color){
     game.colorCorrect++;
   }else{
     game.colorWrong++;
   }
 }
}

function answer(type){
 if(!game||!game.active)return;

 const i=game.index-1;
 if(i-config.n<0)return;

 const response=game.responses[i];

 /*
   One response per stimulus/type.
 */
 if(response[type])return;

 response[type]=true;
}

function finishGame(){
 clearTimers();
 if(!game)return;

 game.active=false;
 setRunning(false);
 clearStimulus();

 const shapePct=game.shapeMatches
   ? Math.round(game.shapeCorrect/game.shapeMatches*100)
   : 0;

 const colorPct=game.colorMatches
   ? Math.round(game.colorCorrect/game.colorMatches*100)
   : 0;

 const shapeWrongPct=game.shapeMatches
   ? Math.round(game.shapeWrong/game.shapeMatches*100)
   : 0;

 const colorWrongPct=game.colorMatches
   ? Math.round(game.colorWrong/game.colorMatches*100)
   : 0;

 status("Game complete");
 els.roundInfo.textContent="Press Start or Space to play again";

 els.overallSummary.innerHTML=`
   <strong>${config.n}-back complete.</strong><br>
   Only actual N-back repetitions were scored.
   Non-matches and false alarms were not included.
 `;

 els.shapeResults.innerHTML=`
   <div class="result-percent">${shapePct}% right</div>
   <div class="result-stat">${game.shapeCorrect} of ${game.shapeMatches} actual shape repeats guessed correctly</div>
   <div class="result-stat">${shapeWrongPct}% wrong (${game.shapeWrong} missed)</div>
 `;

 els.colorResults.innerHTML=`
   <div class="result-percent">${colorPct}% right</div>
   <div class="result-stat">${game.colorCorrect} of ${game.colorMatches} actual color repeats guessed correctly</div>
   <div class="result-stat">${colorWrongPct}% wrong (${game.colorWrong} missed)</div>
 `;

 if(game.shapeMatches===0){
   els.shapeResults.innerHTML+=`<div class="result-stat">No actual shape repetitions occurred.</div>`;
 }

 if(game.colorMatches===0){
   els.colorResults.innerHTML+=`<div class="result-stat">No actual color repetitions occurred.</div>`;
 }

 els.results.classList.remove("hidden");
}

function stopGame(){
 if(!game)return;

 clearTimers();
 game=null;

 setRunning(false);
 clearStimulus();

 status("Game stopped");
 els.roundInfo.textContent="Press Start or Space";
}

function applySettings(){
 config.n=Math.max(1,Math.min(20,Number(els.nbackInput.value)||2));
 config.rounds=Math.max(1,Math.min(500,Number(els.roundsInput.value)||20));
 config.length=Math.max(.25,Math.min(30,Number(els.lengthInput.value)||2));

 els.nbackInput.value=config.n;
 els.roundsInput.value=config.rounds;
 els.lengthInput.value=config.length;

 closeSettings();
}

function closeSettings(){
 els.settingsPanel.classList.remove("open");
 els.settingsPanel.setAttribute("aria-hidden","true");
 els.menuButton.setAttribute("aria-expanded","false");
}

els.menuButton.addEventListener("click",()=>{
 const open=els.settingsPanel.classList.toggle("open");
 els.settingsPanel.setAttribute("aria-hidden",String(!open));
 els.menuButton.setAttribute("aria-expanded",String(open));
});

els.applySettings.addEventListener("click",applySettings);
els.startButton.addEventListener("click",startGame);
els.stopButton.addEventListener("click",stopGame);

els.shapeButton.addEventListener("click",()=>{
 answer("shape");
 flashButton(els.shapeButton);
});

els.colorButton.addEventListener("click",()=>{
 answer("color");
 flashButton(els.colorButton);
});

els.playAgain.addEventListener("click",startGame);

document.addEventListener("keydown",e=>{
 if(e.repeat)return;

 if(e.code==="Space"){
   e.preventDefault();
   if(!game||!game.active)startGame();
   return;
 }

 if(e.key.toLowerCase()==="f"){
   e.preventDefault();

   if(game&&game.active){
     flashButton(els.shapeButton);
     answer("shape");
   }
   return;
 }

 if(e.key.toLowerCase()==="j"){
   e.preventDefault();

   if(game&&game.active){
     flashButton(els.colorButton);
     answer("color");
   }
 }
});

clearStimulus();
setRunning(false);
status("Press Start or Space");
els.roundInfo.textContent="Ready";
