import { createElement, render, Component } from './core/toy-react'
class Mycomponent extends Component {
	render() {
		return (
			<div>
				王雪峰的toyReact
				<h1> my component </h1>
				{this.children}
			</div>
		)
	}
}

render(
	<Mycomponent id='a' class='c'>
		<div>abc</div>
		<div></div>
	</Mycomponent>,
	document.body
)
