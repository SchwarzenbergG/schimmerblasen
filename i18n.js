/* Zauberhafte Zahlenordnung — interface copy for de, en, fr, es.
   Number speech used by logic.js lives in speech(). */
(function (root) {
  const LANGS = ["de", "en", "fr", "es"];
  let lang = "de";

  const EN_NUM = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  const FR_NUM = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
  const ES_NUM = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];

  function word(list, num) {
    return list[num] || String(num);
  }

  function pairWord(table, num, den, fallback) {
    const pair = table[den];
    if (!pair) return fallback(num, den);
    return num === 1 ? pair[0] : pair[1];
  }

  const DE_DEN = {
    3: "Drittel",
    4: "Viertel",
    5: "Fünftel",
    6: "Sechstel",
    7: "Siebtel",
    8: "Achtel",
    9: "Neuntel",
    10: "Zehntel",
    12: "Zwölftel",
    14: "Vierzehntel",
    15: "Fünfzehntel",
    16: "Sechzehntel",
    18: "Achtzehntel",
  };

  const EN_DEN = {
    2: ["half", "halves"],
    3: ["third", "thirds"],
    4: ["quarter", "quarters"],
    5: ["fifth", "fifths"],
    6: ["sixth", "sixths"],
    7: ["seventh", "sevenths"],
    8: ["eighth", "eighths"],
    9: ["ninth", "ninths"],
    10: ["tenth", "tenths"],
    12: ["twelfth", "twelfths"],
    14: ["fourteenth", "fourteenths"],
    15: ["fifteenth", "fifteenths"],
    16: ["sixteenth", "sixteenths"],
    18: ["eighteenth", "eighteenths"],
  };

  const FR_DEN = {
    2: ["demi", "demis"],
    3: ["tiers", "tiers"],
    4: ["quart", "quarts"],
    5: ["cinquième", "cinquièmes"],
    6: ["sixième", "sixièmes"],
    7: ["septième", "septièmes"],
    8: ["huitième", "huitièmes"],
    9: ["neuvième", "neuvièmes"],
    10: ["dixième", "dixièmes"],
    12: ["douzième", "douzièmes"],
    14: ["quatorzième", "quatorzièmes"],
    15: ["quinzième", "quinzièmes"],
    16: ["seizième", "seizièmes"],
    18: ["dix-huitième", "dix-huitièmes"],
  };

  const ES_DEN = {
    2: ["medio", "medios"],
    3: ["tercio", "tercios"],
    4: ["cuarto", "cuartos"],
    5: ["quinto", "quintos"],
    6: ["sexto", "sextos"],
    7: ["séptimo", "séptimos"],
    8: ["octavo", "octavos"],
    9: ["noveno", "novenos"],
    10: ["décimo", "décimos"],
    12: ["doceavo", "doceavos"],
    14: ["catorceavo", "catorceavos"],
    15: ["quinceavo", "quinceavos"],
    16: ["dieciseisavo", "dieciseisavos"],
    18: ["dieciochoavo", "dieciochoavos"],
  };

  const SPEECH = {
    de: {
      minus: "minus",
      comma: "Komma",
      and: "und",
      numWord: function (num) { return num === 1 ? "ein" : String(num); },
      denWord: function (num, den) {
        if (den === 2) return num === 1 ? "Halb" : "Halbe";
        return DE_DEN[den] || den + "tel";
      },
    },
    en: {
      minus: "minus",
      comma: "point",
      and: "and",
      numWord: function (num) { return word(EN_NUM, num); },
      denWord: function (num, den) {
        return pairWord(EN_DEN, num, den, function (n, d) { return d + (n === 1 ? "th" : "ths"); });
      },
    },
    fr: {
      minus: "moins",
      comma: "virgule",
      and: "et",
      numWord: function (num) { return word(FR_NUM, num); },
      denWord: function (num, den) {
        return pairWord(FR_DEN, num, den, function (n, d) { return d + "e"; });
      },
    },
    es: {
      minus: "menos",
      comma: "coma",
      and: "y",
      numWord: function (num) { return word(ES_NUM, num); },
      denWord: function (num, den) {
        return pairWord(ES_DEN, num, den, function (n, d) { return d + "avos"; });
      },
    },
  };

  const MODES = {
    de: {
      dezi: { title: "Dezimalzahlen", lead: "Zahlen mit Komma, bis zu zwei Nachkommastellen." },
      bruch: { title: "Brüche", lead: "Echte Brüche, gemischte Zahlen und negative Brüche." },
      misch: { title: "Gemischt", lead: "Dezimalzahlen und Brüche in einer Runde. Zuerst das Vorzeichen, dann dieselbe Schreibweise." },
    },
    en: {
      dezi: { title: "Decimals", lead: "Numbers with a decimal point, up to two decimal places." },
      bruch: { title: "Fractions", lead: "Proper fractions, mixed numbers, and negative fractions." },
      misch: { title: "Mixed", lead: "Decimals and fractions in one round. Sign first, then the same notation." },
    },
    fr: {
      dezi: { title: "Nombres décimaux", lead: "Des nombres avec une virgule, jusqu'à deux décimales." },
      bruch: { title: "Fractions", lead: "Fractions propres, nombres mixtes et fractions négatives." },
      misch: { title: "Mélangé", lead: "Décimaux et fractions dans une même manche. D'abord le signe, puis la même écriture." },
    },
    es: {
      dezi: { title: "Números decimales", lead: "Números con coma, hasta dos decimales." },
      bruch: { title: "Fracciones", lead: "Fracciones propias, números mixtos y fracciones negativas." },
      misch: { title: "Mezclado", lead: "Decimales y fracciones en una misma ronda. Primero el signo, luego la misma escritura." },
    },
  };

  function L(name, blurb, coach) {
    return { name: name, blurb: blurb, coach: coach };
  }

  const LEVELS = {
    de: {
      dezi: [
        L("Seichte Lagune", "Positive Zahlen mit einer Nachkommastelle.", "Tippe die kleinste Zahl zuerst, danach immer die nächstgrößere."),
        L("Helle Bucht", "Bis zu zwei Stellen nach dem Komma.", "Vergleiche erst die Einer, dann die Zehntel, dann die Hundertstel."),
        L("Nahe Nachbarn", "Die Zahlen liegen eng beieinander.", "Die Zahlen liegen nah beieinander. Vergleiche sie Stelle für Stelle."),
        L("Spiegelwasser", "Jetzt kommen negative Zahlen dazu.", "Negative Zahlen sind kleiner als null. −5 ist kleiner als −1."),
        L("Tiefenriff", "Negative Zahlen mit zwei Nachkommastellen.", "Bei zwei negativen Zahlen ist die weiter von null entfernt die kleinere. −2,4 ist kleiner als −1,8."),
        L("Perlenwirbel", "Ganz nah beieinander, auch unter null.", "Schau genau hin: −0,8 ist kleiner als −0,15, weil −0,8 weiter links liegt."),
        L("Gezeiten", "Viele Zahlen, kleine Abstände, beide Seiten der Null.", "Erst das Vorzeichen, dann die Nachkommastellen. Die kleinste Zahl zuerst."),
      ],
      bruch: [
        L("Klare Tropfen", "Alle Brüche haben denselben Nenner.", "Der Nenner ist bei allen gleich. Der kleinere Zähler ist der kleinere Bruch."),
        L("Stammbrüche", "Der Zähler ist immer 1.", "Der Zähler ist 1. Je größer der Nenner, desto kleiner der Bruch. 1/2 ist größer als 1/8."),
        L("Bunte Nenner", "Zähler und Nenner wechseln.", "Die Nenner sind verschieden. Du kannst über Kreuz vergleichen oder die Brüche gleichnamig machen."),
        L("Über eins", "Unechte Brüche und gemischte Zahlen.", "1 3/4 ist dasselbe wie 7/4. Wandle gemischte Zahlen um, bevor du sie vergleichst."),
        L("Unter null", "Negative Brüche und die Null.", "−3/4 ist kleiner als −1/4. Unter null liegt die kleinere Zahl weiter links."),
        L("Eng beieinander", "Brüche mit knappem Abstand.", "Diese Brüche liegen eng zusammen. Gleichnamig machen hilft beim Vergleichen."),
        L("Kronenriff", "Vorzeichen, gemischte Zahlen und enge Brüche.", "Erst das Vorzeichen. Negative Brüche kommen vor allen positiven."),
      ],
      misch: [
        L("Perlmutt", "Dezimalzahlen, Brüche und gemischte Zahlen zusammen.", "Erst das Vorzeichen. Dann dieselbe Schreibweise: 1/2 ist dasselbe wie 0,5."),
      ],
    },
    en: {
      dezi: [
        L("Shallow Lagoon", "Positive numbers with one decimal place.", "Tap the smallest number first, then each next larger one."),
        L("Bright Bay", "Up to two digits after the decimal point.", "Compare the ones first, then the tenths, then the hundredths."),
        L("Close Neighbors", "The numbers sit close together.", "These numbers sit close together. Compare them place by place."),
        L("Mirror Water", "Negative numbers join in.", "Negative numbers are less than zero. −5 is less than −1."),
        L("Deep Reef", "Negative numbers with two decimal places.", "Of two negative numbers, the one farther from zero is smaller. −2.4 is less than −1.8."),
        L("Pearl Swirl", "Very close together, including below zero.", "Look closely: −0.8 is less than −0.15, because −0.8 is farther to the left."),
        L("Tides", "Many numbers, small gaps, both sides of zero.", "Sign first, then the decimal places. The smallest number comes first."),
      ],
      bruch: [
        L("Clear Drops", "Every fraction has the same denominator.", "The denominator is the same for every one. The smaller numerator is the smaller fraction."),
        L("Unit Fractions", "The numerator is always 1.", "The numerator is 1. The larger the denominator, the smaller the fraction. 1/2 is greater than 1/8."),
        L("Mixed Denominators", "Numerators and denominators change.", "The denominators differ. Compare crosswise, or give the fractions a common denominator."),
        L("Over One", "Improper fractions and mixed numbers.", "1 3/4 is the same as 7/4. Turn mixed numbers into fractions before you compare them."),
        L("Below Zero", "Negative fractions and zero.", "−3/4 is less than −1/4. Below zero, the smaller number lies farther to the left."),
        L("Close Together", "Fractions with a narrow gap.", "These fractions sit close together. A common denominator makes them easier to compare."),
        L("Crown Reef", "Signs, mixed numbers, and close fractions.", "Sign first. Negative fractions come before every positive number."),
      ],
      misch: [
        L("Mother-of-pearl", "Decimals, fractions, and mixed numbers together.", "Sign first. Then the same notation: 1/2 is the same as 0.5."),
      ],
    },
    fr: {
      dezi: [
        L("Lagon peu profond", "Nombres positifs avec une décimale.", "Touche d'abord le plus petit nombre, puis celui juste au-dessus."),
        L("Baie claire", "Jusqu'à deux chiffres après la virgule.", "Compare d'abord les unités, puis les dixièmes, puis les centièmes."),
        L("Voisins proches", "Les nombres sont très proches.", "Ces nombres sont proches. Compare-les chiffre par chiffre."),
        L("Eau miroir", "Les nombres négatifs arrivent.", "Les nombres négatifs sont plus petits que zéro. −5 est plus petit que −1."),
        L("Récif profond", "Nombres négatifs avec deux décimales.", "Entre deux nombres négatifs, le plus éloigné de zéro est le plus petit. −2,4 est plus petit que −1,8."),
        L("Tourbillon de perles", "Tout près les uns des autres, aussi sous zéro.", "Regarde bien : −0,8 est plus petit que −0,15, car −0,8 est plus à gauche."),
        L("Marées", "Beaucoup de nombres, de petits écarts, des deux côtés de zéro.", "D'abord le signe, puis les décimales. Le plus petit nombre en premier."),
      ],
      bruch: [
        L("Gouttes claires", "Toutes les fractions ont le même dénominateur.", "Le dénominateur est le même partout. Le plus petit numérateur est la plus petite fraction."),
        L("Fractions unitaires", "Le numérateur vaut toujours 1.", "Le numérateur vaut 1. Plus le dénominateur est grand, plus la fraction est petite. 1/2 est plus grand que 1/8."),
        L("Dénominateurs variés", "Numérateurs et dénominateurs changent.", "Les dénominateurs changent. Tu peux comparer en croix ou rendre les fractions de même dénominateur."),
        L("Au-delà de 1", "Fractions plus grandes que un et nombres mixtes.", "1 3/4, c'est comme 7/4. Transforme les nombres mixtes avant de les comparer."),
        L("Sous zéro", "Fractions négatives et zéro.", "−3/4 est plus petit que −1/4. Sous zéro, le plus petit nombre est plus à gauche."),
        L("Tout près", "Fractions très proches.", "Ces fractions sont très proches. Un même dénominateur aide à les comparer."),
        L("Récif couronne", "Signes, nombres mixtes et fractions serrées.", "D'abord le signe. Les fractions négatives passent avant toutes les positives."),
      ],
      misch: [
        L("Nacre", "Décimaux, fractions et nombres mixtes ensemble.", "D'abord le signe. Ensuite la même écriture : 1/2, c'est comme 0,5."),
      ],
    },
    es: {
      dezi: [
        L("Laguna poco profunda", "Números positivos con un decimal.", "Toca primero el número más pequeño y después el siguiente."),
        L("Bahía clara", "Hasta dos cifras después de la coma.", "Compara primero las unidades, luego las décimas y después las centésimas."),
        L("Vecinos cercanos", "Los números están muy juntos.", "Estos números están muy cerca. Compáralos cifra por cifra."),
        L("Agua espejo", "Ahora entran los números negativos.", "Los números negativos son menores que cero. −5 es menor que −1."),
        L("Arrecife profundo", "Números negativos con dos decimales.", "Entre dos números negativos, el más alejado de cero es el menor. −2,4 es menor que −1,8."),
        L("Remolino de perlas", "Muy juntos, también bajo cero.", "Fíjate bien: −0,8 es menor que −0,15, porque −0,8 está más a la izquierda."),
        L("Mareas", "Muchos números, poca distancia, a ambos lados del cero.", "Primero el signo, luego los decimales. El número más pequeño va primero."),
      ],
      bruch: [
        L("Gotas claras", "Todas las fracciones tienen el mismo denominador.", "El denominador es el mismo en todas. El numerador más pequeño es la fracción más pequeña."),
        L("Fracciones unitarias", "El numerador siempre es 1.", "El numerador es 1. Cuanto mayor es el denominador, más pequeña es la fracción. 1/2 es mayor que 1/8."),
        L("Denominadores distintos", "Cambian numeradores y denominadores.", "Los denominadores cambian. Puedes comparar en cruz o igualar los denominadores."),
        L("Más de uno", "Fracciones impropias y números mixtos.", "1 3/4 es lo mismo que 7/4. Convierte los números mixtos antes de compararlos."),
        L("Bajo cero", "Fracciones negativas y el cero.", "−3/4 es menor que −1/4. Bajo cero, el número menor está más a la izquierda."),
        L("Muy juntas", "Fracciones con poca distancia.", "Estas fracciones están muy juntas. Igualar el denominador ayuda a compararlas."),
        L("Arrecife corona", "Signos, números mixtos y fracciones cercanas.", "Primero el signo. Las fracciones negativas van antes que todas las positivas."),
      ],
      misch: [
        L("Nácar", "Decimales, fracciones y números mixtos juntos.", "Primero el signo. Después la misma escritura: 1/2 es lo mismo que 0,5."),
      ],
    },
  };

  const TEXT = {
    de: {
      appTitle: "Zauberhafte Zahlenordnung",
      meta: "Zauberhafte Zahlenordnung. Rationale Zahlen von klein nach groß verbinden. Dezimalzahlen und Brüche, Klasse 6.",
      eyebrow: "Rationale Zahlen · Klasse 6",
      lead: "Verbinde die Zahlen von der kleinsten zur größten.",
      cardDeziLead: "Zahlen mit Komma, bis zu zwei Stellen, auch unter null.",
      cardBruchLead: "Echte Brüche, gemischte Zahlen und negative Brüche.",
      cardMischLead: "Dezimalzahlen, Brüche und gemischte Zahlen in einer Runde.",
      kickerMode: "Modus",
      kickerFinale: "Abschluss",
      how: "Tippe die Blasen der Reihe nach an. Eine Leuchtkette verbindet sie, und die Zahlen setzen sich auf den Zahlenstrahl.",
      reset: "Fortschritt löschen",
      resetConfirm: "Wirklich löschen?",
      backHome: "Start",
      fine: "Jeder Fehler und jede Hilfe kostet einen Stern. Drei Sterne gibt es ohne Fehler und ohne Hilfe.",
      backLevels: "Level",
      rule: "Merksatz",
      hint: "Hilfe",
      hintTitle: "Hebt die nächste Blase hervor. Kostet einen Stern.",
      hintNext: "Die leuchtende Blase ist die nächste.",
      seqLabel: "Von klein nach groß",
      replay: "Nochmal",
      next: "Nächstes Level",
      toList: "Zur Übersicht",
      choose: "Wähle ein Level",
      nline: "Zahlenstrahl",
      already: "Die Blase ist schon in der Kette.",
      wrongNeg: "Es ist noch eine Zahl unter null frei. Die ist kleiner als jede positive Zahl.",
      wrongBoth: "Beide sind negativ. Die Zahl weiter links ist kleiner. −4 ist kleiner als −1.",
      wrongUnit: "Bei Stammbrüchen ist der größere Nenner der kleinere Bruch.",
      wrongSame: "Gleicher Nenner: Der kleinere Zähler ist der kleinere Bruch.",
      wrongForm: "Wandle in dieselbe Schreibweise um. 1/2 ist dasselbe wie 0,5.",
      wrongClose: "Knapp daneben. Vergleiche noch einmal Stelle für Stelle.",
      wrongBig: "Noch nicht. Diese Zahl ist größer. Suche die kleinste freie Zahl.",
      done3: "Wunderschön sortiert",
      done2: "Gut gelöst",
      done1: "Geschafft",
      noteNew: "Neue Bestleistung.",
      noteHeld: "Bestleistung gehalten.",
      langLabel: "Sprache",
      soundOn: "Ton an",
      soundOff: "Ton aus",
    },
    en: {
      appTitle: "Enchanted Number Order",
      meta: "Enchanted Number Order. Connect rational numbers from smallest to largest. Decimals and fractions, grade 6.",
      eyebrow: "Rational numbers · Grade 6",
      lead: "Connect the numbers from smallest to largest.",
      cardDeziLead: "Numbers with a decimal point, up to two places, including below zero.",
      cardBruchLead: "Proper fractions, mixed numbers, and negative fractions.",
      cardMischLead: "Decimals, fractions, and mixed numbers in one round.",
      kickerMode: "Mode",
      kickerFinale: "Finale",
      how: "Tap the bubbles in order. A glowing chain links them, and the numbers settle on the number line.",
      reset: "Clear progress",
      resetConfirm: "Really clear?",
      backHome: "Home",
      fine: "Each mistake and each hint costs one star. Three stars means no mistakes and no hints.",
      backLevels: "Levels",
      rule: "Rule",
      hint: "Hint",
      hintTitle: "Highlights the next bubble. Costs one star.",
      hintNext: "The glowing bubble is the next one.",
      seqLabel: "From small to large",
      replay: "Again",
      next: "Next level",
      toList: "Back to list",
      choose: "Choose a level",
      nline: "Number line",
      already: "That bubble is already in the chain.",
      wrongNeg: "A number below zero is still free. It is smaller than every positive number.",
      wrongBoth: "Both are negative. The number farther left is smaller. −4 is less than −1.",
      wrongUnit: "For unit fractions, the larger denominator is the smaller fraction.",
      wrongSame: "Same denominator: the smaller numerator is the smaller fraction.",
      wrongForm: "Rewrite them in the same notation. 1/2 is the same as 0.5.",
      wrongClose: "Very close. Compare them again, place by place.",
      wrongBig: "Not yet. This number is larger. Look for the smallest number still free.",
      done3: "Beautifully sorted",
      done2: "Well solved",
      done1: "Done",
      noteNew: "New best.",
      noteHeld: "Best score kept.",
      langLabel: "Language",
      soundOn: "Sound on",
      soundOff: "Sound off",
    },
    fr: {
      appTitle: "L'ordre enchanté des nombres",
      meta: "L'ordre enchanté des nombres. Relie des nombres rationnels du plus petit au plus grand. Décimaux et fractions, 6e.",
      eyebrow: "Nombres rationnels · 6e",
      lead: "Relie les nombres du plus petit au plus grand.",
      cardDeziLead: "Nombres à virgule, jusqu'à deux décimales, aussi sous zéro.",
      cardBruchLead: "Fractions propres, nombres mixtes et fractions négatives.",
      cardMischLead: "Décimaux, fractions et nombres mixtes dans une même manche.",
      kickerMode: "Mode",
      kickerFinale: "Final",
      how: "Touche les bulles dans l'ordre. Une chaîne lumineuse les relie, et les nombres se posent sur la droite graduée.",
      reset: "Effacer la progression",
      resetConfirm: "Vraiment effacer ?",
      backHome: "Accueil",
      fine: "Chaque erreur et chaque aide coûtent une étoile. Trois étoiles, c'est sans erreur et sans aide.",
      backLevels: "Niveaux",
      rule: "Mémo",
      hint: "Aide",
      hintTitle: "Montre la bulle suivante. Coûte une étoile.",
      hintNext: "La bulle qui brille est la suivante.",
      seqLabel: "Du plus petit au plus grand",
      replay: "Encore",
      next: "Niveau suivant",
      toList: "Vers la liste",
      choose: "Choisis un niveau",
      nline: "Droite graduée",
      already: "Cette bulle est déjà dans la chaîne.",
      wrongNeg: "Il reste un nombre sous zéro. Il est plus petit que chaque nombre positif.",
      wrongBoth: "Les deux sont négatifs. Le nombre le plus à gauche est le plus petit. −4 est plus petit que −1.",
      wrongUnit: "Pour les fractions unitaires, le plus grand dénominateur est la plus petite fraction.",
      wrongSame: "Même dénominateur : le plus petit numérateur est la plus petite fraction.",
      wrongForm: "Écris-les de la même façon. 1/2, c'est comme 0,5.",
      wrongClose: "Tout près. Compare encore, chiffre par chiffre.",
      wrongBig: "Pas encore. Ce nombre est plus grand. Cherche le plus petit nombre encore libre.",
      done3: "Magnifiquement rangé",
      done2: "Bien résolu",
      done1: "Réussi",
      noteNew: "Nouveau record.",
      noteHeld: "Record conservé.",
      langLabel: "Langue",
      soundOn: "Son activé",
      soundOff: "Son coupé",
    },
    es: {
      appTitle: "El orden encantado de los números",
      meta: "El orden encantado de los números. Une números racionales de menor a mayor. Decimales y fracciones, 6.º.",
      eyebrow: "Números racionales · 6.º",
      lead: "Une los números del menor al mayor.",
      cardDeziLead: "Números con coma, hasta dos decimales, también bajo cero.",
      cardBruchLead: "Fracciones propias, números mixtos y fracciones negativas.",
      cardMischLead: "Decimales, fracciones y números mixtos en una misma ronda.",
      kickerMode: "Modo",
      kickerFinale: "Final",
      how: "Toca las burbujas en orden. Una cadena luminosa las une, y los números se colocan en la recta numérica.",
      reset: "Borrar el progreso",
      resetConfirm: "¿De verdad borrar?",
      backHome: "Inicio",
      fine: "Cada error y cada ayuda cuestan una estrella. Tres estrellas significa sin errores y sin ayudas.",
      backLevels: "Niveles",
      rule: "Regla",
      hint: "Ayuda",
      hintTitle: "Resalta la burbuja siguiente. Cuesta una estrella.",
      hintNext: "La burbuja que brilla es la siguiente.",
      seqLabel: "De menor a mayor",
      replay: "Otra vez",
      next: "Siguiente nivel",
      toList: "A la lista",
      choose: "Elige un nivel",
      nline: "Recta numérica",
      already: "Esa burbuja ya está en la cadena.",
      wrongNeg: "Todavía queda un número bajo cero. Es menor que cualquier número positivo.",
      wrongBoth: "Los dos son negativos. El número más a la izquierda es el menor. −4 es menor que −1.",
      wrongUnit: "En las fracciones unitarias, el denominador mayor es la fracción menor.",
      wrongSame: "Mismo denominador: el numerador más pequeño es la fracción más pequeña.",
      wrongForm: "Escríbelos de la misma forma. 1/2 es lo mismo que 0,5.",
      wrongClose: "Muy cerca. Compáralos otra vez, cifra por cifra.",
      wrongBig: "Todavía no. Este número es mayor. Busca el menor que aún está libre.",
      done3: "Preciosamente ordenado",
      done2: "Bien resuelto",
      done1: "Conseguido",
      noteNew: "Nueva mejor marca.",
      noteHeld: "Mejor marca conservada.",
      langLabel: "Idioma",
      soundOn: "Sonido sí",
      soundOff: "Sonido no",
    },
  };

  function t(key) {
    if (key === "cardDeziTitle") return mode("dezi").title;
    if (key === "cardBruchTitle") return mode("bruch").title;
    if (key === "cardMischTitle") return level("misch", 0).name;
    const pack = TEXT[lang] || TEXT.de;
    if (pack[key] != null) return pack[key];
    return TEXT.de[key] != null ? TEXT.de[key] : key;
  }

  function mode(id) {
    const pack = MODES[lang] || MODES.de;
    return pack[id] || MODES.de[id] || null;
  }

  function level(modeId, index) {
    const pack = LEVELS[lang] || LEVELS.de;
    const rows = pack[modeId] || LEVELS.de[modeId];
    return rows && rows[index] ? rows[index] : null;
  }

  function decimalSep() {
    return lang === "en" ? "." : ",";
  }

  function summary(done, levels, stars) {
    const max = levels * 3;
    if (lang === "en") {
      return done + " of " + levels + (levels === 1 ? " level" : " levels")
        + " · " + stars + " of " + max + (max === 1 ? " star" : " stars");
    }
    if (lang === "fr") {
      return done + (done === 1 ? " niveau" : " niveaux") + " sur " + levels
        + " · " + stars + (stars === 1 ? " étoile" : " étoiles") + " sur " + max;
    }
    if (lang === "es") {
      return done + " de " + levels + (levels === 1 ? " nivel" : " niveles")
        + " · " + stars + " de " + max + (stars === 1 ? " estrella" : " estrellas");
    }
    return done + " von " + levels + (levels === 1 ? " Level" : " Leveln")
      + " · " + stars + " von " + max + " Sternen";
  }

  function stars(n) {
    if (lang === "en") return n + " of 3 stars";
    if (lang === "fr") return n + (n === 1 ? " étoile sur 3" : " étoiles sur 3");
    if (lang === "es") return n + " de 3 estrellas";
    return n + " von 3 Sternen";
  }

  function starsLeft(n) {
    if (lang === "en") return n + " of 3 stars still possible";
    if (lang === "fr") return n === 1 ? "1 étoile sur 3 encore possible" : n + " étoiles sur 3 encore possibles";
    if (lang === "es") return n === 1 ? "1 de 3 estrellas aún posible" : n + " de 3 estrellas aún posibles";
    return n + " von 3 Sternen noch möglich";
  }

  function lockedBlurb(blurb) {
    const suffix = lang === "en" ? " · not yet" : lang === "fr" ? " · pas encore" : lang === "es" ? " · aún no" : " · noch zu";
    return blurb + suffix;
  }

  function lockedMeta(a, b) {
    if (lang === "en") return "Still to do: finish " + a + " and " + b;
    if (lang === "fr") return "Encore à faire : terminer " + a + " et " + b;
    if (lang === "es") return "Aún falta: termina " + a + " y " + b;
    return "Noch zu: " + a + " und " + b + " abschließen";
  }

  function goal(step, total) {
    const rows = {
      de: ["Suche die kleinste Zahl.", "Suche die nächstgrößere Zahl.", "Jetzt die größte der übrigen Zahlen."],
      en: ["Find the smallest number.", "Find the next larger number.", "Now the largest of the numbers left."],
      fr: ["Cherche le plus petit nombre.", "Cherche le nombre juste au-dessus.", "Maintenant le plus grand des nombres restants."],
      es: ["Busca el número más pequeño.", "Busca el número siguiente.", "Ahora el mayor de los que quedan."],
    };
    const row = rows[lang] || rows.de;
    if (step <= 0) return row[0];
    if (step >= total - 1) return row[2];
    return row[1];
  }

  function progress(title, next, total) {
    if (lang === "en") return title + " · " + next + " of " + total;
    if (lang === "fr") return title + " · " + next + " sur " + total;
    if (lang === "es") return title + " · " + next + " de " + total;
    return title + " · " + next + " von " + total;
  }

  function rank(aria, n) {
    if (lang === "en") return aria + ", place " + n;
    if (lang === "fr") return aria + ", rang " + n;
    if (lang === "es") return aria + ", puesto " + n;
    return aria + ", Stelle " + n;
  }

  function doneTitle(earned) {
    if (earned === 3) return t("done3");
    if (earned === 2) return t("done2");
    return t("done1");
  }

  function order(list) {
    if (lang === "en") return "From smallest to largest: " + list;
    if (lang === "fr") return "Du plus petit au plus grand : " + list;
    if (lang === "es") return "De menor a mayor: " + list;
    return "Von klein nach groß: " + list;
  }

  function extraCapstone() {
    if (lang === "en") return " The final level is complete.";
    if (lang === "fr") return " Le niveau final est réussi.";
    if (lang === "es") return " El nivel final está conseguido.";
    return " Das Abschlusslevel ist geschafft.";
  }

  function extraMode() {
    if (lang === "en") return " Every level in this mode is complete.";
    if (lang === "fr") return " Tous les niveaux de ce mode sont réussis.";
    if (lang === "es") return " Todos los niveles de este modo están conseguidos.";
    return " Alle Level in diesem Modus sind geschafft.";
  }

  function extraOpen(name) {
    if (lang === "en") return " " + name + " is open now.";
    if (lang === "fr") return " " + name + " est maintenant ouvert.";
    if (lang === "es") return " " + name + " ya está abierto.";
    return " " + name + " ist jetzt offen.";
  }

  function note(earned, prev) {
    if (earned > prev) return t("noteNew");
    if (earned < prev) {
      if (lang === "en") return "Your best stays at " + prev + (prev === 1 ? " star." : " stars.");
      if (lang === "fr") return "Ton record reste à " + prev + (prev === 1 ? " étoile." : " étoiles.");
      if (lang === "es") return "Tu mejor marca sigue en " + prev + (prev === 1 ? " estrella." : " estrellas.");
      return "Deine Bestleistung bleibt bei " + prev + (prev === 1 ? " Stern." : " Sternen.");
    }
    if (prev > 0) return t("noteHeld");
    return "";
  }

  function statsLine(mistakes, hints, ms) {
    const parts = [countPhrase("mistake", mistakes)];
    if (hints > 0) parts.push(countPhrase("hint", hints));
    const seconds = Math.max(0, Math.round(ms / 1000));
    if (seconds < 60) parts.push(countPhrase("second", seconds));
    else parts.push(Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0"));
    return parts.join(" · ");
  }

  function countPhrase(kind, n) {
    const table = {
      mistake: {
        de: ["keine Fehler", "1 Fehler", n + " Fehler"],
        en: ["no mistakes", "1 mistake", n + " mistakes"],
        fr: ["aucune erreur", "1 erreur", n + " erreurs"],
        es: ["ningún error", "1 error", n + " errores"],
      },
      hint: {
        de: ["", "1 Hilfe", n + " Hilfen"],
        en: ["", "1 hint", n + " hints"],
        fr: ["", "1 aide", n + " aides"],
        es: ["", "1 ayuda", n + " ayudas"],
      },
      second: {
        de: ["0 Sekunden", "1 Sekunde", n + " Sekunden"],
        en: ["0 seconds", "1 second", n + " seconds"],
        fr: ["0 seconde", "1 seconde", n + " secondes"],
        es: ["0 segundos", "1 segundo", n + " segundos"],
      },
    };
    const row = table[kind][lang] || table[kind].de;
    if (n === 0) return row[0];
    if (n === 1) return row[1];
    return row[2];
  }

  function sound(on) {
    return on ? t("soundOn") : t("soundOff");
  }

  function formatCanon(canon) {
    const neg = canon.charAt(0) === "-";
    const body = neg ? canon.slice(1) : canon;
    return (neg ? "−" : "") + body.split(".").join(decimalSep());
  }

  function applyStatic() {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-deci]").forEach(function (el) {
      el.textContent = formatCanon(el.getAttribute("data-deci"));
    });
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t("meta"));
    const nav = document.getElementById("langs");
    if (nav) {
      nav.setAttribute("aria-label", t("langLabel"));
      nav.querySelectorAll("button").forEach(function (btn) {
        const on = btn.getAttribute("data-lang") === lang;
        btn.classList.toggle("on", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }
  }

  function setLang(next) {
    if (LANGS.indexOf(next) === -1) return;
    lang = next;
  }

  const api = {
    t: t,
    mode: mode,
    level: level,
    decimalSep: decimalSep,
    speech: function () { return SPEECH[lang] || SPEECH.de; },
    summary: summary,
    stars: stars,
    starsLeft: starsLeft,
    lockedBlurb: lockedBlurb,
    lockedMeta: lockedMeta,
    goal: goal,
    progress: progress,
    rank: rank,
    doneTitle: doneTitle,
    order: order,
    extraCapstone: extraCapstone,
    extraMode: extraMode,
    extraOpen: extraOpen,
    note: note,
    statsLine: statsLine,
    sound: sound,
    formatCanon: formatCanon,
    applyStatic: applyStatic,
    setLang: setLang,
    getLang: function () { return lang; },
    langs: LANGS,
  };

  root.SchimmerI18n = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
