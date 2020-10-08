const RENDER_TO_DOM = Symbol('render to dom')
const replaceContent = function (range, node) {
	range.insertNode(node)
	range.setStartAfter(node)
	range.deleteContents()

	range.setStartBefore(node)
	range.setEndAfter(node)
}
export class Component {
	constructor() {
		this.props = Object.create(null)
		this.children = []
		this._root = null
		this._range = null
	}
	setAttribute(name, value) {
		this.props[name] = value
	}
	appendChild(component) {
		this.children.push(component)
	}
	get vdom() {
		return this.render().vdom
	}
	// TODO: 更新dom
	[RENDER_TO_DOM](range) {
		this._range = range
		this._vdom = this.vdom // vdom 是一个 get
		this._vdom[RENDER_TO_DOM](range)
	}
	update() {
		let isSameNode = (oldNode, newNode) => {
			if (oldNode.type !== newNode.type) {
				return false
			}
			for (let name in newNode.props) {
				if (oldNode.props[name] !== newNode.props[name]) {
					return false
				}
			}
			if (
				Object.keys(oldNode.props).length > Object.keys(newNode.props).length
			) {
				return false
			}
			if (newNode.type === '#text') {
				if (oldNode.content !== newNode.content) {
					return false
				}
			}
			// 默认是相同vdom内容
			return true
		}
		let update = (oldNode, newNode) => {
			// diff 逻辑
			// type,props,children
			// #text content
			// 如果不是相同vdom内容
			if (!isSameNode(oldNode, newNode)) {
				newNode[RENDER_TO_DOM](oldNode._range)
				return
			}
			newNode._range = oldNode._range

			let oldChildren = oldNode.vchildren
			let newChildren = newNode.vchildren
			if (!newChildren || !newChildren.length) {
				return
			}

			let tailRange = oldChildren[oldChildren.length - 1]._range

			for (let i = 0; i < newChildren.length; i++) {
				let newChild = newChildren[i]
				let oldChild = oldChildren[i]
				if (i < oldChildren.length) {
					update(oldChild, newChild)
				} else {
					let range = document.createRange()
					range.setStart(tailRange.endContainer, tailRange.endOffset)
					newChild[RENDER_TO_DOM](range)
					tailRange = range
					// TODO:
				}
			}
		}
		let vdom = this.vdom
		update(this._vdom, vdom)
		this._vdom = vdom
	}

	// // 重新视图
	// rerender() {
	// 	// 1. 保存旧的range
	// 	let oldRange = this._range
	// 	// 2. 创建一个新的range
	// 	let range = document.createRange()
	// 	// 3. 新range使用旧range的start与end数据
	// 	range.setStart(oldRange.startContainer, oldRange.startOffset)
	// 	range.setEnd(oldRange.startContainer, oldRange.startOffset)
	// 	// 4. 完成新range的插入
	// 	this[RENDER_TO_DOM](range)
	// 	// 5. 将旧range的位置移动到新range的endOffset
	// 	oldRange.setStart(range.endContainer, range.endOffset)
	// 	// 6. 删除旧的range内容
	// 	oldRange.deleteContents()
	// }
	// 更新数据
	setState(newState) {
		// 1. 如果state为初始值null且不是一个对象，则直接更新state的数据为newState
		if (this.state === null || typeof this.state !== 'object') {
			this.state = newState
			this.rerender()
			return
		}
		let merge = (oldState, newState) => {
			// TODO: 有待优化
			for (let p in newState) {
				if (oldState[p] === null || typeof oldState[p] !== 'object') {
					oldState[p] = newState[p]
					// 如果是对象，递归执行merge
				} else {
					merge(oldState[p], newState[p])
				}
			}
		}
		merge(this.state, newState)
		this.update()
	}
}
class ElementWrapper extends Component {
	constructor(type) {
		super(type)
		this.type = type
	}
	[RENDER_TO_DOM](range) {
		this._range = range
		let root = document.createElement(this.type)
		for (let name in this.props) {
			let value = this.props[name]
			// 过滤出以on开头的属性
			if (name.match(/^on([\s\S]+)$/)) {
				// 拿取正则对象分组1并绑定事件
				root.addEventListener(
					// 将onClick类型的属性名 的Click 的第一个字符小写，以便能正确绑定事件名
					RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase(), value),
					value
				)
			} else {
				if (name === 'className') {
					root.setAttribute('class', value)
				} else {
					root.setAttribute(name, value)
				}
			}
		}
		if (!this.vchildren) {
			this.vchildren = this.children.map(child => child.vdom)
		}

		for (let child of this.vchildren) {
			let childRange = document.createRange()
			childRange.setStart(root, root.childNodes.length)
			childRange.setEnd(root, root.childNodes.length)
			child[RENDER_TO_DOM](childRange)
		}
		replaceContent(range, root)
	}
	// setAttribute(name, value) {
	// 	this.root.setAttribute(name, value)
	// 	// 过滤出以on开头的属性
	// 	if (name.match(/^on([\s\S]+)$/)) {
	// 		// 拿取正则对象分组1并绑定事件
	// 		this.root.addEventListener(
	// 			// 将onClick类型的属性名 的Click 的第一个字符小写，以便能正确绑定事件名
	// 			RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase(), value),
	// 			value
	// 		)
	// 	} else {
	// 		if (name === 'className') {
	// 			this.root.setAttribute('class', value)
	// 		} else {
	// 			this.root.setAttribute(name, value)
	// 		}
	// 	}
	// }

	// appendChild(component) {
	// 	// this.root.appendChild(component.root)
	// 	let range = document.createRange()
	// 	range.setStart(this.root, this.root.childNodes.length)
	// 	range.setEnd(this.root, this.root.childNodes.length)
	// 	component[RENDER_TO_DOM](range)
	// }

	get vdom() {
		this.vchildren = this.children.map(child => child.vdom)
		return this
		// return {
		// 	type: this.type,
		// 	props: this.props,
		// 	children: this.children.map(child => child.vdom),
		// }
	}
}

class TextWrapper extends Component {
	constructor(content) {
		super(content)
		this.type = '#text'
		this.content = content
	}
	get vdom() {
		return this
	}
	[RENDER_TO_DOM](range) {
		this._range = range
		let root = document.createTextNode(this.content)
		replaceContent(range, root)
	}
}

export function createElement(type, attributes, ...children) {
	let e
	if (typeof type === 'string') {
		e = new ElementWrapper(type)
	} else {
		e = new type()
	}
	for (let p in attributes) {
		e.setAttribute(p, attributes[p])
	}

	let insertChildren = children => {
		for (let child of children) {
			// 如果传入的child是null,则不进行处理
			if (child === null) {
				continue
			}
			if (typeof child === 'string') {
				child = new TextWrapper(child)
			}
			if (typeof child === 'object' && child instanceof Array) {
				// 递归处理嵌套children
				insertChildren(child)
			} else {
				e.appendChild(child)
			}
		}
	}
	insertChildren(children)
	return e
}

export function render(component, parentElement) {
	// parentElement.appendChild(component.root)
	let range = document.createRange()
	range.setStart(parentElement, 0)
	range.setEnd(parentElement, parentElement.childNodes.length)
	range.deleteContents()
	component[RENDER_TO_DOM](range)
}
