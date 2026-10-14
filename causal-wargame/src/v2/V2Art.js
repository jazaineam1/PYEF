import heroArt from './art/hero.webp'
import mission1 from './art/mission-1.webp'
import mission2 from './art/mission-2.webp'
import mission3 from './art/mission-3.webp'
import mission4 from './art/mission-4.webp'
import mission5 from './art/mission-5.webp'
import mission6 from './art/mission-6.webp'
import victoryArt from './art/victory.webp'

// Original authored illustrations pinned as local, cacheable assets.
// These are narrative game art; they do not contain causal evidence or model results.
export const V2_GAME_ART=Object.freeze({
  hero:heroArt,
  victory:victoryArt,
  missions:Object.freeze([null,mission1,mission2,mission3,mission4,mission5,mission6])
})
export const artForMission=round=>V2_GAME_ART.missions[Number(round)]||V2_GAME_ART.hero
export const missionArtAlt=round=>({
  1:'Agentes del campus eligiendo estudiantes desde fichas holográficas',
  2:'Arena de experimento con grupos A y B bajo iluminación azul y violeta',
  3:'Equipo explorando conexiones en un mapa causal holográfico',
  4:'Motor futurista que separa ruido predictivo y estimación causal',
  5:'Centro de mando que distribuye apoyo a distintas zonas del campus',
  6:'Arena final donde compiten distintos estimadores de efecto causal'
}[round]||'Escena ilustrada del campus futurista')
