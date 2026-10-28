export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

export interface CameraState {
  center: [number, number]
  zoom: number
  pitch: number
  bearing: number
}

/**
 * Opening view: the whole City of Miami Beach, tilted and looking north-north-west
 * up the barrier island. Refined at runtime by fitting the study-area bounds to
 * the actual viewport (see `overviewCamera` in MapView).
 */
export const INITIAL_CAMERA: CameraState = {
  center: [-80.1395, 25.8135],
  zoom: 12.4,
  pitch: 40,
  bearing: -15,
}

export const OBLIQUE = { pitch: 55, bearing: -20 } as const
export const TOP_DOWN = { pitch: 0, bearing: 0 } as const

/** Keep the camera near the processed data — panning far away only shows "no data". */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-80.34, 25.68],
  [-79.92, 25.96],
]

/**
 * Camera bookmarks for the city's three commonly named areas. These only move the
 * camera; no statistics are computed for them (there is no official boundary).
 */
export const AREA_BOOKMARKS = [
  { id: 'south', label: 'South Beach', center: [-80.1345, 25.7835] },
  { id: 'mid', label: 'Mid-Beach', center: [-80.1250, 25.8175] },
  { id: 'north', label: 'North Beach', center: [-80.1225, 25.8600] },
] as const satisfies readonly { id: string; label: string; center: [number, number] }[]
export const BOOKMARK_ZOOM = 15.2

export const MIN_ZOOM = 11.5
export const MAX_ZOOM = 19

export const LOCATION_LABEL = 'City of Miami Beach, Florida'
