import { IScrollOptions, ITyrannoScrollus, IScrollable, IAction, ITRexObservable, IEasingAsync } from './types'
import { _ } from './internal/constants'
import { newify } from './internal/newify'
import { TRexObservable } from './TRexObservable'
import { defaultTimer } from './internal/defaultTimer'
import { resolveTarget } from './internal/resolveTarget'
import { minMax } from './internal/math';

/**
 * Creates a TyrannoScrollus instance.  This allows tweening based on changes to the x or y scroll position of an element.
 */
export function TyrannoScrollus(options: IScrollOptions): ITyrannoScrollus {
    const self = newify<ITyrannoScrollusInternal>(this, TyrannoScrollus)
    self._opts = options
    self.target = (resolveTarget(options.targets) as any) as IScrollable
    self._timer = options.timer || defaultTimer
    self.startAt = options.startAt
    self.endAt = options.endAt
    self.easing = options.easing
    self.direction = options.direction

    self._tick = () => {
        const target = self.target

        // get current scroll offset and total scroll
        let scrollOffset: number, scrollStart: number, scrollEnd: number
        if (self.direction === 'x') {
            scrollOffset = target.scrollLeft
            scrollStart = self.startAt || 0
            scrollEnd =  self.endAt ? self.endAt : target.scrollWidth - target.clientWidth
        } else {
            scrollOffset = target.scrollTop
            scrollStart = self.startAt || 0
            scrollEnd = self.endAt ? self.endAt : target.scrollHeight - target.clientHeight
        }

        // calculate value or use 0 if the total is NaN/0
        let value = minMax(!scrollEnd || !isFinite(scrollEnd) ? 0 : (scrollOffset - scrollStart) / (scrollEnd - scrollStart), 0, 1)

        // ease value if specified
        if (!self.easing) {
            self.next(value)
        } else if ((self.easing as IEasingAsync).tr_type === 'ASYNC') {
            (self.easing as IEasingAsync)(value, self.next)
        } else {
            self.next(self.easing(value))
        }
    }

    // copy next/subscribe to this object
    const obs = TRexObservable<number>(options)
    self.next = obs.next
    self.value = obs.value
    self.subscribe = obs.subscribe

    self.dispose = () => {
        // pause timeline to clear active state
        self.pause()

        // clear state
        self.target = _

        // dispose the observable
        obs.dispose()
    }

    return self
}

TyrannoScrollus.prototype = {
    get isPlaying(this: ITyrannoScrollusInternal): boolean {
        return !!this._sub
    },
    play(this: ITyrannoScrollusInternal): void {
        const self = this
        if (!self.isPlaying) {
            self._tick()
            self._sub = self._timer.subscribe(self._tick)
            if (self._opts.onPlay) {
              self._opts.onPlay()
            }
        }
    },
    pause(this: ITyrannoScrollusInternal): void {
        const self = this
        if (self.isPlaying) {
            self._sub()
            self._sub = _
            if (self._opts.onPause) {
              self._opts.onPause()
            }
        }
    }
}

/**
 * private model of TyrannoScrollus
 */
interface ITyrannoScrollusInternal extends ITyrannoScrollus {
  /** DO_NOT_USE: options used to instantiate this */
  _opts: IScrollOptions
  /** DO_NOT_USE: active subscription to the timer */
  _sub: IAction
  /** DO_NOT_USE: observable that provides new dates each frame */
  _timer: ITRexObservable<number>
  /** DO_NOT_USE: callback for the timer */
  _tick: () => void
}
