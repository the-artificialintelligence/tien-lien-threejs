import { GameEngine } from './core/GameEngine.js';
const engine = new GameEngine({containerSelector:'#canvas-container',width:window.innerWidth,height:window.innerHeight});
engine.start();
window.addEventListener('resize',()=>{engine.resize(window.innerWidth,window.innerHeight);});