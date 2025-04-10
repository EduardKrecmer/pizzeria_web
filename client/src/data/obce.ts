export interface Obec {
  obec: string;
  psc: string;
  casti: string[];
}

// Zoznam obcí z okresu Púchov
export const obce: Obec[] = [
  {
    "obec": "Púchov",
    "psc": "02001",
    "casti": [
      "Púchov",
      "Horné Kočkovce",
      "Hoštiná",
      "Hrabovka",
      "Ihrište",
      "Nosice",
      "Vieska-Bezdedov"
    ]
  },
  {
    "obec": "Beluša",
    "psc": "01861",
    "casti": [
      "Beluša",
      "Hloža",
      "Podhorie"
    ]
  },
  {
    "obec": "Dohňany",
    "psc": "02051",
    "casti": [
      "Dohňany",
      "Mostište",
      "Zbora"
    ]
  },
  {
    "obec": "Dolná Breznica",
    "psc": "02061",
    "casti": [
      "Dolná Breznica"
    ]
  },
  {
    "obec": "Dolné Kočkovce",
    "psc": "02001",
    "casti": [
      "Dolné Kočkovce"
    ]
  },
  {
    "obec": "Horovce",
    "psc": "02062",
    "casti": [
      "Horovce"
    ]
  },
  {
    "obec": "Horná Breznica",
    "psc": "02061",
    "casti": [
      "Horná Breznica"
    ]
  },
  {
    "obec": "Lednica",
    "psc": "02063",
    "casti": [
      "Lednica"
    ]
  },
  {
    "obec": "Lednické Rovne",
    "psc": "02061",
    "casti": [
      "Lednické Rovne",
      "Horenická Hôrka",
      "Medné",
      "Súľovky"
    ]
  },
  {
    "obec": "Lazy pod Makytou",
    "psc": "02055",
    "casti": [
      "Lazy pod Makytou",
      "Dubková",
      "Tisové",
      "Čertov"
    ]
  },
  {
    "obec": "Lúky",
    "psc": "02053",
    "casti": [
      "Lúky"
    ]
  },
  {
    "obec": "Lysá pod Makytou",
    "psc": "02054",
    "casti": [
      "Lysá pod Makytou"
    ]
  },
  {
    "obec": "Mestečko",
    "psc": "02052",
    "casti": [
      "Mestečko"
    ]
  },
  {
    "obec": "Mojtín",
    "psc": "02072",
    "casti": [
      "Mojtín"
    ]
  },
  {
    "obec": "Nimnica",
    "psc": "02071",
    "casti": [
      "Nimnica"
    ]
  },
  {
    "obec": "Streženice",
    "psc": "02001",
    "casti": [
      "Streženice"
    ]
  },
  {
    "obec": "Visolaje",
    "psc": "01861",
    "casti": [
      "Visolaje"
    ]
  },
  {
    "obec": "Záriečie",
    "psc": "02052",
    "casti": [
      "Záriečie"
    ]
  },
  {
    "obec": "Zubák",
    "psc": "02064",
    "casti": [
      "Zubák"
    ]
  }
];

// Vráti PSČ podľa názvu obce
export const getPSCByObec = (nazovObce: string): string => {
  const obec = obce.find(o => o.obec === nazovObce);
  return obec?.psc || '';
};

// Vráti, či obec vyžaduje pole "Ulica a číslo" (Púchov alebo Beluša)
export const potrebujeUlicu = (nazovObce: string): boolean => {
  return nazovObce === 'Púchov' || nazovObce === 'Beluša';
};