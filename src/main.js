import { createElement, render, Component } from './core/toy-react'
class Mycomponent extends Component {
	constructor() {
		super()
		this.state = {
			a: 1,
			b: 2,
		}
	}
	render() {
		return (
			<div>
				王雪峰的toyReact
				<h1> my component </h1>
				<span>{this.state.a.toString()}</span>
				<br />
				<span>{this.state.b.toString()}</span>
				{this.children}
				<button
					onClick={() => {
						this.setState({
							a: this.state.a + 1,
						})
					}}
				>
					add
				</button>
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
