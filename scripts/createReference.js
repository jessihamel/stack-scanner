/**
 * Creates down sampled reference .jpg files for the files at the image data location
 *   and writes them to ./img/reference in the file
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const IMAGE_DATA_LOCATION = `${__dirname}/../img`

const RESIZED_IMAGE_LOCATION = `${IMAGE_DATA_LOCATION}/reference`

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

  if (!fs.existsSync(RESIZED_IMAGE_LOCATION)) {
    fs.mkdirSync(RESIZED_IMAGE_LOCATION)
  }

  tiffFiles.forEach(function (file) {
    console.log('converting ', file.name)
    const newFileName = file.name + '.jpg'
    sharp(`${IMAGE_DATA_LOCATION}/${file.name}${file.ext}`)
      .resize({ width: RESIZE_WIDTH })
      .jpeg()
      .toFile(`${RESIZED_IMAGE_LOCATION}/${newFileName}`)
  })
})
