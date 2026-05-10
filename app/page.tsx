"use client";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Slide, SlideEngine, SlideEngineHandle, SlideGroup } from "@/app/SlideEngine";

export default function Home() {
    const engineRef = useRef<SlideEngineHandle>(null);
    const router = useRouter();

    const reload = (url: string) => {
        router.push(url);
    };

    return (
        <SlideEngine
            ref={engineRef}
            theme="moon"
            transition="concave"
            controls
        >
            <SlideGroup>
                <Slide backgroundColor="#0c1821">
                    <div className="container bg-red-200 w-[300%] h-[300%] mr-200">
                        <div style={{ fontSize: 80 }}>Antema</div>
                        <div className="bg-blue-400 ml-200">Logo</div>
                        <p></p>
                        <button onClick={() => reload("/admin/list")}>Admin list</button>
                        <p>
                            <button onClick={() => reload("/admin/form/ui/manefo")}>Manefo</button>
                        </p>
                        <p>
                            <button onClick={() => reload("/admin/nl")}>NL</button>
                        </p>
                        <p>
                            <button onClick={() => reload("/admin/song-category")}>Categories</button>
                        </p>
                        <div>Caption</div>
                    </div>
                </Slide>
                <Slide backgroundColor="#0c1821">
                    <ul>
                        <li>Easily make presentation content dynamic</li>
                        <li>Easily add presentations to React apps</li>
                        <li>Embed React components inside presentations</li>
                    </ul>
                </Slide>
            </SlideGroup>

            <SlideGroup>
                <Slide backgroundColor="#bf4f41">
                    <div>
                        <h2>Free reign over your presentation</h2>
                        <p>This package makes no efforts to impede or restrict what you can do.</p>
                    </div>
                </Slide>
                <Slide backgroundColor="#bf4f41">
                    <p>
                        Since React creates HTML DOM elements out of JSX, there should be no reason
                        we cannot just put JSX inside of our SlideEngine component instead of
                        markup it normally expects.
                    </p>
                </Slide>
                <Slide backgroundColor="#bf4f41">
                    <p>
                        <b className="size-10">Simply</b> put, React already takes care of
                        converting JSX into something the slide engine can work with.
                    </p>
                </Slide>
            </SlideGroup>
        </SlideEngine>
    );
}
