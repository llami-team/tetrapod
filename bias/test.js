const Hangul = require('hangul-js')

function parse(input){
    let verticalVowelSample = [
        "ㅏ",
        "ㅑ",
        "ㅓ",
        "ㅕ",
        "ㅣ",
        "ㅖ",
        "ㅐ",
        "ㅒ",
        "ㅔ",
        "ㅖ"
    ]
    let chars = Hangul.disassemble(input, true)
    if(chars.length != 1) return null

    let parsed = {
        initialConsonant: '',
        verticalVowel: '',
        horizonVowel: '',
        finalConsonant: ''
    }
    console.log(input)
    console.log(chars)
    for(let char of chars[0]){
        if(parsed.initialConsonant.length == 0 && Hangul.isCho(char)){
            parsed.initialConsonant += char
        }
        else if(Hangul.isVowel(char)){
            let isVertical = verticalVowelSample.indexOf(char) !== -1
            if(isVertical){
                parsed.verticalVowel = char
            }else{
                parsed.horizonVowel = char
            }
        }
        else if (parsed.initialConsonant.length != 0 && Hangul.isJong(char)){
            parsed.finalConsonant += char
        }
    }
    if(parsed.finalConsonant.length != 0)
        parsed.finalConsonant = Hangul.assemble(parsed.finalConsonant)
    console.log(parsed)
}

parse('씨')
parse('꿲')
parse('꾸')
parse('께')
parse('꾺')
parse('ㄲ')
parse('ㅜ')
parse('괎')

//0 초성 choseong
//1 중성1 jungseong1
//2 중성2 jungseong2
//3 종성 jongseong