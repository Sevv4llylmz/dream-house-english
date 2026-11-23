// Lists every spoken line (teacher / alya / turkish) so tools/gen_voices.py can pre-record them.
import { writeFileSync } from 'node:fs'
import { allLines, A } from '../src/content/lines'
import { meanRounds } from '../src/content/talk'
import '../src/content/meta'
import '../src/content/garden'
import '../src/content/school'
import '../src/content/toys'
import { PRON } from '../src/content/house'
import { passRound } from '../src/content/volley'
import { ALL_WORDS } from '../src/content/vocab'
import '../src/content/ui'

meanRounds()
ALL_WORDS.forEach(passRound)
Object.keys(PRON).forEach((p) => A(p))
writeFileSync('tools/voice-lines.json', JSON.stringify(allLines(), null, 1))
console.log(allLines().length, 'lines')
