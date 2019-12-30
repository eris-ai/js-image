import * as objectsModule from '../../lib/analyses/objects'
import {expect, fixtureDecode, roundNumbersToHundredths} from '../utils'

describe('analyses/objects', () => {
  describe('detectObjects()', () => {
    it('should identify people', async () => {
      const imageData = await fixtureDecode('source-faces-couple.jpg')
      const objects = await objectsModule.detectObjects(imageData)

      roundNumbersToHundredths(objects)
      expect(objects).toMatchInlineSnapshot(`
        Array [
          Object {
            "boundingBox": Object {
              "height": 0.8,
              "width": 0.47,
              "x": 0.12,
              "y": 0.21,
            },
            "confidence": 0.95,
            "object": "person",
          },
          Object {
            "boundingBox": Object {
              "height": 0.76,
              "width": 0.39,
              "x": 0.44,
              "y": 0.24,
            },
            "confidence": 0.94,
            "object": "person",
          },
          Object {
            "boundingBox": Object {
              "height": 0.3,
              "width": 0.44,
              "x": 0.17,
              "y": 0.69,
            },
            "confidence": 0.78,
            "object": "pants",
          },
          Object {
            "boundingBox": Object {
              "height": 0.11,
              "width": 0.11,
              "x": 0.56,
              "y": 0.28,
            },
            "confidence": 0.7,
            "object": "human_face",
          },
          Object {
            "boundingBox": Object {
              "height": 0.1,
              "width": 0.13,
              "x": 0.42,
              "y": 0.27,
            },
            "confidence": 0.55,
            "object": "human_face",
          },
        ]
      `)
    })

    it('should work with alternate sizes', async () => {
      const imageData = await fixtureDecode('source-faces-couple.jpg')
      const objects = await objectsModule.detectObjects(imageData, {size: 200})

      roundNumbersToHundredths(objects)
      expect(objects).toMatchInlineSnapshot(`
        Array [
          Object {
            "boundingBox": Object {
              "height": 0.79,
              "width": 0.47,
              "x": 0.12,
              "y": 0.21,
            },
            "confidence": 0.85,
            "object": "person",
          },
          Object {
            "boundingBox": Object {
              "height": 0.29,
              "width": 0.43,
              "x": 0.18,
              "y": 0.69,
            },
            "confidence": 0.8,
            "object": "pants",
          },
          Object {
            "boundingBox": Object {
              "height": 0.74,
              "width": 0.39,
              "x": 0.45,
              "y": 0.26,
            },
            "confidence": 0.78,
            "object": "person",
          },
          Object {
            "boundingBox": Object {
              "height": 0.1,
              "width": 0.11,
              "x": 0.56,
              "y": 0.28,
            },
            "confidence": 0.66,
            "object": "human_face",
          },
          Object {
            "boundingBox": Object {
              "height": 0.1,
              "width": 0.13,
              "x": 0.42,
              "y": 0.27,
            },
            "confidence": 0.5,
            "object": "human_face",
          },
          Object {
            "boundingBox": Object {
              "height": 0.18,
              "width": 0.26,
              "x": 0.53,
              "y": 0.82,
            },
            "confidence": 0.47,
            "object": "pants",
          },
        ]
      `)
    })

    it('should identify an object', async () => {
      const imageData = await fixtureDecode('source-objects-toothbrush.jpg')
      const objects = await objectsModule.detectObjects(imageData)
      roundNumbersToHundredths(objects)

      expect(objects).toMatchInlineSnapshot(`
        Array [
          Object {
            "boundingBox": Object {
              "height": 0.85,
              "width": 0.32,
              "x": 0.2,
              "y": 0.13,
            },
            "confidence": 0.85,
            "object": "toothbrush",
          },
        ]
      `)
    })

    it('should identify a person in abnormal pose', async () => {
      const imageData = await fixtureDecode('source-bride.jpg')
      const objects = await objectsModule.detectObjects(imageData)
      roundNumbersToHundredths(objects)

      expect(objects).toMatchInlineSnapshot(`
        Array [
          Object {
            "boundingBox": Object {
              "height": 0.21,
              "width": 0.27,
              "x": 0.37,
              "y": 0.2,
            },
            "confidence": 0.83,
            "object": "human_face",
          },
          Object {
            "boundingBox": Object {
              "height": 0.97,
              "width": 0.97,
              "x": 0.01,
              "y": 0.01,
            },
            "confidence": 0.52,
            "object": "person",
          },
          Object {
            "boundingBox": Object {
              "height": 0.23,
              "width": 0.16,
              "x": 0.5,
              "y": 0.37,
            },
            "confidence": 0.45,
            "object": "clothing",
          },
        ]
      `)
    })
  })
})
