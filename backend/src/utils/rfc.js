function limpiar(str) {
  return str
    .toUpperCase()
    .replace(/[ÁÉÍÓÚ]/g, (match) => {
      return { Á: "A", É: "E", Í: "I", Ó: "O", Ú: "U" }[match];
    })
    .replace(/Ñ/g, "X")
    .replace(/[^A-Z\s]/g, "")
    .trim();
}

function quitarArticulos(palabra) {
  return palabra.replace(/\b(DE(L)?|LA(S)?|LOS|Y|A|VON|VAN)\s+/gi, "");
}

function quitarNombreComun(palabra) {
  return palabra
    .replace(/\b(JOSE|J\.?|MARIA|MA\.?)\s+/gi, "")
    .replace(/\b(DE(L)?|LA(S)?|LOS|Y|A|VON|VAN)\s+/gi, "");
}

function esVocal(letra) {
  return "AEIOU".includes(letra);
}

function quitarPalabraMala(palabra) {
  const malas = [
    "BUEI","BUEY","CACA","CACO","CAGA","CAGO","CAKA","CAKO",
    "COGE","COJA","KOGE","KOJO","KAKA","KULO","MAME","MAMO",
    "MEAR","MEAS","MEON","MION","COJE","COJI","COJO","CULO",
    "FETO","GUEY","JOTO","KACA","KACO","KAGA","KAGO","MOCO",
    "MULA","PEDA","PEDO","PENE","PUTA","PUTO","QULO","RATA","RUIN"
  ];

  return malas.includes(palabra)
    ? palabra.substring(0, 3) + "X"
    : palabra;
}