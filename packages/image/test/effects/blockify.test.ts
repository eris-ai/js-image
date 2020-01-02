import {blockify, hueColorDistance_} from '../../lib/effects/blockify'
import {fixtureDecode, compareToFixture} from '../utils'
import {createPRNG} from '../../lib/third-party/alea'
import {Colorspace} from '../../lib/types'

describe('#effects/blockify', () => {
  it.only(
    'should blockify an image',
    async () => {
      const options = {recolorAfterMerge: true, mergeThresholdMultiplier: 2}
      const {imageData} = await blockify(await fixtureDecode('source-faces-couple.jpg'), options)
      await compareToFixture(imageData, 'blockify-faces-couple.jpg', {strict: false})
    },
    60000,
  )

  it('should blockify a small square of same colors', async () => {
    const random = createPRNG('blockify')
    const red = (v?: number) => [v || 230 + (random.next() - 0.5) * 30, 0, 0]
    const green = (v?: number) => [0, v || 230 + (random.next() - 0.5) * 30, 0]
    const blue = (v?: number) => [0, 0, v || 230 + (random.next() - 0.5) * 30]
    const pixels = [
      ...[...red(), ...red(), ...red(), ...red(), ...blue(), ...blue()],
      ...[...red(), ...red(), ...red(), ...blue(), ...blue(), ...blue()],
      ...[...red(), ...red(), ...blue(), ...blue(), ...green(), ...green()],
      ...[...red(), ...blue(), ...blue(), ...green(), ...green(), ...green()],
      ...[...blue(), ...blue(), ...green(), ...green(), ...green(), ...green()],
      ...[...blue(), ...blue(), ...green(), ...green(), ...green(), ...green()],
    ].map(r => Math.round(r))

    const expected = new Uint8Array(
      [
        ...[...red(233), ...red(233), ...red(233), ...red(233), ...blue(228), ...blue(228)],
        ...[...red(233), ...red(233), ...red(233), ...blue(228), ...blue(228), ...blue(228)],
        ...[...red(233), ...red(233), ...blue(228), ...blue(228), ...green(230), ...green(230)],
        ...[...red(233), ...blue(228), ...blue(228), ...green(230), ...green(230), ...green(230)],
        ...[...blue(228), ...blue(228), ...green(230), ...green(230), ...green(230), ...green(230)],
        ...[...blue(228), ...blue(228), ...green(230), ...green(230), ...green(230), ...green(230)],
      ].map(r => Math.round(r)),
    )

    const input = {width: 6, height: 6, data: pixels, colorspace: Colorspace.RGB, channels: 3}
    const {imageData, blocks} = await blockify(input, {threshold: 30, blurRadius: 0})
    expect(imageData.data).toEqual(expected)
    expect(blocks).toEqual([
      {b: 0, count: 10, g: 0, height: 4, r: 233, width: 4, x: 0, y: 0},
      {b: 228, count: 13, g: 0, height: 6, r: 0, width: 6, x: 0, y: 0},
      {b: 0, count: 13, g: 230, height: 4, r: 0, width: 4, x: 2, y: 2},
    ])
  })

  it('should merge blocks', async () => {
    const r2 = (v: number) => [v, 0, 0]
    const pixels = [
      ...[...r2(199), ...r2(190), ...r2(181), ...r2(190)],
      ...[...r2(190), ...r2(181), ...r2(190), ...r2(190)],
      ...[...r2(181), ...r2(190), ...r2(190), ...r2(190)],
      ...[...r2(190), ...r2(190), ...r2(190), ...r2(190)],
    ].map(r => Math.round(r))

    const expected = new Uint8Array(
      [
        ...[...r2(193), ...r2(193), ...r2(188), ...r2(188)],
        ...[...r2(193), ...r2(188), ...r2(188), ...r2(188)],
        ...[...r2(188), ...r2(188), ...r2(188), ...r2(188)],
        ...[...r2(188), ...r2(188), ...r2(188), ...r2(188)],
      ].map(r => Math.round(r)),
    )

    const input = {width: 4, height: 4, data: pixels, colorspace: Colorspace.RGB, channels: 3}
    const nonMergeOptions = {
      threshold: 10,
      blurRadius: 0,
      mergeThresholdMultiplier: 0,
      recolorAfterMerge: true,
    }
    const mergeOptions = {...nonMergeOptions, mergeThresholdMultiplier: 1}
    const {imageData: nonMergeData, blocks: nonMergeBlocks} = await blockify(input, nonMergeOptions)
    expect(nonMergeData.data).toEqual(expected)
    const {imageData: mergeData, blocks: mergeBlocks} = await blockify(input, mergeOptions)
    expect(mergeData.data).toEqual(expected.map((_, i) => (i % 3 === 0 ? 193 : 0)))
    expect(mergeBlocks).toHaveLength(1)
    expect(nonMergeBlocks.length).toBeGreaterThan(mergeBlocks.length)
  })

  it('should blockify a large rectangle of random colors', async () => {
    const random = createPRNG('blockify')
    const color = () => [random.next() * 255, random.next() * 255, random.next() * 255]
    const pixels = []
    const width = 200
    const height = 300
    for (let i = 0; i < width * height; i++) {
      pixels.push(...color())
    }

    const imageData = {width, height, data: pixels, colorspace: Colorspace.RGB, channels: 3}
    const {blocks} = await blockify(imageData, {blurRadius: 0, mergeThresholdMultiplier: 0})
    expect(blocks.length).toBeGreaterThan(200 * 300 * 0.9)
  })

  describe('#hueColorDistance_', () => {
    it.only('should have lower distance for similar hues', () => {
      expect(hueColorDistance_([255, 0, 0], [230, 0, 0])).toMatchInlineSnapshot(`6.25`)
      // Blue hues in couple shot
      expect(hueColorDistance_([5, 31, 50], [44, 74, 94])).toMatchInlineSnapshot(
        `19.289718968598702`,
      )
      expect(hueColorDistance_([5, 31, 50], [83, 92, 106])).toMatchInlineSnapshot(
        `42.58158950481536`,
      )
      expect(hueColorDistance_([44, 74, 94], [83, 92, 106])).toMatchInlineSnapshot(
        `17.3545193854566`,
      )
      // Green hues in couple shot
      expect(hueColorDistance_([76, 86, 38], [39, 45, 6])).toMatchInlineSnapshot(
        `18.27550799341211`,
      )
      expect(hueColorDistance_([76, 86, 38], [97, 110, 61])).toMatchInlineSnapshot(
        `11.323218199183048`,
      )
      expect(hueColorDistance_([39, 45, 6], [97, 110, 61])).toMatchInlineSnapshot(
        `33.411455104015545`,
      )
      // Green vs brown
      expect(hueColorDistance_([132, 103, 80], [39, 45, 6])).toMatchInlineSnapshot(
        `95.79356455519681`,
      )
      expect(hueColorDistance_([175, 140, 115], [79, 80, 40])).toMatchInlineSnapshot(
        `89.02289967568268`,
      )
    })
  })
})
