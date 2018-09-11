/* tslint:disable */
import {IResizeOptions, ImageResizeFit} from '../types'
import {IAnnotatedImageData} from '../image-data'

export function normalizeOptions(
  imageData: IAnnotatedImageData,
  options: IResizeOptions,
): IResizeOptions {
  const originalWidth = imageData.width
  const originalHeight = imageData.height
  const originalAspectRatio = originalWidth / originalHeight

  let targetWidth = options.width
  let targetHeight = options.height
  const targetAspectRatio = targetWidth! / targetHeight!

  let subselect = options.subselect
  if (!subselect) {
    subselect = {top: 0, bottom: originalHeight, left: 0, right: originalWidth}
  }

  switch (options.fit) {
    case ImageResizeFit.Auto:
    case ImageResizeFit.Exact:
      if (!targetWidth && targetHeight) {
        targetWidth = targetHeight * originalAspectRatio
      } else if (targetWidth && !targetHeight) {
        targetHeight = targetWidth! / originalAspectRatio
      }
      break
    case ImageResizeFit.Contain:
      if (originalAspectRatio > targetAspectRatio) {
        targetHeight = targetWidth! / originalAspectRatio
      } else {
        targetWidth = targetHeight! * originalAspectRatio
      }
      break
    case ImageResizeFit.Cover:
      if (originalAspectRatio > targetAspectRatio) {
        targetWidth = targetHeight! * originalAspectRatio
      } else {
        targetHeight = targetWidth! / originalAspectRatio
      }
      break
    case ImageResizeFit.Crop:
      if (options.subselect) {
        targetWidth = options.subselect.right - options.subselect.left
        targetHeight = options.subselect.bottom - options.subselect.top
        break
      }

      let cropTargetWidth = originalWidth
      let cropTargetHeight = originalHeight

      if (originalAspectRatio > targetAspectRatio) {
        cropTargetWidth = originalHeight! * targetAspectRatio
      } else {
        cropTargetHeight = originalWidth! / targetAspectRatio
      }

      const heightMargin = (originalHeight - cropTargetHeight) / 2
      const widthMargin = (originalWidth - cropTargetWidth) / 2

      subselect = {
        top: Math.floor(heightMargin),
        bottom: originalHeight - Math.ceil(heightMargin),
        left: Math.floor(widthMargin),
        right: originalWidth - Math.ceil(widthMargin),
      }
      break
  }

  return Object.assign({}, options, {
    width: targetWidth,
    height: targetHeight,
    subselect,
  })
}

export function nearestNeighbor(
  imageData: IAnnotatedImageData,
  options: IResizeOptions,
): IAnnotatedImageData {
  if (!options.width || !options.height) {
    throw new Error('Missing width or height')
  }

  const targetWidth = options.width!
  const targetHeight = options.height!
  const widthScaleFactor = imageData.width / targetWidth
  const heightScaleFactor = imageData.height / targetHeight

  const outPixels = new Uint8Array(targetWidth * targetHeight * imageData.channels)

  for (var i = 0; i < targetWidth; i++) {
    for (var j = 0; j < targetHeight; j++) {
      const origX = Math.floor(i * widthScaleFactor)
      const origY = Math.floor(j * heightScaleFactor)

      const origPos = (origY * imageData.width + origX) * imageData.channels
      var outPos = (j * targetWidth + i) * imageData.channels

      for (var channel = 0; channel < imageData.channels; channel++) {
        outPixels[outPos + channel] = imageData.data[origPos + channel]
      }
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: outPixels,
    channels: imageData.channels,
    colorspace: imageData.colorspace,
  }
}

export function bilinear(
  imageData: IAnnotatedImageData,
  options: IResizeOptions,
): IAnnotatedImageData {
  if (!options.width || !options.height) {
    throw new Error('Missing width or height')
  }

  var targetWidth = options.width!
  var targetHeight = options.height!
  var widthScaleFactor = imageData.width / targetWidth
  var heightScaleFactor = imageData.height / targetHeight

  var boxResizeData: IAnnotatedImageData | null = null
  var boxResizeOptions: IResizeOptions | null = null
  if (widthScaleFactor >= 2 || heightScaleFactor >= 2) {
    const boxWidthScaleFactor = Math.max(Math.floor(widthScaleFactor), 1)
    const boxHeightScaleFactor = Math.max(Math.floor(heightScaleFactor), 1)
    if (widthScaleFactor === boxWidthScaleFactor && heightScaleFactor === boxHeightScaleFactor) {
      return box(imageData, options)
    }

    targetWidth = targetWidth * boxWidthScaleFactor
    targetHeight = targetHeight * boxHeightScaleFactor
    widthScaleFactor = imageData.width / targetWidth
    heightScaleFactor = imageData.height / targetHeight

    boxResizeOptions = options
    boxResizeData = {
      width: targetWidth,
      height: targetHeight,
      data: imageData.data,
      channels: imageData.channels,
      colorspace: imageData.colorspace,
    }
  }

  var outPixels = new Uint8Array(targetWidth * targetHeight * imageData.channels)

  for (var i = 0; i < targetWidth; i++) {
    for (var j = 0; j < targetHeight; j++) {
      var srcX = i * widthScaleFactor
      var srcY = j * heightScaleFactor

      var outPos = (j * targetWidth + i) * imageData.channels

      var srcXOffset = Math.floor(srcX)
      var srcYOffset = Math.floor(srcY) * imageData.width

      var srcPosA = (srcYOffset + srcXOffset) * imageData.channels
      var srcPosB = srcPosA + imageData.channels
      var srcPosC = (srcYOffset + imageData.width + srcXOffset) * imageData.channels
      var srcPosD = srcPosC + imageData.channels

      var xWeight = Math.max(1 - Math.abs(Math.floor(srcX) - srcX), 0)
      var yWeight = Math.max(1 - Math.abs(Math.floor(srcY) - srcY), 0)
      var weightPosA = xWeight * yWeight
      var weightPosB = (1 - xWeight) * yWeight
      var weightPosC = xWeight * (1 - yWeight)
      var weightPosD = (1 - xWeight) * (1 - yWeight)
      var totalWeight = weightPosA + weightPosB + weightPosC + weightPosD

      for (var channel = 0; channel < imageData.channels; channel++) {
        var value =
          (imageData.data[srcPosA + channel] * weightPosA) / totalWeight +
          (imageData.data[srcPosB + channel] * weightPosB) / totalWeight +
          (imageData.data[srcPosC + channel] * weightPosC) / totalWeight +
          (imageData.data[srcPosD + channel] * weightPosD) / totalWeight
        outPixels[outPos + channel] = Math.round(value)
      }
    }
  }

  if (boxResizeData && boxResizeOptions) {
    boxResizeData!.data = outPixels
    targetWidth = boxResizeOptions!.width!
    targetHeight = boxResizeOptions!.height!
    outPixels = box(boxResizeData, boxResizeOptions).data as Uint8Array
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: outPixels,
    channels: imageData.channels,
    colorspace: imageData.colorspace,
  }
}

export function box(imageData: IAnnotatedImageData, options: IResizeOptions): IAnnotatedImageData {
  if (!options.width || !options.height) {
    throw new Error('Missing width or height')
  }

  const targetWidth = options.width!
  const targetHeight = options.height!
  const widthScaleFactor = imageData.width / targetWidth
  const heightScaleFactor = imageData.height / targetHeight
  if (widthScaleFactor < 1 || heightScaleFactor < 1) {
    throw new Error('Box resize can only shrink images')
  } else if (
    Math.floor(widthScaleFactor) !== widthScaleFactor ||
    Math.floor(heightScaleFactor) !== heightScaleFactor
  ) {
    throw new Error('Can only box resize in integer increments')
  }

  const outPixels = new Uint8Array(targetWidth * targetHeight * imageData.channels)

  for (var i = 0; i < targetWidth; i++) {
    for (var j = 0; j < targetHeight; j++) {
      var origX = Math.floor(i * widthScaleFactor)
      var origY = Math.floor(j * heightScaleFactor)

      var outPos = (j * targetWidth + i) * imageData.channels

      for (var channel = 0; channel < imageData.channels; channel++) {
        var value = 0
        for (var dx = 0; dx < widthScaleFactor; dx++) {
          for (var dy = 0; dy < heightScaleFactor; dy++) {
            var origPos = ((origY + dy) * imageData.width + (origX + dx)) * imageData.channels
            value += imageData.data[origPos + channel]
          }
        }

        outPixels[outPos + channel] = value / (widthScaleFactor * heightScaleFactor)
      }
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: outPixels,
    channels: imageData.channels,
    colorspace: imageData.colorspace,
  }
}
