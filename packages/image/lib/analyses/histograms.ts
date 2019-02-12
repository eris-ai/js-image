import {IAnnotatedImageData, ImageData} from '../image-data'
import {Colorspace, IHistogramsAnalysis, IHistogramOptions} from '../types'

export function histograms(
  rawImageData: IAnnotatedImageData,
  options?: IHistogramOptions,
): IHistogramsAnalysis {
  const {buckets: numBuckets = 8} = options || {}
  const imageData = ImageData.toColorspace(rawImageData, Colorspace.HSL)

  const hueHistogram: number[] = []
  const saturationHistogram: number[] = []
  const lightnessHistogram: number[] = []
  for (let i = 0; i < numBuckets; i++) {
    hueHistogram[i] = 0
    saturationHistogram[i] = 0
    lightnessHistogram[i] = 0
  }

  const bucketSize = 256 / numBuckets

  for (let x = 0; x < imageData.width; x++) {
    for (let y = 0; y < imageData.height; y++) {
      const index = ImageData.indexFor(imageData, x, y)
      const hue = imageData.data[index]
      const saturation = imageData.data[index + 1]
      const lightness = imageData.data[index + 2]

      const saturationOutOf1 = saturation / 256
      const lightnessOutOf1 = lightness / 256
      const lightnessDistanceToHalf = Math.abs(lightnessOutOf1 - 0.5)
      const trueSaturationOutOf1 = Math.sqrt(saturationOutOf1 * (1 - lightnessDistanceToHalf))
      const trueSaturationBucket = Math.floor((trueSaturationOutOf1 * 256) / bucketSize)

      const hueBucket = Math.floor(hue / bucketSize)
      const lightnessBucket = Math.floor(lightness / bucketSize)

      hueHistogram[hueBucket] += trueSaturationOutOf1
      saturationHistogram[trueSaturationBucket] += 1
      lightnessHistogram[lightnessBucket] += 1
    }
  }

  return {
    hue: hueHistogram.map(n => Math.round(n)),
    saturation: saturationHistogram,
    lightness: lightnessHistogram,
  }
}