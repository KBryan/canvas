import { CSSType, PercentLength, View, Screen, GestureStateTypes, Utils, Application } from '@nativescript/core';
import { CanvasRenderingContext, TouchList } from '../common';

export interface ICanvasBase {
	on(eventName: 'ready', callback: (data: any) => void, thisArg?: any): void;
}

@CSSType('Canvas')
export abstract class CanvasBase extends View implements ICanvasBase {
	public static readyEvent = 'ready';
	_touchEvents: any;
	_isCustom: boolean = false;

	protected constructor() {
		super();
		this._touchEvents = this._touchEventsFN.bind(this);
		this.on('touch, pan', this._touchEvents);
		this._classList = new Set();
	}

	_classList: Set<any>;

	get classList() {
		return this._classList;
	}

	get _realSize(): { width: number; height: number } {
		return {
			width: this.getSize(this.style.width, this.getMeasuredWidth(), 'width'),
			height: this.getSize(this.style.height, this.getMeasuredHeight(), 'height'),
		};
	}

	_handleContextOptions(type, contextOpts?) {
		const defaultGLOptions = {
			alpha: true,
			antialias: true,
			depth: true,
			failIfMajorPerformanceCaveat: false,
			powerPreference: 'default',
			premultipliedAlpha: true,
			preserveDrawingBuffer: false,
			stencil: false,
			desynchronized: false,
			xrCompatible: false,
		};
		if (!contextOpts) {
			if (type === '2d') {
				return {
					alpha: true,
				};
			}
			if (type.indexOf('webgl') > -1) {
				return defaultGLOptions;
			}
		}
		if (type === '2d') {
			if (contextOpts.alpha !== undefined && typeof contextOpts.alpha === 'boolean') {
				return contextOpts;
			} else {
				return { alpha: true };
			}
		}
		const setIfDefined = (prop, value) => {
			const property = defaultGLOptions[prop];
			if (property !== undefined && typeof value === typeof property) {
				defaultGLOptions[prop] = value;
			}
		};
		if (type.indexOf('webgl') > -1) {
			setIfDefined('alpha', contextOpts.alpha);
			setIfDefined('antialias', contextOpts.antialias);
			setIfDefined('depth', contextOpts.depth);
			setIfDefined('failIfMajorPerformanceCaveat', contextOpts.failIfMajorPerformanceCaveat);
			setIfDefined('powerPreference', contextOpts.powerPreference);
			setIfDefined('premultipliedAlpha', contextOpts.premultipliedAlpha);
			setIfDefined('preserveDrawingBuffer', contextOpts.preserveDrawingBuffer);
			setIfDefined('stencil', contextOpts.stencil);
			setIfDefined('desynchronized', contextOpts.desynchronized);
			return defaultGLOptions;
		}
		return null;
	}

	_touchEventsFN(event: any) {
		if (event.eventName === 'touch') {
			switch (event.action) {
				case 'down':
					this._emitEvent('touchstart', event);
					break;
				case 'up':
					this._emitEvent('touchend', event);
					break;
				case 'cancel':
					this._emitEvent('touchcancel', event);
					break;
				case 'move':
					// NOOP
					break;
				default:
					break;
			}
		} else if (event.eventName === 'pan') {
			if (event.state === GestureStateTypes.began || event.state === GestureStateTypes.changed) {
				this._emitEvent('touchmove', event);
			}
		}
	}

	_getTouchEvent(name, event, target) {
		const pointers = new TouchList();
		const scale = 1;
		let activePointer = {};
		if (name === 'touchmove') {
			/* mouse */
			activePointer = {
				clientX: event.deltaX * scale,
				clientY: event.deltaY * scale,
				force: 0.0,
				identifier: 0,
				pageX: event.deltaX * scale,
				pageY: event.deltaY * scale,
				radiusX: 0,
				radiusY: 0,
				rotationAngle: 0,
				screenX: event.deltaX * scale,
				screenY: event.deltaY * scale,
				target,
			};

			/* mouse */
			pointers.push({
				// * SCALE ??
				clientX: event.deltaX * scale,
				clientY: event.deltaY * scale,
				force: 0.0,
				identifier: 0,
				pageX: event.deltaX * scale,
				pageY: event.deltaY * scale,
				radiusX: 0,
				radiusY: 0,
				rotationAngle: 0,
				screenX: event.deltaX * scale,
				screenY: event.deltaY * scale,
				target,
			});
		} else {
			const count = event.getAllPointers().length;
			const point = event.getActivePointers()[0];

			// mouse event
			activePointer = {
				clientX: point.getX() * scale,
				clientY: point.getY() * scale,
				force: 0.0,
				identifier: 0,
				pageX: point.getX() * scale,
				pageY: point.getY() * scale,
				radiusX: 0,
				radiusY: 0,
				rotationAngle: 0,
				screenX: point.getX() * scale,
				screenY: point.getY() * scale,
			};

			for (let i = 0; i < count; i++) {
				const point = event.getAllPointers()[i];
				pointers.push({
					clientX: point.getX(),
					clientY: point.getY(),
					force: 0.0,
					identifier: i,
					pageX: point.getX(),
					pageY: point.getY(),
					radiusX: 0,
					radiusY: 0,
					rotationAngle: 0,
					screenX: point.getX(),
					screenY: point.getY(),
					target,
				});
			}
		}

		return {
			eventName: name,
			object: null,
			defaultPrevented: false,
			cancelable: false,
			altKey: false,
			changedTouches: pointers,
			ctrlKey: false,
			metaKey: false,
			shiftKey: false,
			targetTouches: pointers,
			touches: pointers,
			preventDefault: () => {},
			stopPropagation: () => {},
			target,
			...activePointer,
		};
	}

	_emitEvent(name, event) {
		this.notify(this._getTouchEvent(name, event, this));
	}

	_readyEvent() {
		this.notify({
			eventName: 'ready',
			object: this,
		});
	}

	getAttribute(attrib) {
		if (attrib === 'width') {
			return this.width;
		}
		if (attrib === 'height') {
			return this.height;
		}

		if (attrib === 'tabindex') {
			return (this['tabindex'] = arguments[1]);
		}
		return this[attrib];
	}

	setAttribute(attrib) {
		if (attrib === 'width') {
			if (!isNaN(parseInt(arguments[1]))) {
				this.width = parseInt(arguments[1]);
			}
		}
		if (attrib === 'height') {
			if (!isNaN(parseInt(arguments[1]))) {
				this.height = parseInt(arguments[1]);
			}
		}
		if (attrib === 'tabindex') {
			this['tabindex'] = arguments[1];
		}
	}

	public abstract getContext(type: string, options?: any): CanvasRenderingContext | null;

	public abstract getBoundingClientRect(): {
		x: number;
		y: number;
		width: number;
		height: number;
		top: number;
		right: number;
		bottom: number;
		left: number;
	};

	private getSize(value, measuredSize, type): number {
		if (typeof value === 'string') {
			value = PercentLength.parse(value);
		}
		if (typeof value === 'number') {
			// treat as px
			return value || 0;
		} else if ((value !== null || true) && typeof value === 'object' && typeof value.value && typeof value.unit) {
			if (value.unit === 'px') {
				return value.value || 0;
			} else if (value.unit === 'dip') {
				return Utils.layout.toDevicePixels(value.value) || 0;
			} else if (value.unit === '%') {
				if (Application.orientation() === 'portrait') {
					return type === 'width' ? Screen.mainScreen.widthPixels : Screen.mainScreen.heightPixels * value.value || 0;
				} else if (Application.orientation() === 'landscape') {
					return type === 'width' ? Screen.mainScreen.widthPixels : Screen.mainScreen.heightPixels * value.value || 0;
				} else {
					return 0;
				}
			} else {
				return 0;
			}
		} else {
			return 0;
		}
	}
}
