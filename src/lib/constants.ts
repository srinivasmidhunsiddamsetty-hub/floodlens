export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

export interface CameraState {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

/** Oblique overview of South Beach — Collins Ave / Flamingo Park in frame. */
export const INITIAL_CAMERA: CameraState = {
  center: [-80.1372, 25.7788],
  zoom: 14.2,
  pitch: 55,
  bearing: -20,
}

export const OBLIQUE = { pitch: 55, bearing: -20 } as const
export const TOP_DOWN = { pitch: 0, bearing: 0 } as const

/** Keep the camera near the processed data — panning far away only shows "no data". */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-80.32, 25.66],
  [-79.95, 25.9],
]
export const MIN_ZOOM = 11.5
export const MAX_ZOOM = 19

export const LOCATION_LABEL = 'Miami Beach, Florida'
