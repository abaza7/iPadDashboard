/* Versioned, immutable-at-source media catalog shared by dashboard and extensions. */
(function(root){ "use strict";
root.DashboardCatalog = {
 reciters: [["Mishary Alafasy", "Alafasy_128kbps"], ["Abdul Basit (Murattal)", "Abdul_Basit_Murattal_192kbps"], ["Mahmoud Khalil Al-Husary", "Husary_128kbps"],
    ["Mohamed Al-Minshawi (Murattal)", "Minshawy_Murattal_128kbps"], ["Abdurrahman As-Sudais", "Abdurrahmaan_As-Sudais_192kbps"], ["Saud Ash-Shuraim", "Saood_ash-Shuraym_128kbps"],
    ["Maher Al-Muaiqly", "MaherAlMuaiqly128kbps"], ["Saad Al-Ghamdi", "Ghamadi_40kbps"], ["Ahmed Al-Ajamy", "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net"],
    // Streamed whole-surah recitations: [name, base URL, timings folder]. Verse timings live in timings/<folder>/NNN.json
    ["Islam Sobhi", "https://cdn.mp3quran.net/download/audio/islam-sobhi/r1/", "islam-sobhi"]],
 stations: [
    { n: "Chillhop · Flux FM", s: "Chillhop", d: "Lofi hip-hop beats", u: "https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/" },
    { n: "Groove Salad · SomaFM", s: "Groove Salad", d: "Downtempo chill", u: "https://ice5.somafm.com/groovesalad-128-mp3", alt: "https://ice6.somafm.com/groovesalad-128-mp3" },
    { n: "Fluid · SomaFM", s: "Fluid", d: "Instrumental hip-hop", u: "https://ice5.somafm.com/fluid-128-mp3", alt: "https://ice2.somafm.com/fluid-128-mp3" },
    { n: "Lush · SomaFM", s: "Lush", d: "Mellow vocals", u: "https://ice5.somafm.com/lush-128-mp3", alt: "https://ice6.somafm.com/lush-128-mp3" },
    { n: "Drone Zone · SomaFM", s: "Drone Zone", d: "Ambient, for sleep", u: "https://ice5.somafm.com/dronezone-128-mp3", alt: "https://ice2.somafm.com/dronezone-128-mp3" },
    { n: "Code Radio", s: "Code Radio", d: "Beats to focus", u: "https://coderadio-admin-v2.freecodecamp.org/listen/coderadio/radio.mp3" },
    { n: "Radio Paradise Mellow", s: "Paradise Mellow", d: "Soft mix", u: "https://stream.radioparadise.com/mellow-128" },
    { n: "Chillsynth · Nightride FM", s: "Chillsynth", d: "Chill synthwave", u: "https://stream.nightride.fm/chillsynth.mp3" }
  ]
};
})(window);
