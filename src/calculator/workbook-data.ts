/**
 * Quelle: RATG Rechner AUT-FL V4.2.0.xlsx.
 * Die Daten sind bewusst von der Berechnung getrennt. Keine Netzwerkabfrage zur Laufzeit.
 * AUT_T/AUT_T_2: D3:X7; AUT_GGG: die einzelnen TP-Blöcke; LIE_T: B22:D42.
 * Die Kostenschätzungen enthalten die Stunden und Rollen der jeweiligen Vorlage.
 * Tabellenstand der Vorlage, keine automatische Aktualisierung geltenden Rechts.
 */
export const AUSTRIAN_TARIFFS = {
  "current": {
    "TP1": {
      "fees": [
        4.2,
        5.9,
        7.5,
        8.4,
        9.2,
        11.1,
        14.8,
        16.1,
        17.9,
        21.5,
        26.6,
        35.1
      ],
      "step": 4.2,
      "highRate": 0.0001,
      "superRate": 5e-05,
      "cap": 312.2
    },
    "TP2": {
      "fees": [
        17.9,
        26.6,
        35.1,
        38.7,
        43.7,
        52.5,
        69.8,
        78.6,
        87.0,
        104.6,
        130.2,
        173.8
      ],
      "step": 17.9,
      "highRate": 0.0005,
      "superRate": 0.00025,
      "cap": 1558.2
    },
    "TP3A": {
      "fees": [
        35.1,
        52.5,
        69.8,
        76.8,
        87.0,
        104.6,
        139.1,
        156.2,
        173.8,
        208.2,
        260.2,
        346.6
      ],
      "step": 35.1,
      "highRate": 0.001,
      "superRate": 0.0005,
      "cap": 20770.6
    },
    "TP3B": {
      "fees": [
        43.7,
        65.4,
        87.0,
        96.0,
        108.6,
        130.2,
        173.8,
        195.2,
        216.9,
        260.2,
        325.0,
        433.2
      ],
      "step": 43.7,
      "highRate": 0.00125,
      "superRate": 0.000625,
      "cap": 25963.2
    },
    "TP3C": {
      "fees": [
        52.5,
        78.6,
        104.6,
        115.0,
        130.2,
        156.2,
        208.2,
        234.4,
        260.2,
        312.2,
        390.0,
        519.6
      ],
      "step": 52.5,
      "highRate": 0.0015,
      "superRate": 0.00075,
      "cap": 31155.8
    }
  },
  "legacy": {
    "TP1": {
      "fees": [
        3.5,
        4.9,
        6.2,
        7.0,
        7.6,
        9.2,
        12.3,
        13.4,
        14.9,
        17.9,
        22.1,
        29.2
      ],
      "step": 3.5,
      "highRate": 0.0001,
      "superRate": 5e-05,
      "cap": 260.1
    },
    "TP2": {
      "fees": [
        14.9,
        22.1,
        29.2,
        32.2,
        36.4,
        43.7,
        58.1,
        65.5,
        72.5,
        87.1,
        108.5,
        144.8
      ],
      "step": 14.9,
      "highRate": 0.0005,
      "superRate": 0.00025,
      "cap": 1298.5
    },
    "TP3A": {
      "fees": [
        29.2,
        43.7,
        58.1,
        64.0,
        72.5,
        87.1,
        115.9,
        130.1,
        144.8,
        173.5,
        216.8,
        288.8
      ],
      "step": 29.2,
      "highRate": 0.001,
      "superRate": 0.0005,
      "cap": 17308.8
    },
    "TP3B": {
      "fees": [
        36.4,
        54.5,
        72.5,
        80.0,
        90.5,
        108.5,
        144.8,
        162.6,
        180.7,
        216.8,
        270.8,
        361.0
      ],
      "step": 36.4,
      "highRate": 0.00125,
      "superRate": 0.000625,
      "cap": 21636.0
    },
    "TP3C": {
      "fees": [
        43.7,
        65.5,
        87.1,
        95.8,
        108.5,
        130.1,
        173.5,
        195.3,
        216.8,
        260.1,
        325.0,
        433.0
      ],
      "step": 43.7,
      "highRate": 0.0015,
      "superRate": 0.00075,
      "cap": 25963.1
    }
  }
} as const;

export const AUSTRIAN_COURT_FEES = {
  "legacy": {
    "TP1": {
      "limits": [
        150.0,
        300.0,
        700.0,
        2000.0,
        3500.0,
        7000.0,
        35000.0,
        70000.0,
        140000.0,
        210000.0,
        280000.0,
        350000.0
      ],
      "fees": [
        25.0,
        48.0,
        68.0,
        114.0,
        182.0,
        335.0,
        792.0,
        1556.0,
        3112.0,
        4670.0,
        6227.0,
        7783.0
      ],
      "rate": 0.012,
      "add": 4203
    },
    "TP2": {
      "limits": [
        150.0,
        300.0,
        700.0,
        2000.0,
        3500.0,
        7000.0,
        35000.0,
        70000.0,
        140000.0,
        210000.0,
        280000.0,
        350000.0
      ],
      "fees": [
        20.0,
        44.0,
        75.0,
        154.0,
        304.0,
        609.0,
        1219.0,
        2288.0,
        4579.0,
        6867.0,
        9156.0,
        11446.0
      ],
      "rate": 0.018,
      "add": 6071
    },
    "TP3a": {
      "limits": [
        2000.0,
        3500.0,
        7000.0,
        35000.0,
        70000.0,
        140000.0,
        210000.0,
        280000.0,
        350000.0
      ],
      "fees": [
        228.0,
        381.0,
        762.0,
        1526.0,
        3051.0,
        6104.0,
        9156.0,
        12211.0,
        15263.0
      ],
      "rate": 0.024,
      "add": 8096
    },
    "TP3b": 5884.0
  },
  "current": {
    "TP1": {
      "limits": [
        150.0,
        300.0,
        700.0,
        2000.0,
        3500.0,
        7000.0,
        35000.0,
        70000.0,
        140000.0,
        210000.0,
        280000.0,
        350000.0
      ],
      "fees": [
        31.0,
        59.0,
        84.0,
        140.0,
        224.0,
        412.0,
        974.0,
        1914.0,
        3829.0,
        5746.0,
        7661.0,
        9576.0
      ],
      "rate": 0.012,
      "add": 6964
    },
    "TP2": {
      "limits": [
        150.0,
        300.0,
        700.0,
        2000.0,
        3500.0,
        7000.0,
        35000.0,
        70000.0,
        140000.0,
        210000.0,
        280000.0,
        350000.0
      ],
      "fees": [
        25.0,
        54.0,
        92.0,
        189.0,
        374.0,
        749.0,
        1500.0,
        2815.0,
        5634.0,
        8449.0,
        11265.0,
        14083.0
      ],
      "rate": 0.018,
      "add": 10106
    },
    "TP3a": {
      "limits": [
        2000.0,
        3500.0,
        7000.0,
        35000.0,
        70000.0,
        140000.0,
        210000.0,
        280000.0,
        350000.0
      ],
      "fees": [
        281.0,
        469.0,
        938.0,
        1878.0,
        3754.0,
        7510.0,
        11265.0,
        15024.0,
        18779.0
      ],
      "rate": 0.024,
      "add": 13477
    },
    "TP3b": 7239.0
  }
} as const;

export const CRIMINAL_FEES = {
  "TP4 I 1": [
    150.0,
    375.0
  ],
  "TP4 I 2 1.F": [
    150.0,
    375.0
  ],
  "TP4 I 2 2.F": [
    75.0,
    187.5
  ],
  "TP4 I 3a": [
    37.5,
    93.75
  ],
  "TP4 I 3b": [
    300.0,
    750.0
  ],
  "TP4 I 3c": [
    450.0,
    1125.0
  ],
  "TP4 I 4": [
    300.0,
    750.0
  ],
  "TP4 I 5": [
    450.0,
    1125.0
  ],
  "TP4 II 1": [
    150.0,
    375.0,
    750.0
  ],
  "TP4 II 2 1.F": [
    150.0,
    375.0,
    750.0
  ],
  "TP4 II 2 2.F": [
    75.0,
    187.5,
    375.0
  ],
  "TP4 II 3a": [
    37.5,
    93.75,
    187.5
  ],
  "TP4 II 3b": [
    300.0,
    750.0,
    1500.0
  ],
  "TP4 II 3c": [
    450.0,
    1125.0,
    2250.0
  ],
  "TP4 II 4": [
    300.0,
    750.0,
    1500.0
  ],
  "TP4 II 5": [
    450.0,
    1125.0,
    2250.0
  ]
} as const;

export const ESTIMATE_TEMPLATES = {
  "activeDE": {
    "roles": [
      {
        "label": "Partner",
        "rate": 500.0,
        "weight": 25.0,
        "discount": 0.0
      },
      {
        "label": "Counsel",
        "rate": 0.0,
        "weight": 0.0,
        "discount": 0.0
      },
      {
        "label": "Senior Associate",
        "rate": 400.0,
        "weight": 0.0,
        "discount": 0.0
      },
      {
        "label": "Associate",
        "rate": 350.0,
        "weight": 75.0,
        "discount": 0.0
      }
    ],
    "phases": [
      {
        "id": "48",
        "label": "Einleitungsphase:",
        "instance": 1,
        "tasks": [
          {
            "id": "49",
            "label": "Erste Einschätzung",
            "hours": 1.0
          },
          {
            "id": "50",
            "label": "Prüfung und Bewertung von Akten und Dokumenten",
            "hours": 2.0
          },
          {
            "id": "51",
            "label": "Prüfung der Unterlagen auf Vollständigkeit und Liste weiterer erforderlicher Unterlagen (falls vorhanden)",
            "hours": 1.0
          },
          {
            "id": "52",
            "label": "Korrespondenz",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "59",
        "label": "Entwurf Klage",
        "instance": 1,
        "tasks": [
          {
            "id": "60",
            "label": "Erstellen der Klage",
            "hours": 17.0
          },
          {
            "id": "61",
            "label": "Prüfung und Bewertung von Akten und Dokumenten",
            "hours": 5.0
          },
          {
            "id": "62",
            "label": "Vorbereitung der Beweismittel und Beilagen",
            "hours": 5.0
          },
          {
            "id": "63",
            "label": "Korrespondenz",
            "hours": 3.0
          }
        ]
      },
      {
        "id": "72",
        "label": "Kautionstagsatzung",
        "instance": 1,
        "tasks": [
          {
            "id": "73",
            "label": "Vorbereitung",
            "hours": 2.0
          },
          {
            "id": "74",
            "label": "Aktenstudium",
            "hours": 1.0
          },
          {
            "id": "75",
            "label": "Entwurf replizierendes Vorbringen",
            "hours": 2.0
          },
          {
            "id": "76",
            "label": "Teilnahme",
            "hours": 1.0
          },
          {
            "id": "77",
            "label": "Wegzeit",
            "hours": 1.0
          },
          {
            "id": "78",
            "label": "Korrespondenz",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "86",
        "label": "Entwurf ergänzender/vorbereitender Schriftsatz",
        "instance": 1,
        "tasks": [
          {
            "id": "87",
            "label": "Entwurf",
            "hours": 10.0
          },
          {
            "id": "88",
            "label": "Aktenstudium",
            "hours": 2.0
          },
          {
            "id": "89",
            "label": "Vorbereiteung Beweismittel und Beilagen",
            "hours": 1.0
          },
          {
            "id": "90",
            "label": "Korrespondenz",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "96",
        "label": "Erste Tagsatzung",
        "instance": 1,
        "tasks": [
          {
            "id": "97",
            "label": "Vorbereitung",
            "hours": 3.0
          },
          {
            "id": "98",
            "label": "Aktenstudium",
            "hours": 1.0
          },
          {
            "id": "99",
            "label": "Entwurf replizierendes Vorbringen",
            "hours": 2.0
          },
          {
            "id": "100",
            "label": "Teilnahme",
            "hours": 1.0
          },
          {
            "id": "101",
            "label": "Wegzeit",
            "hours": 1.0
          },
          {
            "id": "102",
            "label": "Korrespondenz",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "109",
        "label": "Zweite Tagsatzung",
        "instance": 1,
        "tasks": [
          {
            "id": "110",
            "label": "Vorbereitung",
            "hours": 5.0
          },
          {
            "id": "111",
            "label": "Aktenstudium",
            "hours": 2.0
          },
          {
            "id": "112",
            "label": "Entwurf replizierendes Vorbringen",
            "hours": 1.0
          },
          {
            "id": "113",
            "label": "Teilnahme",
            "hours": 4.0
          },
          {
            "id": "114",
            "label": "Wegzeit",
            "hours": 1.0
          },
          {
            "id": "115",
            "label": "Korrespondenz",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "122",
        "label": "Entwurf ergänzender/vorbereitender Schriftsatz",
        "instance": 1,
        "tasks": [
          {
            "id": "123",
            "label": "Entwurf",
            "hours": 10.0
          },
          {
            "id": "124",
            "label": "Aktenstudium",
            "hours": 3.0
          },
          {
            "id": "125",
            "label": "Vorbereiteung Beweismittel und Beilagen",
            "hours": 1.0
          },
          {
            "id": "126",
            "label": "Korrespondenz",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "133",
        "label": "Dritte Tagsatzung",
        "instance": 1,
        "tasks": [
          {
            "id": "134",
            "label": "Vorbereitung",
            "hours": 2.0
          },
          {
            "id": "135",
            "label": "Aktenstudium",
            "hours": 1.0
          },
          {
            "id": "136",
            "label": "Entwurf replizierendes Vorbringen",
            "hours": 1.0
          },
          {
            "id": "137",
            "label": "Teilnahme",
            "hours": 3.0
          },
          {
            "id": "138",
            "label": "Wegzeit",
            "hours": 1.0
          },
          {
            "id": "139",
            "label": "Korrespondenz",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "146",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "147",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "148",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "149",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "150",
            "label": "Korrespondenz",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "157",
        "label": "Fourth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "158",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "159",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "160",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "161",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "162",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "163",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "170",
        "label": "Fifth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "171",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "172",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "173",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "174",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "175",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "176",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "183",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "184",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "185",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "186",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "187",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "194",
        "label": "Motion regarding supplementation of expert opinions",
        "instance": 1,
        "tasks": [
          {
            "id": "195",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "196",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "197",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "198",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "205",
        "label": "Sixth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "206",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "207",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "208",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "209",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "210",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "211",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "218",
        "label": "Appeal",
        "instance": 2,
        "tasks": [
          {
            "id": "219",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "220",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "221",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "222",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "229",
        "label": "Appeal/Revision",
        "instance": 3,
        "tasks": [
          {
            "id": "230",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "231",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "232",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "233",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      }
    ],
    "instances": [
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 2000.0,
        "successLumpSum": 0
      },
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 0.0,
        "successLumpSum": 0
      },
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 0.0,
        "successLumpSum": 0
      }
    ],
    "successPercent": 0
  },
  "activeEN": {
    "roles": [
      {
        "label": "Partner",
        "rate": 500.0,
        "weight": 25.0,
        "discount": 0.0
      },
      {
        "label": "Counsel",
        "rate": 0.0,
        "weight": 0.0,
        "discount": 0.0
      },
      {
        "label": "Senior Associate",
        "rate": 400.0,
        "weight": 0.0,
        "discount": 0.0
      },
      {
        "label": "Associate",
        "rate": 350.0,
        "weight": 75.0,
        "discount": 0.0
      }
    ],
    "phases": [
      {
        "id": "48",
        "label": "Induction Phase",
        "instance": 1,
        "tasks": [
          {
            "id": "49",
            "label": "Initital consultation",
            "hours": 1.0
          },
          {
            "id": "50",
            "label": "Review and assessment of file and documents",
            "hours": 2.0
          },
          {
            "id": "51",
            "label": "Examination of the files re completeness and list of further required documentation (if any)",
            "hours": 5.0
          },
          {
            "id": "52",
            "label": "Correspondence",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "59",
        "label": "Draft Lawsuit",
        "instance": 1,
        "tasks": [
          {
            "id": "60",
            "label": "Draft Statement of Claim",
            "hours": 17.0
          },
          {
            "id": "61",
            "label": "Further review of files in relation to necessary evidence",
            "hours": 5.0
          },
          {
            "id": "62",
            "label": "Preparation of appendices",
            "hours": 5.0
          },
          {
            "id": "63",
            "label": "Correspondence",
            "hours": 3.0
          }
        ]
      },
      {
        "id": "73",
        "label": "Deposit Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "74",
            "label": "Preparation",
            "hours": 2.0
          },
          {
            "id": "75",
            "label": "Study of the files",
            "hours": 1.0
          },
          {
            "id": "76",
            "label": "Drafting reply",
            "hours": 2.0
          },
          {
            "id": "77",
            "label": "Attendance",
            "hours": 1.0
          },
          {
            "id": "78",
            "label": "Transit Lup Sum",
            "hours": 1.0
          },
          {
            "id": "79",
            "label": "Correspondence",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "87",
        "label": "Draft Additional and Preparatory Pleadings",
        "instance": 1,
        "tasks": [
          {
            "id": "88",
            "label": "Drafting additional pleadings",
            "hours": 10.0
          },
          {
            "id": "89",
            "label": "Further review of files in relation to necessary evidence",
            "hours": 2.0
          },
          {
            "id": "90",
            "label": "Preparation of appendices",
            "hours": 1.0
          },
          {
            "id": "91",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "97",
        "label": "First Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "98",
            "label": "Preparation",
            "hours": 3.0
          },
          {
            "id": "99",
            "label": "Study of the pleadings of the defendant",
            "hours": 1.0
          },
          {
            "id": "100",
            "label": "Drafting reply",
            "hours": 2.0
          },
          {
            "id": "101",
            "label": "Attendance",
            "hours": 1.0
          },
          {
            "id": "102",
            "label": "Transit Lump Sum",
            "hours": 1.0
          },
          {
            "id": "103",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "110",
        "label": "Second Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "111",
            "label": "Preparation",
            "hours": 5.0
          },
          {
            "id": "112",
            "label": "Study of the files",
            "hours": 2.0
          },
          {
            "id": "113",
            "label": "Drafting reply",
            "hours": 1.0
          },
          {
            "id": "114",
            "label": "Attendance",
            "hours": 4.0
          },
          {
            "id": "115",
            "label": "Transit Lump Sum",
            "hours": 1.0
          },
          {
            "id": "116",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "123",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "124",
            "label": "Drafting",
            "hours": 10.0
          },
          {
            "id": "125",
            "label": "Study of the files",
            "hours": 3.0
          },
          {
            "id": "126",
            "label": "Preparation of appendices",
            "hours": 1.0
          },
          {
            "id": "127",
            "label": "Correspondence",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "134",
        "label": "Third Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "135",
            "label": "Preparation",
            "hours": 2.0
          },
          {
            "id": "136",
            "label": "Study of the files",
            "hours": 1.0
          },
          {
            "id": "137",
            "label": "Drafting reply",
            "hours": 1.0
          },
          {
            "id": "138",
            "label": "Attendance",
            "hours": 3.0
          },
          {
            "id": "139",
            "label": "Transit time",
            "hours": 1.0
          },
          {
            "id": "140",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "147",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "148",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "149",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "150",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "151",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "158",
        "label": "Fourth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "159",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "160",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "161",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "162",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "163",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "164",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "171",
        "label": "Fifth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "172",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "173",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "174",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "175",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "176",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "177",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "184",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "185",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "186",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "187",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "188",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "195",
        "label": "Motion regarding supplementation of expert opinions",
        "instance": 1,
        "tasks": [
          {
            "id": "196",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "197",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "198",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "199",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "206",
        "label": "Sixth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "207",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "208",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "209",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "210",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "211",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "212",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "219",
        "label": "Appeal",
        "instance": 2,
        "tasks": [
          {
            "id": "220",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "221",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "222",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "223",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "230",
        "label": "Appeal/Revision",
        "instance": 3,
        "tasks": [
          {
            "id": "231",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "232",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "233",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "234",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      }
    ],
    "instances": [
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 0.0,
        "successLumpSum": 0
      },
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 0.0,
        "successLumpSum": 0
      },
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 0.0,
        "successLumpSum": 0
      }
    ],
    "successPercent": 0
  },
  "passive": {
    "roles": [
      {
        "label": "Partner",
        "rate": 600.0,
        "weight": 50.0,
        "discount": 0.0
      },
      {
        "label": "Counsel",
        "rate": 550.0,
        "weight": 0.0,
        "discount": 0.0
      },
      {
        "label": "Senior Associate",
        "rate": 500.0,
        "weight": 50.0,
        "discount": 0.0
      },
      {
        "label": "Associate",
        "rate": 450.0,
        "weight": 0.0,
        "discount": 0.0
      }
    ],
    "phases": [
      {
        "id": "48",
        "label": "Induction Phase",
        "instance": 1,
        "tasks": [
          {
            "id": "49",
            "label": "Initital consultation",
            "hours": 1.0
          },
          {
            "id": "50",
            "label": "Review and assessment of file and documents",
            "hours": 10.0
          },
          {
            "id": "51",
            "label": "Examination of the files re completeness and list of further required documentation (if any)",
            "hours": 2.0
          },
          {
            "id": "52",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "59",
        "label": "Draft Statement of Defense",
        "instance": 1,
        "tasks": [
          {
            "id": "60",
            "label": "Draft Statement of Defense",
            "hours": 30.0
          },
          {
            "id": "61",
            "label": "Further review of files in relation to necessary evidence",
            "hours": 20.0
          },
          {
            "id": "62",
            "label": "Preparation of appendices",
            "hours": 2.0
          },
          {
            "id": "63",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "73",
        "label": "Deposit Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "74",
            "label": "Preparation",
            "hours": 5.0
          },
          {
            "id": "75",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "76",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "77",
            "label": "Attendance",
            "hours": 1.0
          },
          {
            "id": "78",
            "label": "Transit time",
            "hours": 1.0
          },
          {
            "id": "79",
            "label": "Correspondence",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "87",
        "label": "Draft Additional and Preparatory Pleadings",
        "instance": 1,
        "tasks": [
          {
            "id": "88",
            "label": "Drafting additional pleadings",
            "hours": 25.0
          },
          {
            "id": "89",
            "label": "Further review of files in relation to necessary evidence",
            "hours": 20.0
          },
          {
            "id": "90",
            "label": "Preparation of appendices",
            "hours": 2.0
          },
          {
            "id": "91",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "97",
        "label": "First Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "98",
            "label": "Preparation",
            "hours": 3.0
          },
          {
            "id": "99",
            "label": "Study of the pleadings of the defendant",
            "hours": 1.0
          },
          {
            "id": "100",
            "label": "Drafting reply",
            "hours": 1.0
          },
          {
            "id": "101",
            "label": "Attendance",
            "hours": 2.0
          },
          {
            "id": "102",
            "label": "Transit time",
            "hours": 1.0
          },
          {
            "id": "103",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "110",
        "label": "Second Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "111",
            "label": "Preparation",
            "hours": 15.0
          },
          {
            "id": "112",
            "label": "Study of the files",
            "hours": 2.0
          },
          {
            "id": "113",
            "label": "Drafting reply",
            "hours": 1.0
          },
          {
            "id": "114",
            "label": "Attendance",
            "hours": 4.0
          },
          {
            "id": "115",
            "label": "Transit time",
            "hours": 1.0
          },
          {
            "id": "116",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "123",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "124",
            "label": "Drafting",
            "hours": 5.0
          },
          {
            "id": "125",
            "label": "Study of the files",
            "hours": 2.0
          },
          {
            "id": "126",
            "label": "Preparation of appendices",
            "hours": 2.0
          },
          {
            "id": "127",
            "label": "Correspondence",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "134",
        "label": "Third Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "135",
            "label": "Preparation",
            "hours": 10.0
          },
          {
            "id": "136",
            "label": "Study of the files",
            "hours": 2.0
          },
          {
            "id": "137",
            "label": "Drafting reply",
            "hours": 1.0
          },
          {
            "id": "138",
            "label": "Attendance",
            "hours": 4.0
          },
          {
            "id": "139",
            "label": "Transit time",
            "hours": 1.0
          },
          {
            "id": "140",
            "label": "Correspondence",
            "hours": 2.0
          }
        ]
      },
      {
        "id": "147",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "148",
            "label": "Drafting",
            "hours": 5.0
          },
          {
            "id": "149",
            "label": "Study of the files",
            "hours": 2.0
          },
          {
            "id": "150",
            "label": "Preparation of appendices",
            "hours": 2.0
          },
          {
            "id": "151",
            "label": "Correspondence",
            "hours": 1.0
          }
        ]
      },
      {
        "id": "158",
        "label": "Fourth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "159",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "160",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "161",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "162",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "163",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "164",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "171",
        "label": "Fifth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "172",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "173",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "174",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "175",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "176",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "177",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "184",
        "label": "Draft Additional/Preparatory Pleading",
        "instance": 1,
        "tasks": [
          {
            "id": "185",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "186",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "187",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "188",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "195",
        "label": "Motion regarding supplementation of expert opinions",
        "instance": 1,
        "tasks": [
          {
            "id": "196",
            "label": "Drafting",
            "hours": 0.0
          },
          {
            "id": "197",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "198",
            "label": "Preparation of appendices",
            "hours": 0.0
          },
          {
            "id": "199",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "206",
        "label": "Sixth Hearing",
        "instance": 1,
        "tasks": [
          {
            "id": "207",
            "label": "Preparation",
            "hours": 0.0
          },
          {
            "id": "208",
            "label": "Study of the files",
            "hours": 0.0
          },
          {
            "id": "209",
            "label": "Drafting reply",
            "hours": 0.0
          },
          {
            "id": "210",
            "label": "Attendance",
            "hours": 0.0
          },
          {
            "id": "211",
            "label": "Transit time",
            "hours": 0.0
          },
          {
            "id": "212",
            "label": "Correspondence",
            "hours": 0.0
          }
        ]
      },
      {
        "id": "219",
        "label": "Appeal",
        "instance": 2,
        "tasks": [
          {
            "id": "220",
            "label": "Drafting",
            "hours": 35.0
          },
          {
            "id": "221",
            "label": "Study of the files",
            "hours": 30.0
          },
          {
            "id": "222",
            "label": "Preparation of appendices",
            "hours": 2.0
          },
          {
            "id": "223",
            "label": "Correspondence",
            "hours": 5.0
          }
        ]
      },
      {
        "id": "230",
        "label": "Appeal/Revision",
        "instance": 3,
        "tasks": [
          {
            "id": "231",
            "label": "Drafting",
            "hours": 35.0
          },
          {
            "id": "232",
            "label": "Study of the files",
            "hours": 30.0
          },
          {
            "id": "233",
            "label": "Preparation of appendices",
            "hours": 2.0
          },
          {
            "id": "234",
            "label": "Correspondence",
            "hours": 5.0
          }
        ]
      }
    ],
    "instances": [
      {
        "expert": 0.0,
        "translation": 25000.0,
        "court": 0.0,
        "successLumpSum": 0
      },
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 18000.0,
        "successLumpSum": 0
      },
      {
        "expert": 0.0,
        "translation": 0.0,
        "court": 18000.0,
        "successLumpSum": 0
      }
    ],
    "successPercent": 0
  }
} as const;

