const express = require('express')
const fs = require('fs')
const path = require('path')
const Tiff = require('tiff')

// Location for the .tiff stacks
const IMAGE_DATA_LOCATION = `${__dirname}/../img`

/**
 * The max number of pixels returned by the server.
 * Increasing this number will slow down the application,
 *   but will make it possible to view larger .tif files
 */
const DATA_SIZE_LIMIT = 1000000

const app = express()

const port = process.env.PORT || 5000

app.use('/', express.static(path.resolve(__dirname, '../build')))

app.use('/api', express.json())
app.use('/img', express.static(IMAGE_DATA_LOCATION))

/**
 * Returns the names of the .tif files at the IMAGE_DATA_LOCATION
 */
app.get('/api/load', (_, res) => {
  fs.readdir(IMAGE_DATA_LOCATION, function (err, files) {
    if (err) {
      res.status(500).json({ message: 'Error loading files' })
      return
    }
    const tiffFiles = files
      .map(f => path.parse(f))
      .filter(f => f.ext === '.tif')
      .map(f => f.name)

    if (!tiffFiles.length) {
      if (err) {
        res.status(500).json({ message: 'Error loading files, no .tif files found' })
        return
      }
    }

    const t0 = Tiff.decode(fs.readFileSync(`${IMAGE_DATA_LOCATION}/${tiffFiles[0]}.tif`))[0]
    const { bitsPerSample, height, width } = t0
    res.json({ bitsPerSample, files: tiffFiles, height, width })
  })
})

app.post('/api', (req, res) => {
  let { distance, imageName, pixelWeight } = req.body

  distance = +distance
  pixelWeight = +pixelWeight

  const t0 = fs.readFileSync(`${IMAGE_DATA_LOCATION}/${imageName}.tif`)

  const tdata = Tiff.decode(t0)['0']

  const thresholdAllowableMin = pixelWeight - distance
  const thresholdAllowableMax = pixelWeight + distance

  const offset = []
  // const v = []

  for (let i = 0; i < tdata.size; i++) {
    if (tdata.data[i] <= thresholdAllowableMax && tdata.data[i] >= thresholdAllowableMin) {
      offset.push(i)
      // v.push(tdata.data[i])
    }
  }
  const data = {
    bitsPerSample: tdata.bitsPerSample,
    height: tdata.height,
    offset: offset.slice(0, DATA_SIZE_LIMIT),
    resolutionUnit: tdata.resolutionUnit,
    size: tdata.size,
    truncated: offset.length > DATA_SIZE_LIMIT,
    xResolution: tdata.xResolution,
    width: tdata.width,
    // v: v.slice(0, DATA_SIZE_LIMIT),
    yResolution: tdata.yResolution,
  }

  res.json({ message: data })
})

app.listen(port, () => console.log(`Listening on port ${port}`))
