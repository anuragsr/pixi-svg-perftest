import * as PIXI from 'pixi.js'
import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Ticker,
  PRECISION,
  UPDATE_PRIORITY,
} from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import { SVGScene } from '@pixi-essentials/svg'

import GameStats from 'gamestats.js'
import '@/styles/index.scss'

class PIXIFloorplanSVG {
  constructor(opts) {
    this.url = opts.url
  }

  async init() {
    const result = await SVGScene.from(this.url)
    const bounds = result.getBounds()
    result.zIndex = 0
    result.hitArea = new Rectangle(0, 0, bounds.width, bounds.height)
    return result
  }
}

class Background extends Container {
  constructor(opts) {
    super()
    this.zIndex = 0
    this.interactive = true
    this.buttonMode = true
    this.name = 'bg'
    this.cursor = 'grab'
    this.draw(opts.url, opts.width, opts.height)
  }
  async draw(url, width, height) {
    let bg

    this.bgWidth = width
    this.bgHeight = height
    this.clear()

    bg = await new PIXIFloorplanSVG({ url }).init()

    const line = new Graphics()
    if (this.bgWidth) bg.width = this.bgWidth
    if (this.bgHeight) bg.height = this.bgHeight

    line.clear().lineStyle(2, 0x000000).drawRect(0, 0, bg.width, bg.height)

    this.bg = bg
    this.line = line
    this.addChild(bg, line)
  }
  clear() {
    this.removeChild(this.bg, this.line)
  }
}

PIXI.Program.defaultFragmentPrecision = PRECISION.HIGH

const canvasCtn = document.querySelector('#ctn-pixi'),
  bb = canvasCtn.getBoundingClientRect(),
  app = new Application({
    antialias: true,
    width: bb.width,
    height: bb.height,
    backgroundAlpha: 0,
    resizeTo: canvasCtn,
  })

canvasCtn.appendChild(app.view)

// For FPS
const stats = new GameStats()
stats.dom.setAttribute('id', 'stats')
app.stop()

Ticker.shared.add(() => {
  stats.begin()
  app.renderer && app.render()
  stats.end()
}, UPDATE_PRIORITY.LOW)

Ticker.shared.start()

const viewport = new Viewport({
  screenWidth: bb.width,
  screenHeight: bb.height,
  worldWidth: bb.width,
  worldHeight: bb.height,
  // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
  // interaction: app.renderer.plugins.interaction,
  interaction: app.renderer.events,
})

// Add the viewport to the stage
app.stage.addChild(viewport)
// Activate plugins
viewport.drag().pinch().wheel()

const ctn = new Container()
ctn.interactive = true
ctn.sortableChildren = true
ctn.name = 'Main'
viewport.addChild(ctn)

const bg = new Background({
  url: '/assets/bg.svg',
  width: 2048,
  height: 2048,
})

ctn.addChild(bg)

const resetViewport = () => {
  const w1 = viewport.screenWidth,
    h1 = viewport.screenHeight

  let w2, h2

  if (bg) {
    w2 = bg.width
    h2 = bg.height
  } else {
    w2 = w1
    h2 = h1
  }
  // l(h1, w1, h2, w2)

  let x,
    y,
    scale = 1

  if (h1 > h2) {
    // Viewport screen height bigger than bg height
    if (w1 < w2) {
      // Viewport screen width smaller than bg width
      scale = w1 / w2
    }
  } else {
    // Viewport screen height smaller than bg height
    scale = h1 / h2
    if (w1 < w2) {
      // Viewport screen width smaller than bg width
      scale = Math.min(scale, w1 / w2)
    }
  }

  x = w2 / 2
  y = h2 / 2

  try {
    viewport.animate({
      time: 200,
      scale: scale * 0.9,
      position: { x, y },
    })
  } catch (err) {
    // l(err);
  }
}

// viewport.on('wheel', (e) => console.log(e))
window.viewport = viewport
window.resetViewport = resetViewport
