import { assert } from 'chai'
import { TyrannoScrollus } from '../../src/TyrannoScrollus'
import { IScrollable } from '../../src/types'

describe('TyrannoScrollus()', () => {
    test('publishes values to subscribers', () => {
        const target: IScrollable = {
            tagName: 'DIV',
            scrollLeft: 0,
            scrollWidth: 1200,
            clientWidth: 300,
            clientHeight: 0,
            scrollHeight: 0,
            scrollTop: 0
        }

        let i: number
        const obs = TyrannoScrollus({
            direction: 'x',
            targets: target,
            subscribe(o) {
                i = 0.5
            }
        })

        target.scrollLeft = 600

        // observe changes
        obs.play()
        assert.equal(i, 0.5)
    })

    test('sets offset to 0 when the scroll pane is not scrollable', () => {
        const target: IScrollable = {
            tagName: 'DIV',
            scrollLeft: 0,
            scrollWidth: 0,
            clientWidth: 0,
            clientHeight: 0,
            scrollHeight: 0,
            scrollTop: 0
        }

        const obs = TyrannoScrollus({
            direction: 'y',
            targets: target
        })

        target.scrollTop = 600

        // observe changes
        obs.play()
        assert.equal(obs.value(), 0)
    })

    test('onPlay is called when .play() is called', done => {
        const target: IScrollable = {
            tagName: 'DIV',
            scrollLeft: 0,
            scrollWidth: 1200,
            clientWidth: 300,
            clientHeight: 0,
            scrollHeight: 0,
            scrollTop: 0
        }

        const obs = TyrannoScrollus({
            direction: 'x',
            targets: target,
            onPlay() {
                done()
            }
        })

        obs.play()
    })

    test('onPause is called when .pause() is called', done => {
      const target: IScrollable = {
          tagName: 'DIV',
          scrollLeft: 0,
          scrollWidth: 1200,
          clientWidth: 300,
          clientHeight: 0,
          scrollHeight: 0,
          scrollTop: 0
      }

      const obs = TyrannoScrollus({
          direction: 'x',
          targets: target,
          onPause() {
              done()
          }
      })

      obs.play()
      obs.pause()
    })

    test('startAt specifies starting position', () => {
        const target: IScrollable = {
            tagName: 'DIV',
            scrollLeft: 550,
            scrollWidth: 600,
            clientWidth: 0,
            clientHeight: 0,
            scrollHeight: 0,
            scrollTop: 0
        }

        const obs = TyrannoScrollus({
            direction: 'x',
            targets: target,
            startAt: 500
        })


        obs.play()

        assert.equal(obs.value(), .5)
    })

    test('endAt specifies ending position', () => {
        const target: IScrollable = {
            tagName: 'DIV',
            scrollLeft: 100,
            scrollWidth: 800,
            clientWidth: 0,
            clientHeight: 0,
            scrollHeight: 0,
            scrollTop: 0
        }

        const obs = TyrannoScrollus({
            direction: 'x',
            targets: target,
            endAt: 200
        })


        obs.play()

        assert.equal(obs.value(), .5)
    })
})
