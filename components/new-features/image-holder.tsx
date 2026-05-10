import { Slide, SlideGroup } from "@/app/SlideEngine";

function ImageHolder(props: {
    andininy: string | null;
    hira: string;
    key: string | number | undefined;
    title: string | null;
}) {
    return (
        <SlideGroup>
            <Slide>
                <div className="container bg-red-100 flex" style={{ height: "1050px" }}>
                    <div className="bg-blue-400 w-1/3">
                        <img src="../ressources/images/batisa.png" alt="batisa" />
                    </div>
                    <div className="bg-blue-500 w-1/3">
                        <h4>Caption</h4>
                    </div>
                    <div className="bg-blue-100 w-1/3">
                        <h4>2025-2052</h4>
                    </div>
                </div>
            </Slide>
        </SlideGroup>
    );
}

export default ImageHolder;
