import { COORDINATE_SYSTEM, DeckGL, OrthographicView, ScatterplotLayer } from 'deck.gl'
import React, { useMemo } from 'react'

function Renderer({ data, markerSize, setViewState, viewState }) {
  // Create data for deck.gl class
  const scatterData = useMemo(() => {
    const { width, offset } = data
    const sData = []
    for (let i = 0; i < offset.length; i++) {
      const y = Math.floor(offset[i] / width)
      const x = offset[i] % width
      sData.push([x, y])
    }
    return sData
  }, [data])

  const scaledMarkerSize = useMemo(() => markerSize / 2, [markerSize])

  const layers = [
    new ScatterplotLayer({
      coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
      id: 'scatterplot-layer',
      data: scatterData,
      opacity: 1,
      stroked: false,
      filled: true,
      // radiusScale: radiusScale * 2,
      radiusMinPixels: 0.25,
      sizeUnits: 'pixels',
      getPosition: d => d,
      getRadius: scaledMarkerSize,
      getFillColor: [0, 0, 0],
      updateTriggers: {
        getRadius: [scaledMarkerSize],
      },
    }),
  ]

  return (
    <DeckGL
      controller={true}
      layers={layers}
      onViewStateChange={e => setViewState(e.viewState)}
      style={{ height: '100%', width: '100%' }}
      views={
        new OrthographicView({
          flipY: true,
        })
      }
      viewState={viewState}
    />
  )
}

export default React.memo(Renderer)
