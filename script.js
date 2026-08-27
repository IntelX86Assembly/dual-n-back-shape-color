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
 if(s.shape==="triangle"){els.shape.style.background="transparent";els.shape.style.borderBottomColor=colors[s.color]}
 else{els.shape.style.background=colors[s.color];els.shape.style.borderBottomColor=""}
}
function clearStimulus(){
 els.shape.className="shape";
 els.shape.style.background="transparent";
 els.shape.style.borderBottomColor="";
}
function clearTimers(){clearTimeout(stimulusTimer);clearTimeout(gapTimer);stimulusTimer=null;gapTimer=null}
function status(t){els.status.textContent=t}

function setRunning(r){
 els.startButton.disabled=r;
 els.stopButton.disabled=!r;
 els.shapeButton.disabled=!r;
 els.colorButton.disabled=!r;
}

function startGame(){
 clearTimers();
 game={index:0,sequence:[],responses:[],shapeCorrect:0,shapeWrong:0,colorCorrect:0,colorWrong:0,active:true};
 els.results.classList.add("hidden");
 clearStimulus();
 setRunning(true);
 status("Get ready…");
 els.roundInfo.textContent=`0 / ${config.rounds}`;
 gapTimer=setTimeout(showNext,500);
}

function showNext(){
 if(!game||!game.active)return;
 if(game.index>=config.rounds){finishGame();return}

 const stimulus={shape:randomItem(shapes),color:randomItem(colorNames)};
 const i=game.index;
 game.sequence.push(stimulus);
 game.responses.push({shape:false,color:false});
 game.index++;

 showStimulus(stimulus);
 els.roundInfo.textContent=`Round ${game.index} / ${config.rounds}`;
 status(i<config.n?`Round ${game.index}`:"Match N-back? Press F and/or J");

 /*
  F and J remain enabled for every millisecond of the
  stimulus. The player can respond at any point before
  the stimulus disappears.
 */
 setRunning(true);

 stimulusTimer=setTimeout(endStimulus,config.length*1000);
}

function endStimulus(){
 if(!game||!game.active)return;

 /*
  Disable input first, then remove the shape immediately.
  This guarantees there is no after-image during the gap.
 */
 els.shapeButton.disabled=true;
 els.colorButton.disabled=true;
 clearStimulus();

 scoreCurrentRound();

 if(game.index>=config.rounds){finishGame();return}

 status("Next stimulus…");
 els.roundInfo.textContent=`Round ${game.index} / ${config.rounds}`;

 /*
  No additional gap is inserted: "seconds per stimulus"
  means each stimulus lasts exactly that long.
 */
 gapTimer=setTimeout(showNext,0);
}

function scoreCurrentRound(){
 const i=game.index-1;
 const target=i-config.n;
 if(target<0)return;

 const current=game.sequence[i], previous=game.sequence[target], response=game.responses[i];
 const shapeMatch=current.shape===previous.shape;
 const colorMatch=current.color===previous.color;

 // Match + press OR no match + don't press = correct.
 if(shapeMatch===response.shape)game.shapeCorrect++;
 else game.shapeWrong++;

 if(colorMatch===response.color)game.colorCorrect++;
 else game.colorWrong++;
}

function answer(type){
 if(!game||!game.active)return;

 const i=game.index-1;
 if(i-config.n<0)return;

 const response=game.responses[i];
 if(response[type])return;

 response[type]=true;
 status(type==="shape"?"Shape response recorded":"Color response recorded");
}

function finishGame(){
 clearTimers();
 if(!game)return;

 game.active=false;
 setRunning(false);
 clearStimulus();

 const eligible=Math.max(0,config.rounds-config.n);
 const shapeTotal=game.shapeCorrect+game.shapeWrong;
 const colorTotal=game.colorCorrect+game.colorWrong;

 const sp=shapeTotal?Math.round(game.shapeCorrect/shapeTotal*100):0;
 const sw=shapeTotal?Math.round(game.shapeWrong/shapeTotal*100):0;
 const cp=colorTotal?Math.round(game.colorCorrect/colorTotal*100):0;
 const cw=colorTotal?Math.round(game.colorWrong/colorTotal*100):0;

 status("Game complete");
 els.roundInfo.textContent="Press Start or Space to play again";

 els.overallSummary.innerHTML=`<strong>${config.n}-back complete.</strong><br>${eligible} stimuli were eligible for scoring. The first ${config.n} stimuli were excluded.`;

 els.shapeResults.innerHTML=`<div class="result-percent">${sp}% right</div><div class="result-stat">${game.shapeCorrect} correct</div><div class="result-stat">${sw}% wrong (${game.shapeWrong} incorrect)</div>`;
 els.colorResults.innerHTML=`<div class="result-percent">${cp}% right</div><div class="result-stat">${game.colorCorrect} correct</div><div class="result-stat">${cw}% wrong (${game.colorWrong} incorrect)</div>`;

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
els.shapeButton.addEventListener("click",()=>answer("shape"));
els.colorButton.addEventListener("click",()=>answer("color"));
els.playAgain.addEventListener("click",startGame);

document.addEventListener("keydown",e=>{
 if(e.repeat)return;
 if(e.code==="Space"){
   e.preventDefault();
   if(!game||!game.active)startGame();
   return;
 }
 if(e.key.toLowerCase()==="f"){e.preventDefault();answer("shape");return}
 if(e.key.toLowerCase()==="j"){e.preventDefault();answer("color")}
});

clearStimulus();
setRunning(false);
status("Press Start or Space");
els.roundInfo.textContent="Ready";
