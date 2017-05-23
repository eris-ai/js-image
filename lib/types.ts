export interface IFormatOptions {
  type: ImageFormat,
  quality?: number,
}

export interface IResizeOptions {
  width?: number,
  height?: number,
  method: ImageResizeMethod,
}

export interface IEdgeOptions {
  method: EdgeMethod,
  kernelSize?: number,
}

export interface IImageOutputOptions {
  format: IFormatOptions,
  resize?: IResizeOptions,
  greyscale?: boolean,
  edges?: IEdgeOptions,
}

export type ImageFormat = 'jpeg' | 'png'
export type ImageResizeMethod = 'auto' | 'contain' | 'cover' | 'exact' | 'crop'
export type EdgeMethod = 'sobel' | 'canny'

export type ImageDataFormat = 'rgb' | 'rgba' | 'b'
export type BufferLike = Buffer|Uint8Array|number[]

export interface Pixel {
  value?: number,
  index?: number,
  x: number,
  y: number,
}