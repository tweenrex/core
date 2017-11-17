import { assert } from 'chai'
import { TweenRex } from '../../src/TweenRex'

describe('TweenRex()', () => {
    test('publishes values to subscribers', () => {
        const obs = TweenRex({
            duration: 1000
        })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        assert.equal(i, 2)
    })

    test('publishes values to subscribers', () => {
        const obs = TweenRex({ duration: 100 })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        assert.equal(i, 2)
    })

    test('publishes multiple values to subscribers', () => {
        const obs = TweenRex({ duration: 100 })

        let i = 0
        obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        obs.next(3)
        assert.equal(i, 5)
    })

    test('unsubscribes properly', () => {
        const obs = TweenRex({ duration: 100 })

        let i = 0
        const unsubscribe = obs.subscribe((v: number) => {
            i += v
        })

        obs.next(2)
        unsubscribe()
        obs.next(2)

        assert.equal(i, 2)
    })

    test('seeks to the correct time', () => {
        const tween = TweenRex({ duration: 100 })
        tween.seek(50)
        assert.equal(tween.currentTime, 50)
    })

    test('allows configuration of multiple observers under a single subscription', () => {
        const obs = TweenRex({ duration: 1000 })

        let values: number[] = []

        // prettier-ignore
        obs.subscribe([
              o => values.push(o),
              o => values.push(o*o)
            ])

        obs.seek(500)
        assert.deepEqual(values, [0.5, 0.25])
    })

    test('honors unsubscribing multiple observers', () => {
        const obs = TweenRex({ duration: 1000 })

        let values: number[] = []

        // prettier-ignore
        const unsubscribe = obs.subscribe([
        o => values.push(o),
        o => values.push(o*o)
      ])

        unsubscribe()

        obs.seek(500)
        assert.deepEqual(values, [])
    })

    test('a subscription is automatically added to TweenRex', () => {
        const values: number[] = []

        const tween = TweenRex({
            duration: 500,
            subscribe: o => values.push(o)
        })

        tween.seek(250)
        assert.deepEqual(values, [0.5])
    })

    test('easing changes the rate of the animation', () => {
        const values: number[] = []

        const tween = TweenRex({
            duration: 500,
            easing: o => o * 2,
            subscribe: o => values.push(o)
        })

        tween.seek(250)
        assert.deepEqual(values, [1])
    })

    test('easing property is live', () => {
        const values: number[] = []

        const tween = TweenRex({
            duration: 500,
            easing: o => o * 2,
            subscribe: o => values.push(o)
        })

        tween.seek(250)
        tween.easing = o => o
        tween.seek(250)

        assert.deepEqual(values, [1, 0.5])
    })
    test('onPlay is called when .play() is called', done => {
        const tween = TweenRex({
            duration: 1000,
            onPlay() {
                done()
            }
        })

        tween.play()
    })

    test('onPause is called when .pause() is called', done => {
        const tween = TweenRex({
            duration: 1000,
            onPause() {
                done()
            }
        })

        tween.play()
        tween.pause()
    })

    test('onFinish is called when the duration is hit going forward', done => {
        const tween = TweenRex({
            duration: 50,
            onFinish() {
                done()
            }
        })

        tween.play()
    })

    test('onFinish is called when the duration is hit going forward', done => {
        const tween = TweenRex({
            duration: 50,
            onFinish() {
                done()
            }
        })

        tween.reverse().play()
    })
})
