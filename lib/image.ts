import * as types from './types'
import {ImageData} from './image-data'
import {writeFileAsync} from './fs-utils'
import {sobel} from './transforms/sobel'
import {phash} from './analyses/hash'
import {sharpness as computeSharpness} from './analyses/sharpness'
import {Decoder as RawDecoder} from 'raw-decoder'

/* tslint:disable-next-line */
const fileType = require('file-type')

export abstract class Image {
  // Image formats
  public static JPEG: types.ImageFormat = 'jpeg'
  public static PNG: types.ImageFormat = 'png'

  // Image resize fits
  public static AUTO_SIZE: types.ImageResizeFit = 'auto'
  public static CONTAIN: types.ImageResizeFit = 'contain'
  public static COVER: types.ImageResizeFit = 'cover'
  public static EXACT: types.ImageResizeFit = 'exact'
  public static CROP: types.ImageResizeFit = 'crop'

  // Image resize methods
  public static NEAREST_NEIGHBOR: types.ImageResizeMethod = 'nearestNeighbor'
  public static BILINEAR: types.ImageResizeMethod = 'bilinear'

  // Edge detection methods
  public static SOBEL: types.EdgeMethod = 'sobel'
  public static CANNY: types.EdgeMethod = 'canny'

  // Hash methods
  public static PHASH: types.HashMethod = 'phash'

  protected _output: types.IImageOutputOptions
  protected _analyze?: types.IAnalysisOptions

  public constructor() {
    this._output = {
      format: {type: 'jpeg'},
    }
  }

  public format(options: types.ImageFormat|types.IFormatOptions): Image {
    if (typeof options === 'string') {
      options = {type: options}
    }

    if (options.type !== Image.JPEG && options.type !== Image.PNG) {
      throw new Error(`Unrecognized format: ${options.type}`)
    }

    const defaultOpts = options.type === Image.JPEG ? {quality: 90} : {}
    this._output.format = Object.assign(defaultOpts, options)
    return this
  }

  public resize(options: types.IResizeOptions): Image {
    if (!options.width && !options.height && !options.subselect) {
      throw new TypeError('Must specify a width, height, or subselect')
    }

    if ((!options.width || !options.height) && options.fit && options.fit !== Image.EXACT) {
      throw new TypeError(`Must specify width and height with "${options.fit}" fit`)
    }

    this._output.resize = Object.assign({
      fit: Image.EXACT,
      method: Image.BILINEAR,
    }, options)
    return this
  }

  public greyscale(): Image {
    this._output.greyscale = true
    return this
  }

  public edges(method: types.EdgeMethod|types.IEdgeOptions = Image.SOBEL): Image {
    let options = method as types.IEdgeOptions
    if (typeof method === 'string') {
      options = {method}
    }

    this._output.edges = Object.assign({
      radius: 1,
      blurSigma: 2,
    }, options)
    return this
  }

  public analyze(options: types.IAnalysisOptions): Image {
    this._analyze = options
    return this
  }

  public toAnalysis(): Promise<types.IAnalysis> {
    if (!this._analyze) {
      return Promise.resolve({})
    }

    const {hash, sharpness} = this._analyze
    return this.toImageData().then(imageData => {
      const analysis: types.IAnalysis = {}
      if (hash) {
        switch (hash.method) {
          case Image.PHASH:
          default:
            analysis.hash = phash(imageData, hash.hashSize)
        }
      }

      if (sharpness) {
        const edges = sobel(imageData, sharpness)
        analysis.sharpness = computeSharpness(edges, sharpness)
      }

      return analysis
    })
  }

  public abstract toMetadata(): Promise<types.IMetadata>

  public abstract toImageData(): Promise<ImageData>

  public abstract toBuffer(): Promise<types.BufferLike>

  public toFile(path: string): Promise<{}> {
    return this.toBuffer().then(buffer => writeFileAsync(path, buffer))
  }

  public static from(bufferOrImageData: types.BufferLike|ImageData): Image {
    if (ImageData.probablyIs(bufferOrImageData)) {
      return this._fromImageData(bufferOrImageData as ImageData)
    }

    const buffer = bufferOrImageData as Buffer
    const type = fileType(bufferOrImageData) || {mime: 'unknown'}
    switch (type.mime) {
      case 'image/tiff':
        const decoder = new RawDecoder(buffer)
        const jpegImage = decoder.extractJpeg()
        return this._fromBuffer(jpegImage)
      default:
        return this._fromBuffer(buffer)
    }
  }

  protected static _fromBuffer(buffer: types.BufferLike): Image {
    throw new Error('unimplemented')
  }

  protected static _fromImageData(imageData: ImageData): Image {
    throw new Error('unimplemented')
  }
}
