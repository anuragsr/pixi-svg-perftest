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

    resetViewport()
  }
  clear() {
    this.removeChild(this.bg, this.line)
  }
}

class Outline extends Graphics {
  constructor(opts) {
    super()
    // Required
    this.type = opts.type
    this.drawHeight = opts.drawHeight
    this.drawWidth = opts.drawWidth

    // Optional
    this.color = opts.color || 0x000000
    this.thickness = opts.thickness || 2
    this.fillAlpha = opts.fillAlpha || 0
    this.padding = opts.padding || 5

    if (opts.startX !== 0) this.startX = -(this.drawWidth + this.padding) / 2
    else this.startX = opts.startX - this.padding

    if (opts.startY !== 0) this.startY = -(this.drawHeight + this.padding) / 2
    else this.startY = opts.startY - this.padding

    this.visible = false

    this.draw()
  }
  draw() {
    const { color, fillAlpha, thickness, drawHeight, drawWidth, padding } = this,
      gr = this.lineStyle(thickness, color, 1).beginFill(color, fillAlpha)

    let width, height, startX, startY

    width = drawWidth + padding
    height = drawHeight + padding
    startX = this.startX
    startY = this.startY

    gr.drawRect(startX, startY, width, height)
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

app.ctn = ctn

const bg = new Background({
  url: './assets/bg.svg',
  width: 15000,
  height: 15000,
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

const addObject = async (url, position, scale) => {
  const obj = await new PIXIFloorplanSVG({ url }).init()

  const bounds = obj.getBounds()
  obj.zIndex = 1
  obj.pivot.set(bounds.width / 2, bounds.height / 2)
  obj.scale.set(scale)
  obj.position.set(position[0], position[1])
  obj.cursor = 'pointer'
  obj.interactive = true

  ctn.addChild(obj)

  // Outline
  const pad = 5
  const outline = new Outline({
    type: 'svg',
    padding: pad,
    fillAlpha: 0.1,
    startX: bounds.x - bounds.width / 2 - pad,
    startY: bounds.y - bounds.height / 2 - pad,
    drawHeight: bounds.height + pad,
    drawWidth: bounds.width + pad,
  })

  obj.outline = outline
  outline.position.set(position[0], position[1])
  ctn.addChild(outline)
}

const getRandomInt = (min, max) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const addDesks = () => {
  for (let i = 0; i < 33; i++) {
    const randomX = getRandomInt(0, 15000),
      randomY = getRandomInt(0, 15000)
    addObject(
      'https://res.cloudinary.com/https-artishok-io/image/upload/v1675151578/map-svg/desk-4_vn5rsv.svg',
      [randomX, randomY],
      1
    )
  }

  for (let i = 0; i < 33; i++) {
    const randomX = getRandomInt(0, 15000),
      randomY = getRandomInt(0, 15000)
    addObject(
      'https://res.cloudinary.com/https-artishok-io/image/upload/v1675151578/map-svg/desk-3_aaaa0q.svg',
      [randomX, randomY],
      1
    )
  }

  for (let i = 0; i < 34; i++) {
    const randomX = getRandomInt(0, 15000),
      randomY = getRandomInt(0, 15000)
    addObject(
      'https://res.cloudinary.com/https-artishok-io/image/upload/v1675151578/map-svg/desk-2_plgvf1.svg',
      [randomX, randomY],
      1
    )
  }
}

const addChairs = () => {
  for (let i = 0; i < 50; i++) {
    const randomX = getRandomInt(0, 15000),
      randomY = getRandomInt(0, 15000)
    addObject('./assets/Chair1.svg', [randomX, randomY], 1)
  }

  for (let i = 0; i < 50; i++) {
    const randomX = getRandomInt(0, 15000),
      randomY = getRandomInt(0, 15000)
    addObject('./assets/Chair2.svg', [randomX, randomY], 1)
  }
}

const clear = () => {
  while (ctn.children.length > 1) {
    const child = ctn.children[ctn.children.length - 1]
    if (child.name !== 'bg') ctn.removeChild(child, child.outline)
  }
}

document.querySelector('#addDesks').addEventListener('click', addDesks, false)
document.querySelector('#addChairs').addEventListener('click', addChairs, false)
document.querySelector('#clear').addEventListener('click', clear, false)

window.app = app
