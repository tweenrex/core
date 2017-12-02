import { assert } from 'chai'
import { TweenRex } from '../../src/TweenRex'

describe('TweenRex.seek()', () => {
    test('moves to the correct time', () => {
        const tween = TweenRex({ duration: 100 })
        tween.seek(50)
        assert.equal(tween.currentTime, 50)
    })

    test('seeks from 0 and fires tweens in correct order', () => {
        const tween = TweenRex()
        const order: any[] = []
        tween.add({
            duration: 100,
            subscribe(o) {
                order.push('a', o)
            }
        })

        tween.add({
            duration: 100,
            subscribe(o) {
                order.push('b', o)
            }
        })

        tween.add({
            duration: 100,
            subscribe(o) {
                order.push('c', o)
            }
        })

        tween.seek(150)

        assert.deepEqual(order, ['c', 0, 'a', 1, 'b', 0.5])
    })

    test('seeks optimizes tween publish order so non-active sub-tweens get fired before active ones', () => {
        const tween = TweenRex()
        const target = { x: 100 }
        const order: number[] = []

        tween.add({
            duration: 100,
            subscribe(o) {
                target.x = 0
                order.push(1)
            }
        })

        tween.add({
            duration: 100,
            subscribe(o) {
                target.x = 5
                order.push(2)
            }
        })

        tween.add({
            duration: 100,
            subscribe(o) {
                target.x = 10
                order.push(3)
            }
        })

        // seek to end
        tween.seek(300)
        assert.deepEqual(target.x, 10)

        // seek back behind back to beginning
        tween.seek(0)
        assert.deepEqual(target.x, 0)

        // check that the subscriptions were hit in the correct order
        assert.deepEqual(order, [1, 2, 3, 3, 2, 1])
    })
})
