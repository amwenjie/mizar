import React from "react";
import { IProps, IState } from "./interface.js";

class CycleImage extends React.Component<IProps, IState> {

    private style;
    private stopPlay;

    constructor(props) {
        super(props);
        this.style = { width: this.props.width, height: this.props.height };
        this.state = { showIndex: 0 };
    }

    public componentDidMount() {
        this.stopPlay = this.play(this.props.interval);
    }

    public componentWillUnmount() {
        if (this.stopPlay) {
            this.stopPlay();
        }
    }

    public render() {
        return (
            <div style={{
                overflow: "hidden"
            }}>
                <div>
                    {
                        this.props.images.map((imageSrc, index) => (
                            <img
                                key={index}
                                src={imageSrc}
                                style={{
                                    ...this.style,
                                    display: this.canDisplay(index) ? "inline" : "none",
                                }} />
                        ))
                    }
                </div>
                <p>奋力加载中…</p>
            </div>
        );
    }

    private canDisplay(index) {
        return this.state.showIndex === index;
    }

    private display(index) {
        this.setState({ showIndex: index });
    }

    private play(interval, currentIndex = 0, state = { canPlay: true }) {
        if (currentIndex < this.props.images.length) {
            setTimeout(() => {
                if (state.canPlay) {
                    this.display(currentIndex);
                    this.play(interval, ++currentIndex, state);
                }
            }, interval);
        }
        return () => {
            state.canPlay = false;
        };
    }
}

export default CycleImage;
