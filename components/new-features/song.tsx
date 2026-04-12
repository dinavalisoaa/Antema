import { useEffect, useState } from "react";
import Verses from "@/components/new-features/verse";
import { Slide, SlideGroup } from "@/app/SlideEngine";

function Song(props: {
    andininy: string | null;
    hira: string;
    key: string | number | undefined;
    title: string | null;
}) {
    const [data, setData] = useState<any[]>([]);
    const [repartition] = useState<number>(3);
    const [includeAnd, setIncludeAnd] = useState<string[]>([]);

    const isPresent = (and_index: number) => {
        if (includeAnd.length > 0) {
            return includeAnd.some((value) => value !== undefined && and_index === parseInt(value));
        }
        return true;
    };

    useEffect(() => {
        if (props.andininy != null) {
            setIncludeAnd(props.andininy.split(","));
        }
        fetch("../ressources/hira/01_fihirana_ffpm.json")
            .then((response) => response.json())
            .then((jsonData) => {
                const data_hira = jsonData.fihirana[props.hira].hira;
                setData(splitVerses(data_hira));
            })
            .catch((error) => console.error("Error fetching the JSON data:", error));
    }, []);

    function transformerChaine(chaine: string, tailleMax: number): string[][] {
        const lignes = chaine.split("\n");
        const resultat: string[][] = [];
        let sousTableau: string[] = [];

        lignes.forEach((ligne) => {
            if (sousTableau.length < tailleMax) {
                sousTableau.push(ligne);
            } else {
                resultat.push(sousTableau);
                sousTableau = [ligne];
            }
        });

        if (sousTableau.length > 0) {
            resultat.push(sousTableau);
        }

        return resultat;
    }

    const splitVerses = (data_hira: any[]) => {
        const data_vaovao: any[] = [];
        data_hira.forEach((data) => {
            const decomp = transformerChaine(data.tononkira, repartition);
            decomp.forEach((value) => {
                data_vaovao.push({
                    andininy: data.andininy,
                    tononkira: value,
                    fiverenany: false,
                });
            });
        });
        return data_vaovao;
    };

    return (
        <SlideGroup>
            <Slide background="/ressources/images/baiboly">
                <div style={{ fontSize: 80 }}>{props.title}</div>
            </Slide>
            {data.map(
                (hira, index) =>
                    isPresent(hira.andininy) && (
                        <Slide key={(index + 1).toString() + "-1"} background="/ressources/images/baiboly">
                            <div className="w-full">
                                <h1>{hira.andininy}</h1>
                                <Verses data={hira.tononkira} and={hira.andininy} />
                            </div>
                        </Slide>
                    )
            )}
        </SlideGroup>
    );
}

export default Song;
