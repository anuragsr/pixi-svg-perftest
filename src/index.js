import { Application } from "pixi.js"
import GameStats from "gamestats.js"
import "@/styles/index.scss"

const canvasCtn = document.querySelector("#ctn-pixi")
  , bb = canvasCtn.getBoundingClientRect()
  , app = new Application({
    antialias: true,
    width: bb.width,
    height: bb.height,
    backgroundAlpha: 0,
    resizeTo: canvasCtn,
  })

canvasCtn.appendChild(app.view)