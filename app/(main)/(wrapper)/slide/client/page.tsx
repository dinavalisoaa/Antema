"use client";
import React, { useRef } from "react";
import { SlideEngine, SlideEngineHandle } from "@/app/SlideEngine";
import Song from "@/components/new-features/song";
import ImageHolder from "@/components/new-features/image-holder";
import TransitionPage from "@/components/new-features/transition-page";

function Slide() {
    const engineRef = useRef<SlideEngineHandle>(null);

    return (
        <SlideEngine
            ref={engineRef}
            theme="sky"
            transition="concave"
            controls
            showProgress
            showSlideNumber
        >
            <ImageHolder key="" andininy="" hira="" title="Raharahampiangonana" />

            <Song hira={"ffpm_133"} key={1} andininy={null} title={"FFPM 133"} />

            <TransitionPage key="" image={"../ressources/images/hira.jpg"} title={"Break kely"} description={"Break kely"} />

            <Song hira={"ffpm_325"} key={325} title={"FFPM 325"} andininy={null} />

            <Song hira={"ffpm_813"} key={813} title={"FFPM 813"} andininy={null} />

            <Song hira={"ffpm_342"} key={342} title={"FFPM 342"} andininy={null} />

            <Song hira={"ffpm_124"} andininy={"3,4,5"} key={124} title={"FFPM 124"} />

            <Song hira={"ffpm_90"} key={90} title={"FFPM 90"} andininy={null} />
        </SlideEngine>
    );
}

export default Slide;
