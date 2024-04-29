import { render, type RGBA, TEXTURE_FILTER } from '../renderer'

export function addBorder(
  source: Buffer,
  width: number,
  height: number,
  options: {
    frameWidthRatio: number
    enabledTransparentBorder?: boolean
    enabledCornerRemoval?: boolean
  }
) {
  const { enabledTransparentBorder = true, enabledCornerRemoval = true, frameWidthRatio } = options

  return render(
    source,
    width,
    height,
    (coords, texture) => {
      const maxX = width - 1
      const maxY = height - 1
      const x = coords[0]
      const y = coords[1]

      const frameWidth = frameWidthRatio * width

      const samplerColor: RGBA = texture(coords)

      const count =
        Number(x < frameWidth) + Number(y < frameWidth) + Number(x > maxX - frameWidth) + Number(y > maxY - frameWidth)

      if (count !== 0) {
        if (enabledTransparentBorder) {
          samplerColor[3] = 128
        }

        if (count === 2 && enabledCornerRemoval) {
          samplerColor[3] = 0
        }

        return samplerColor
      }

      return samplerColor
    },
    {
      textureFilter: TEXTURE_FILTER.NEAREST
    }
  )
}
