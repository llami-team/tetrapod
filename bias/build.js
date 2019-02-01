import Bias from './bias'

let targetWord = '시발'
Bias.buildHelper(`kr-badwords`, targetWord, false)

// Bias.buildHelper(`kr-badwords`, process.argv[2], false)