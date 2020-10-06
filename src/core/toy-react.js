const RENDER_TO_DOM = Symbol('render to dom')
class ElementWrapper {
	constructor(type) {
		// 类被new时所执行的语句
		this.root = document.createElement(type)
	}
	[RENDER_TO_DOM](range) {
		// 1. 先删除节点内容
		range.deleteContents()
		// 2. 重新插入节点
		range.insertNode(this.root)
	}
	setAttribute(name, value) {
		this.root.setAttribute(name, value)
	}
	appendChild(component) {
		// this.root.appendChild(component.root)
		let range = document.createRange()
		range.setStart(this.root, this.root.childNodes.length)
		range.setEnd(this.root, this.root.childNodes.length)
		component[RENDER_TO_DOM](range)
	}
}

class TextWrapper {
	constructor(content) {
		this.root = document.createTextNode(content)
	}
	[RENDER_TO_DOM](range) {
		range.deleteContents()
		range.insertNode(this.root)
	}
	// 文本节点没有属性
	// setAttribute() {}
	// 文本节点没有appendChild
	// appendChild() {}
}

export class Component {
	constructor() {
		this.props = Object.create(null)
		this.children = []
		this._root = null
	}
	setAttribute(name, value) {
		return (this.props[name] = value)
	}
	appendChild(component) {
		return this.children.push(component)
	}
	// // 生成get
	// get root() {
	// 	if (!this._root) {
	// 		this._root = this.render().root
	// 	}
	// 	return this._root
	// }
	// 更新dom
	[RENDER_TO_DOM](range) {
		this.render()[RENDER_TO_DOM](range)
	}
}

export function createElement(type, attributes, ...children) {
	let e
	if (typeof type === 'function') {
		e = new type()
	} else {
		e = new ElementWrapper(type)
	}
	for (let p in attributes) {
		e.setAttribute(p, attributes[p])
	}

	let insertChildren = children => {
		for (let child of children) {
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
