import { Slide, SlideGroup, useSlideEngine } from "@/app/SlideEngine";

function TransitionPage(props: {
    key: string | number;
    image: string | undefined;
    title: string;
    description: string;
}) {
    const { fragmentStep } = useSlideEngine();

    return (
        <SlideGroup>
            <Slide backgroundColor="#dedede">
                <div
                    style={{
                        width: "88%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "row",
                        marginTop: "2.5rem",
                        justifyContent: "flex-end",
                        grid: "inherit",
                    }}
                >
                    <div
                        style={{
                            height: "100%",
                            flexDirection: "column",
                            padding: "50px",
                        }}
                    >
                        <p style={{ textAlign: "center" }}>
                            <span
                                style={{
                                    marginLeft: "0.35rem",
                                    marginRight: "0.35rem",
                                    fontSize: 60,
                                    overflowWrap: "anywhere",
                                }}
                            >
                                {props.title}
                            </span>
                        </p>

                        <p style={{ textAlign: "center", color: "red" }}>
                            <span
                                className={`se-fragment se-fragment-slide${fragmentStep >= 1 ? " visible" : ""}`}
                                style={{ marginLeft: "0.35rem", marginRight: "0.35rem", overflowWrap: "anywhere" }}
                            >
                                {props.description}
                            </span>
                            <span
                                className={`se-fragment se-fragment-fade${fragmentStep >= 2 ? " visible" : ""}`}
                                style={{ marginLeft: "0.35rem", marginRight: "0.35rem" }}
                            />
                        </p>
                    </div>

                    <div
                        style={{
                            maxHeight: "75vh",
                            maxWidth: "50vh",
                            minWidth: "450px",
                            minHeight: "300px",
                            height: "650px",
                            width: "300px",
                            marginRight: "3rem",
                            borderRadius: "1rem",
                        }}
                    >
                        <img src={props.image} width={600} height={600} alt={props.title} />
                    </div>
                </div>
            </Slide>
        </SlideGroup>
    );
}

export default TransitionPage;
