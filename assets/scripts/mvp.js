"use strict";

import Conf from '/conf.js';

//let p, v, m;
document.addEventListener('DOMContentLoaded', async function () {
    let m = new Model();
    let p = new Presenter();
    let v = new View(p);
    await m.setDataIntern();
    p.setModelAndView(m, v);
    v.setHandler();
    p.setMenu();
});

// ############# Model ###########################################################################
class Model {
    constructor() {
        this.jsonDataIntern = null; //Data von .json
        this.jsonDataExtern = null; //Data von dem lokalen Server
        this.jsonDataExternHTW = null; //Data von HTW-Server
    }

    async setDataIntern(){ //um Daten von .json zu erhalten
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/assets/scripts/data.json", true);
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        var data = JSON.parse(xhr.responseText);
                        this.jsonDataIntern = data;
                        resolve(data);
                    } else {
                        reject(new Error('Failed to fetch data'));
                    }
                }
            }.bind(this);
            xhr.send();
        });
    }

    async setDataExtern(){
        const id = this.randomInt(1, 10);
        await fetch(`http://${Conf.IP}:${Conf.PORT}/data?id=` + id)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error');
            }
            return response.json();
        })
        .then(data => {
            View.setMessage(null);
            this.jsonDataExtern = data;
        })
        .catch(error => {
            View.setMessage("Error: " + error);
            console.error('Error:', error);
        });
    }

    getDataIntern() {
        return this.jsonDataIntern;
    }
    getDataExtern(){
        return this.jsonDataExtern;
    }
    
    randomInt(min, max){ //random int
        const bucketSize = max;
        const bucketIndex = Math.floor(Math.random() * bucketSize);
        return bucketIndex + min;
    }

    async setDataExternHTW(){ //Datei aufrufen

        const id = this.randomInt(0, 124);

        const url = "https://idefix.informatik.htw-dresden.de:8888/api/quizzes/?page=" + id;

        await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + btoa("test@gmail.com:secret"),
            },
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json()
        })
        .then(results => {
            View.setMessage(null);
            this.jsonDataExternHTW = results;
        })
        .catch((error) => {
            View.setMessage("Error: " + error);
            console.error('Error:', error);
        })
    }
    
    getDataExternHTW(){
        return this.jsonDataExternHTW;
    }

    async checkAnswerExternHTW(id, index){
        const url = "https://idefix.informatik.htw-dresden.de:8888/api/quizzes/" + id + "/solve";
        let answer = [];
        answer.push(index);

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Basic " + btoa("test@gmail.com:secret")
            },
            body: JSON.stringify(answer)
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json()
        })
        .then(results => {
            View.setMessage(results.feedback);
            if(results.success){
                return 1;
            }else{
                return null;
            }
        })
        .catch((error) => {
            View.setMessage("Error: " + error);
            console.error('Error:', error);
            return null;
        });

        return res;
    }
}


class Presenter {
    static maxFehler = 5;
    constructor() {
        this.anr = 0; 
        this.typ = 0; 
        this.rPunkt = 0; 
        this.fPunkt = 0; 
        
        //Type: 1 für Katex, Type: 2 für Noten, Type 3 für den HTW-Server
        this.dataType = null; 

        //Daten vom HTW-Server
        this.dataHTWID = null; 
        this.aufgabeTimerID = null; 
        this.remTime = 0; 
    }

    setModelAndView(m, v) {
        this.m = m;
        this.v = v;
    }

    addSpielTime(time){
        this.remTime += time;
    }

    setSpielTimer(){
        this.addSpielTime(this.getTaskLength() * 3);
        View.setTimeDisplay(this.remTime);
        this.aufgabeTimer = setInterval(() => {
            this.remTime--;
            View.setTimeDisplay(this.remTime);
            if(this.remTime == 0){
                this.v.gameOver("Deine Quiz-Zeit ist abgelaufen! Probiere es gleich noch einmal!");
                clearInterval(this.aufgabeTimer);
            }
        }, 1000);
    }

    mixArrayNr(lang) {  
        let index = [];

        for (let i = 0; i < lang; i++) {
            index.push(i);
        }
      
        
        for (let i = index.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          let temp = index[i];
          index[i] = index[j];
          index[j] = temp;
        }

        return index;
    }

    getDataController(){
        if(this.dataType == 4){
            return this.m.getDataExtern();
        }else if(this.dataType == 3){
            return this.m.getDataExternHTW();
        }else{
            return this.m.getDataIntern()[this.typ];
        }
    }

    async setTaskTyp(typ){ 
        View.setMessage("Lädt Daten *Fahrstuhl Musik*...");
        this.typ = typ;
        this.resetData();
        this.dataType = this.m.getDataIntern()[this.typ].type;
        if(this.dataType == 3){
            await this.m.setDataExternHTW();
        }else if(this.dataType == 4){
            await this.m.setDataExtern();
        }else{
            View.setMessage(null);
        }
    }

    resetData(){
        this.anr = 0;
        this.rPunkt = 0;
        this.fPunkt = 0;
        this.remTime = 0;
        clearInterval(this.aufgabeTimer);
    }

    setMenu(){
        let frag = this.m.getDataIntern();
        frag.forEach((data, index) => {
            this.v.displayMenu(data.name, index); 
        });
    }

    getCurrentMenuName(){
        return this.m.getDataIntern()[this.typ].name;
    }

    getCurrentAufgabeName(){
        if(this.dataType != 3){
            return this.getDataController().name;
        }else{
            return null;
        }
    }

    
    setTask() {
        if(this.dataType == 3){
            let frag = this.getDataController().content[this.anr];

            if(frag && this.fPunkt < this.getTaskLength()){
                this.dataHTWID = frag.id;
                View.setAufgabeTitle(frag.title);
                this.v.renderText(frag.text, null);
                const mixArray = this.mixArrayNr(4);
                mixArray.forEach((data,index)=>{
                    let wert = frag.options[data];
                    this.v.inscribeButtons(data, index, wert, null);
                });
                return 1;
            }else{
                return null;
            }
        }else{
            let frag = this.getDataController().data[this.anr];
            if(frag && this.fPunkt < this.getTaskLength()){ //Presenter.maxFehler
                this.v.renderText(frag.a, this.getDataController().type);
                const mixArray = this.mixArrayNr(4);
                mixArray.forEach((data,index)=>{
                    let wert = frag.l[data];
                    this.v.inscribeButtons(data, index, wert, this.getDataController().type);
                });
                return 1;
            }else{
                return null;
            }
        }
    }

    getTaskLength(){
        if(this.dataType == 3){
            return this.getDataController().content.length;
        }else{
            return this.getDataController().data.length;
        }
    }

    
    async checkAnswer(answer) {
        if(this.dataType == 3){
            if(await this.m.checkAnswerExternHTW(this.dataHTWID, answer)){
                this.rPunkt++;
                this.anr++;
                this.addSpielTime(5);
                return 1;
            }else{
                this.fPunkt++;
                return null;
            }
        }else{
            let frag = this.getDataController().data[this.anr].r;
            if(frag == answer){ 
                this.rPunkt++;
                this.anr++;
                this.addSpielTime(5);
                return 1;
            }else{ 
                this.fPunkt++;
                return null;
            }
        }
    }

    getPunkt(typ){ 
        if(typ){
            return this.rPunkt;
        }else{
            if(this.fPunkt < this.getTaskLength()){ 
                return this.fPunkt;
            }else{
                return this.fPunkt;
            }
        }
    }
}


class View {
    static maingame = document.getElementById("main_game");
    static textmessage = document.getElementById("text_message");

    constructor(p) {
        this.p = p;  // Presenter
        this.AufgabeContainer = null;
        this.answer = null;
        this.rPunkt = null;
        this.fPunkt = null;
    }

    setHandler() { 
        
        View.maingame.textContent = null;
        const current_menu_name = this.p.getCurrentMenuName();
        const start_btn_container = document.createElement("div");
        start_btn_container.classList.add("playBtn_container")
        const start_btn = document.createElement("button");
        start_btn.classList.add("playBtn");
        start_btn.textContent = `Beginne das Quiz: ${current_menu_name}`;
        start_btn_container.append(start_btn);
        View.maingame.append(start_btn_container);

        start_btn.addEventListener("click", this.startGame.bind(this), false);
    }

    //Startet das Spiel
    startGame(){ 
        const html = `
            
            <div class="punkt_bar_container">
                <div class="punkt_bar"><div id="rPunkt">0/${this.p.getTaskLength()}</div></div>
                <div class="punkt_bar"><div id="fPunkt">0/${this.p.getTaskLength()}</div></div>
            </div>

            <div id="aufgabe_control">
                <div>
                    <div class="aufgabe_header">
                        <div>
                            <h3 <span id="aufgabe_title"></span> <span Aufgabenstellung</span></h3>
                        </div>
                        <div class="timer_container">
                            <span>Restzeit: </span>
                            <span id="gameTimer"></span>
                        </div>
                    </div>
                    <div id="boo"></div>
                </div>

                <div id="answer">
                    <button>A</button>
                    <button>B</button>
                    <button>C</button>
                    <button>D</button>
                </div>
            </div>
        `;

        View.maingame.innerHTML = html;

        this.AufgabeContainer = document.getElementById("boo");
        this.answer = document.getElementById("answer");
        this.rPunkt = document.getElementById("rPunkt");
        this.fPunkt = document.getElementById("fPunkt");

        View.setAufgabeTitle(this.p.getCurrentAufgabeName());

        const answerButtons = [...answer.getElementsByTagName("button")]; 
        
        answerButtons.forEach(data => {
            data.onclick = ()=>this.checkEvent(data); 
        });

        this.callTask();
        this.p.setSpielTimer();
    }

    //Ruft die nächste Aufgabe 
    callTask() { 
        if(!this.p.setTask()){
            this.gameOver("Du hast gewonnen!");
        }else{
            View.setMessage("Entscheide dich für die passende Antwort!");
        }
    }

    inscribeButtons(dataNr, i, text, type) { 
        const thisButton = document.querySelectorAll("#answer > *")[i];
        if(type == 1){ 
            katex.render(text, thisButton);
        }else{
            thisButton.textContent = text;
        }
        thisButton.setAttribute("number", dataNr);
    }

    displayMenu(data, index) { 
        const navmenu = document.getElementById("navmenu");
        const menuBtn = document.createElement("button");
        menuBtn.textContent = data;
        navmenu.append(menuBtn);

        menuBtn.onclick = async () => { 
            View.maingame.textContent = null;
            await this.p.setTaskTyp(index);
            this.setHandler();
        }
    }

    //Prüft die Antwort, sofern richtig
    async checkEvent(data) {
        if(await this.p.checkAnswer(Number(data.getAttribute("number")))){ 
            this.callTask();
            const richtigPunkt = this.p.getPunkt(true); 
            this.rPunkt.textContent = richtigPunkt;
            const rImProzent = richtigPunkt / this.p.getTaskLength() * 100
            this.rPunkt.style.width = `${rImProzent}%`;
        }else{
            const fehlerPunkt = this.p.getPunkt(false); 
            const limit = this.p.getTaskLength();

            this.fPunkt.textContent = fehlerPunkt;
            const fImProzent = fehlerPunkt / limit * 100;
            this.fPunkt.style.width = `${fImProzent}%`

            if(limit == fehlerPunkt){ 
                this.gameOver("Game Over...");
            }
        }
    }

    gameOver(text){
        this.clearAufgabe();
        View.setMessage(text);
    }

    clearAufgabe(){
        const aufgabe_control = document.getElementById("aufgabe_control");
        this.clearText(aufgabe_control);
        const endPunkt = document.createElement("p");
        endPunkt.classList.add("endPunkt");
        endPunkt.textContent = "Punktanzahl: " + this.p.getPunkt(true);
        const playagain_btn_container = document.createElement("div");
        playagain_btn_container.classList.add("playBtn_container")
        const playAgain = document.createElement("button");
        playAgain.classList.add("playBtn");
        playAgain.textContent = "Replay";
        playAgain.onclick = () => {
            this.p.resetData();
            
            this.startGame();
        }
        document.getElementById("aufgabe_control").append(endPunkt); 
        playagain_btn_container.append(playAgain);
        document.getElementById("aufgabe_control").append(playagain_btn_container); 
    }

    clearText(item){
        item.textContent = null;
    }

    //Erstellt die Noten 
    drawChord(chord, container) { 
        var renderer = new Vex.Flow.Renderer(container, Vex.Flow.Renderer.Backends.SVG);
        renderer.resize(400, 200);
        var context = renderer.getContext();
        var stave = new Vex.Flow.Stave(10, 40, 300);
        stave.addClef("treble").addKeySignature("C");
        stave.setContext(context).draw();
        var notes = chord.map(note => {
          return new Vex.Flow.StaveNote({clef: "treble", keys: [note], duration: "q"});
        });
        Vex.Flow.Formatter.FormatAndDraw(context, stave, notes);
    }

    renderText(text, type) {
        this.clearText(this.AufgabeContainer);
        if(type == 1){ 
            let p = document.createElement("p");
            katex.render(text, p);
            this.AufgabeContainer.appendChild(p);
        }else if(type == 2){ 
            this.drawChord(text, this.AufgabeContainer);
        }else{ 
            let p = document.createElement("p");
            p.innerHTML = text;
            this.AufgabeContainer.appendChild(p);
        }
    }

    static setMessage(text){
        View.textmessage.textContent = text;
    }

    static setAufgabeTitle(text){
        const aufgabeTitle = document.getElementById("aufgabe_title");
        aufgabeTitle.textContent = text;
    }

    static setTimeDisplay(time){
        const gameTimer = document.getElementById("gameTimer");

        if(gameTimer){
            gameTimer.textContent = String(time).padStart(2, '0');

            if(time <= 5){
                gameTimer.style.color = "red";
            }else{
                gameTimer.style.color = null;
            }
        }
    }
}