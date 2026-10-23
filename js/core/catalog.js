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
    { n: "Chillout Radio · Flux FM", s: "Chillout Radio", d: "Downtempo chill", u: "https://channels.fluxfm.de/chillout-radio/externalembedflxhp/stream.mp3" },
    { n: "Electronic Chillout · Flux FM", s: "Electronic Chillout", d: "Downtempo electronic", u: "https://channels.fluxfm.de/electronic-chillout/externalembedflxhp/stream.mp3" },
    { n: "Yoga Sounds · Flux FM", s: "Yoga Sounds", d: "Calm ambient", u: "https://channels.fluxfm.de/externalembedflxhp/yoga-sounds/stream.mp3" },
    { n: "Cosmic Jazz · Flux FM", s: "Cosmic Jazz", d: "Relaxed jazz", u: "https://streams.fluxfm.de/Cosmic/mp3-128/streams.fluxfm.de/" },
    { n: "Code Radio", s: "Code Radio", d: "Beats to focus", u: "https://coderadio-admin-v2.freecodecamp.org/listen/coderadio/radio.mp3" },
    { n: "Radio Paradise Mellow", s: "Paradise Mellow", d: "Soft mix", u: "https://stream.radioparadise.com/mellow-128" },
    { n: "Chillsynth · Nightride FM", s: "Chillsynth", d: "Chill synthwave", u: "https://stream.nightride.fm/chillsynth.mp3" }
  ]
};
})(window);
