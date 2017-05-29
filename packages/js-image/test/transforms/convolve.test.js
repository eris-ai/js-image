const convolve = require('../../lib/transforms/convolve').convolve
const {ImageData} = require('../../lib/image-data')
const {expect, fixtureDecode, compareToFixture} = require('../utils')

const toPixels = arrs => new Uint8Array(arrs.reduce((acc, arr) => acc.concat(arr), []))

describe('#transforms/convolve', () => {
  const skater = ImageData.normalize(fixtureDecode('skater.jpg'))

  const gaussianBlur = [
    /* eslint-disable max-len */
    [0.0073068827452812644, 0.03274717653776802, 0.05399096651318985, 0.03274717653776802, 0.0073068827452812644],
    [0.03274717653776802, 0.14676266317374237, 0.2419707245191454, 0.14676266317374237, 0.03274717653776802],
    [0.05399096651318985, 0.2419707245191454, 0.3989422804014327, 0.2419707245191454, 0.05399096651318985],
    [0.03274717653776802, 0.14676266317374237, 0.2419707245191454, 0.14676266317374237, 0.03274717653776802],
    [0.0073068827452812644, 0.03274717653776802, 0.05399096651318985, 0.03274717653776802, 0.0073068827452812644],
    /* eslint-enable max-len */
  ]

  const pixel = value => [value, value, value, 255]

  it('should apply the matrix', () => {
    const output = convolve({
      width: 3,
      height: 3,
      data: toPixels([
        pixel(128), pixel(128), pixel(128),
        pixel(0), pixel(0), pixel(0),
        pixel(255), pixel(255), pixel(255),
      ]),
    }, [
      [0, 0.2, 0],
      [0.2, 0.2, 0.2],
      [0, 0.2, 0],
    ])

    expect(output).to.eql({
      width: 3,
      height: 3,
      data: toPixels([
        pixel(85), pixel(96), pixel(85),
        pixel(96), pixel(77), pixel(96),
        pixel(170), pixel(191), pixel(170),
      ]),
    })
  })

  it('should blur', () => {
    const output = convolve(skater, gaussianBlur)
    const jpegOutput = ImageData.toBuffer(output)
    compareToFixture(jpegOutput, 'skater-blur.jpg')
  })
})
