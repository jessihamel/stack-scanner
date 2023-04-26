/**
 * Creates some sample images to demo app.
 * You'll probably want to bring your own .tifs
 */

const sharp = require('sharp')

const IMAGE_DATA_LOCATION = `${__dirname}/../img`
const RESIZED_IMAGE_LOCATION = `${IMAGE_DATA_LOCATION}/reference`

const SAMPLE_IMAGE_HEIGHT = 1500
const SAMPLE_IMAGE_WIDTH = 1000
const SAMPLE_IMAGE_SIZE = SAMPLE_IMAGE_HEIGHT * SAMPLE_IMAGE_WIDTH
const CENTER = [SAMPLE_IMAGE_WIDTH / 2, SAMPLE_IMAGE_HEIGHT / 2]
const RADIUS = 450
const RADIUS_SMALL = 100

const NUMBER_OF_SAMPLE_IMAGES = 3
const images = []
const labelData = []

for (let i = 0; i < NUMBER_OF_SAMPLE_IMAGES; i++) {
  const data = []
  const smallCircleCenter = [
    SAMPLE_IMAGE_WIDTH * ((i + 1) / (NUMBER_OF_SAMPLE_IMAGES + 1)),
    RADIUS_SMALL * 1.5,
  ]
  for (let j = 0; j < SAMPLE_IMAGE_SIZE; j++) {
    const x = j % SAMPLE_IMAGE_WIDTH
    const y = Math.floor(j / SAMPLE_IMAGE_WIDTH)

    const isInSmallCircle =
      Math.hypot(smallCircleCenter[0] - x, smallCircleCenter[1] - y) < RADIUS_SMALL
    const isInCircle = Math.hypot(CENTER[0] - x, CENTER[1] - y) < RADIUS

    if (isInSmallCircle || isInCircle) {
      data[j] = Math.floor(Math.random() * 256)
    } else {
      data[j] = 0
    }

    // Create reference image for overlay
    if (isInSmallCircle || isInCircle) {
      labelData[j] = 255
    } else if (!labelData[j]) {
      labelData[j] = 0
    }
  }
  images.push(data)
}

images.forEach((imageData, i) => {
  const fileName = `${IMAGE_DATA_LOCATION}/${i}.tif`
  sharp(Uint8Array.from(imageData), {
    raw: {
      channels: 1,
      height: SAMPLE_IMAGE_HEIGHT,
      width: SAMPLE_IMAGE_WIDTH,
    },
  })
    .toColorspace('b-w')
    .tiff({
      compression: 'none',
      // Not sure what these magic numbers mean, but it gets us an output resolution of 72,
      // which I think we need...?
      xres: 7.2 / 2.54,
      yres: 7.2 / 2.54,
    })
    .toFile(fileName)
})

sharp(Uint8Array.from(labelData), {
  raw: {
    channels: 1,
    height: SAMPLE_IMAGE_HEIGHT,
    width: SAMPLE_IMAGE_WIDTH,
  },
})
  .png()
  .toFile(`${RESIZED_IMAGE_LOCATION}/overlay.png`)
