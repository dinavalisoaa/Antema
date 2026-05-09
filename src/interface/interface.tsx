export interface TypeSong {
    id: string;
    name: string;
}

export interface CategorySong {
    id: string;
    name: string;
    typeId: string;
}

export interface HymnVerse {
    andininy: number;
    tononkira: string;
    fiverenany: boolean;
}

export interface Hymn {
    id: string;
    laharana: string;
    sokajy: string;
    lohateny: string;
    mpanoratra: string[];
    hira: HymnVerse[];
    source: 'ffpm' | 'fanampiny';
}