/**
 * Sample code for downsizing images
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const IMAGE_DATA_LOCATION = `${__dirname}/../img`
const OUTPUT_DATA_LOCATION = `${__dirname}/../img/downsample`

const RESIZE_WIDTH = 2000

fs.readdir(IMAGE_DATA_LOCATION, function (err, files) {
  if (err) {
    console.log('Unable to scan directory: ' + err)
    return
  }

  const tiffFiles = files.map(f => path.parse(f)).filter(f => f.ext === '.tif')

  if (!tiffFiles.length) {
    console.log('No files found')
    return
  }

  if (!fs.existsSync(OUTPUT_DATA_LOCATION)) {
    fs.mkdirSync(OUTPUT_DATA_LOCATION)
  }

  tiffFiles.forEach(function (file) {
    console.log('downsampling ', file.name)
    const newFileName = file.name + '.tif'
    sharp(`${IMAGE_DATA_LOCATION}/${file.name}${file.ext}`)
      .toColorspace('b-w')
      .resize({ width: RESIZE_WIDTH })
      .tiff({
        compression: 'none',
        xres: 7.2 / 2.54,
        yres: 7.2 / 2.54,
      })
      .toFile(`${OUTPUT_DATA_LOCATION}/${newFileName}`)
  })
  console.log(`Resized images have been created at ${OUTPUT_DATA_LOCATION}`)
})
