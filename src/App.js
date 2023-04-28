import { useEffect, useRef, useMemo, useState, useLayoutEffect } from 'react'
import './App.css'
import debounce from 'lodash.debounce'
import Renderer from './Components/Renderer'

const VERSION = '0.1.0'

const BIT_WEIGHT_MAX_16 = 65535
const BIT_WEIGHT_MAX_8 = 255

const REFERENCE_IMAGE_SOURCE = '/img/reference/overlay.png'

function getViewState(fileData, renderWidth) {
  const zoom = renderWidth ? Math.log2(renderWidth / fileData.width) : 1
  return {
    target: [fileData.width / 2, fileData.height / 2, 0],
    zoom: zoom,
    minZoom: zoom - 1,
    maxZoom: zoom + 40,
  }
}

function App() {
  // Will hold the names of the .tif files we're using
  const [tiffs, setTiffs] = useState([])

  // Metadata about the .tif files loaded
  const [fileData, setFileData] = useState({ bitsPerSample: 0, height: 0, width: 0 })
  const [fileDataLoaded, setFileDataLoaded] = useState(false)

  // UI controls state
  const [activeTiff, setActiveTiff] = useState(null)
  const [pixelWeight, setPixelWeight] = useState(0)
  const [distance, setDistance] = useState(20)
  const [markerSize, setMarkerSize] = useState(1)
  // Updates more slowly than the UI to increate performance
  const [markerSizeDebounced, setMarkerSizeDebounced] = useState(1)
  const [showReference, toggleshowReference] = useState(false)

  // Image viewer state
  const [loading, setLoading] = useState(false)
  const [renderWidth, setRenderWidth] = useState(0)
  const [initialViewState, setInitialViewState] = useState(getViewState(fileData, renderWidth))
  const [viewState, setViewState] = useState(getViewState(fileData, renderWidth))

  // Holds the return data from the server
  const [data, setData] = useState({
    height: 100,
    width: 100,
    offset: [],
    truncated: false,
    size: 0,
  })

  // Will be used to calculate aspect ratios
  const glWrapper = useRef(null)

  // Load information about the images on app mount
  useEffect(() => {
    fetch('/api/load')
      .then(res => res.json())
      .then(data => {
        const { bitsPerSample, files, height, width } = data
        setTiffs(files)
        setFileData({ bitsPerSample, height, width })
        setActiveTiff(data.files[0])
        setPixelWeight(
          Math.floor((bitsPerSample === 16 ? BIT_WEIGHT_MAX_16 : BIT_WEIGHT_MAX_8) * 0.8)
        )
        setFileDataLoaded(true)
      })
  }, [])

  // Main function for handling api calls
  const debouncedFetch = useMemo(() => {
    return debounce(
      ({ activeTiff, distance, pixelWeight }) => {
        setLoading(true)
        return fetch('/api', {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distance,
            imageName: activeTiff,
            pixelWeight,
          }),
          method: 'POST',
        })
          .then(res => res.json())
          .then(data => {
            setData(data.message)
            setLoading(false)
          })
      },
      500,
      { leading: false, trailing: true }
    )
  }, [])

  // Effect that determins whether we need to make an api call
  useEffect(() => {
    if (!activeTiff) {
      return
    }
    debouncedFetch({ activeTiff, pixelWeight, distance })
  }, [activeTiff, debouncedFetch, distance, pixelWeight])

  // Throttle marker size updates
  const debouncedSetMarkerSize = useMemo(() => {
    return debounce(
      markerSize => {
        setMarkerSizeDebounced(markerSize)
      },
      500,
      { leading: false, trailing: true }
    )
  }, [])

  // Used to calculate aspect ratio of window on window resize
  // This keeps the image centered
  useLayoutEffect(() => {
    function _measure() {
      if (!glWrapper.current) {
        debugger
        return
      }
      const { width } = glWrapper.current.getBoundingClientRect()
      setRenderWidth(width)
    }
    _measure() // Measure once on first layout
    const debouncedMeasure = debounce(_measure, 500, { leading: true, trailing: true })
    window.addEventListener('resize', debouncedMeasure)
    return function cleanup() {
      window.removeEventListener('resize', debouncedMeasure)
    }
  }, [])

  // If we have resized, update gl view state
  useEffect(() => {
    const viewState = getViewState(fileData, renderWidth)
    setInitialViewState(viewState)
    setViewState(viewState)
  }, [fileData, renderWidth])

  const referenceTransform = useMemo(() => {
    const t = initialViewState.target
    const v = viewState.target
    const aspectRatio = fileData.width ? renderWidth / fileData.width : 1
    const scaleDifference = 2 ** (viewState.zoom - initialViewState.zoom)
    const transform = {
      scale: scaleDifference,
      x: (t[0] - v[0]) * aspectRatio * scaleDifference,
      y: (t[1] - v[1]) * aspectRatio * scaleDifference,
    }
    return `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
  }, [fileData, initialViewState, renderWidth, viewState])

  return (
    <div className="App">
      <h1>
        Stack Scanner<span className="version">{` v${VERSION}`}</span>
      </h1>
      <div className="controls">
        <div className="control-row ">
          <div className="tiff-selector">
            <div className="label">Select Tiff</div>
            {!fileDataLoaded && <div className="loading">Loading...</div>}
            {tiffs.map(t => {
              return (
                <div key={t} style={{ display: 'inline-block' }}>
                  <input
                    style={{ transform: 'translateX(-4px' }}
                    type="radio"
                    id={t}
                    value={t}
                    onChange={event => setActiveTiff(event.target.value)}
                    checked={t === activeTiff}
                  />
                  <div>{t}</div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="control-row">
          <div className="control-item">
            <div className="label">Pixel Weight ({pixelWeight})</div>
            <input
              type="range"
              min={0}
              max={fileData.bitsPerSample === 16 ? BIT_WEIGHT_MAX_16 : BIT_WEIGHT_MAX_8}
              onChange={event => setPixelWeight(event.target.value)}
              value={pixelWeight}
            />
          </div>
          <div className="control-item">
            <div className="label">Distance ({distance})</div>
            <input
              type="range"
              min={0}
              max={fileData.bitsPerSample === 16 ? BIT_WEIGHT_MAX_16 : BIT_WEIGHT_MAX_8}
              onChange={event => setDistance(event.target.value)}
              value={distance}
            />
          </div>
          <div className="control-item">
            <div className="label">Marker Size ({markerSize})</div>
            <input
              type="range"
              min={0.25}
              max={5}
              step={0.25}
              onChange={event => {
                setMarkerSize(event.target.value)
                debouncedSetMarkerSize(event.target.value)
              }}
              value={markerSize}
            />
          </div>
          <div className="control-item">
            <div className="label">Show Reference Overlay</div>
            <input
              type="checkbox"
              checked={showReference}
              onChange={() => toggleshowReference(!showReference)}
            />
          </div>
        </div>
      </div>
      <div className="wrapper">
        <div ref={glWrapper} style={{ overflow: 'hidden', position: 'relative', width: '50%' }}>
          <img
            alt=""
            src={REFERENCE_IMAGE_SOURCE}
            style={{
              transition: 'opacity 0.3s ease-in-out',
              opacity: showReference ? 0.2 : 0,
              position: 'absolute',
              transform: referenceTransform,
              width: '100%',
            }}
          />
          {fileDataLoaded && (
            <div
              style={{
                height: `${fileData.height / (fileData.width / renderWidth)}px`,
                position: 'absolute',
                width: '100%',
              }}
            >
              <div className="renderer-controls">
                <button onClick={() => setViewState(initialViewState)}>Reset Zoom</button>
              </div>
              <Renderer
                data={data}
                markerSize={markerSizeDebounced}
                setViewState={setViewState}
                viewState={viewState}
              />
            </div>
          )}
          {loading && <div className="loading">Loading...</div>}
          {!loading && data.truncated && (
            <div className="warning">
              The data returned from this image has been truncated due to file size limits. Please
              try either narrowing the filter distance or using smaller source images.
            </div>
          )}
        </div>
        <div className="reference">
          {fileDataLoaded && (
            <div
              style={{
                height: `${fileData.height / (fileData.width / renderWidth)}px`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: `${fileData.height / (fileData.width / renderWidth)}px`,
                  position: 'relative',
                  transform: referenceTransform,
                }}
              >
                <img alt="" src={`/img/reference/${activeTiff}.jpg`} />
                <img
                  alt=""
                  src={REFERENCE_IMAGE_SOURCE}
                  style={{
                    opacity: showReference ? 0.2 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
