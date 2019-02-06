import Hangul from 'hangul-js'
import Bias from './bias'
import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

class InputProcess{
    constructor(){
        // 수정하고자 하는 패키지명
        this.packageName = null

        // 지금 추가하고자 하는 단어명
        this.word = null

        // 글자별 옵션
        this.charsOption = {}
    }

    process(input){
        // 수정하고자 하는 패키지명
        if(this.packageName === null){
            if(input.length == 0){
                console.log(`패키지명을 입력해주세요. (예: kr-badwords)`)
                return
            }else{
                // TODO 폴더 존재여부 확인 
                // 없으면 폴더 별개 생성 요청

                this.packageName = input
                console.log(`패키지명이 입력되었습니다. (${this.packageName})`)
                input = ''
            }
        }

        // 지금 추가하고자 하는 단어
        if(this.word === null){
            if(input.length == 0){
                console.log(`추가하고자 하는 단어를 입력해주세요. (예: 바보)`)
                return
            }else{
                this.word = input.split('')
                console.log(`단어추가가 시작되었습니다. (${input})`)
                input = ''
            }
        }

        // 단어별 파싱 시작
        for(let char of this.word){

            // 단어 데이터가 구성 안 된 경우 초기화
            if(typeof this.charsOption[char] === 'undefined'){

                this.charsOption[char] = {

                    // 초성만으로 존재가능한지
                    onsetIndependent: null,

                    // 중성에서 수직모음이 들어갈 수 있는지
                    nucleusVerticality: null,

                    // 중성에서 수평모음이 들어갈 수 있는지
                    nucleusHorizontal: null,

                    // 중성에서 복합모음이 들어갈 수 있는지
                    nucleusComplex: null,

                    // 종성에서 받침이 없는 경우도 허용되는지
                    codaEmptyAllow: null,

                    // 종성에서 받침이 있는 경우도 허용되는지
                    codaExistAllow: null,

                    // 모든 구성진행이 완료되었는지ㅣ
                    isFinished: false
                }
            }

            // 단어 옵션
            let charOption = this.charsOption[char]

            // 단어 구성이 다 끝난 경우 다음글자로 넘어가기
            if(charOption.isFinished)
                continue

            // 아래서부터 옵션별 체크시작

            // 예 또는 아니요가 아닌 경우 다시입력 요구
            let answer = null
            let answerCheck = (onlyBoolean = true)=>{
                if(input.length !== 0){
                    switch(String(input).toLowerCase()){
                        case 'y':
                        case 'yes':
                        case '예':
                        case '네':
                            answer = true
                            break
                        case 'n':
                        case 'no':
                        case '아니요':
                        case '아뇨':
                            answer = false
                            break
                        default:
                            if(onlyBoolean){
                                console.log('잘못된 입력입니다. Y 또는 N 을 입력해주세요.')
                                return
                            }
                    }
                }
            }

            // 글자 파싱
            let parsed = Bias.hangulParse(char)

            // PROCESS 1
            // 초성만으로 탐지가 가능한지
            if(parsed.initialConsonant.length === 0){

                // 입력된 글자에 초성이 없을때
                // 초성만으로 탐지 여부는 false
                charOption.onsetIndependent = false
            }else{

                // 입력된 글자에 초성이 존재할때
                // 초성만으로 탐지가 가능한지
                if(charOption.onsetIndependent === null){
                    if(answer === null){
                        console.log(`글자 '${char}' 가 초성만 있어도 사람이 해당 단어를 인지 가능합니까? [Y/N]`)
                        console.log(`예: ${parsed.initialConsonant}`)
                        return
                    }else{
                        charOption.onsetIndependent = answer
                        answer = null
                    }
                }
            }

            // PROCESS 2
            // 중성에서 수직모음이 들어갈 수 있는지
            if(parsed.initialConsonant.length == 0 &&
                parsed.horizonVowel.length == 0){

                // 초성 또는 수평모음 둘 다 존재하지 않을때
                // 만능 수직모음 사용 여부는 false
                charOption.nucleusVerticality = false
            }else{

                // 초성 또는 수평모음 둘중하나라도 존재할 경우
                // 중성에서 수직모음이 들어갈 수 있는지
                if(charOption.nucleusVerticality === null){
                    if(answer === null){
                        console.log(`글자 '${char}' 의 중성에 수직모음이 들어갈 수 있습니까? [Y/N]`)

                        let exDef = []
                        if(parsed.initialConsonant.length != 0)
                            exDef.push(parsed.initialConsonant)
                        if(parsed.horizonVowel.length != 0)
                            exDef.push(parsed.horizonVowel)

                        let exDefAfter = []
                        if(parsed.finalConsonant.length != 0)
                            exDefAfter.push(parsed.finalConsonant)

                        let exA = Hangul.assemble([...exDef, 'ㅣ', ...exDefAfter])
                        let exB = Hangul.assemble([...exDef, 'ㅑ', ...exDefAfter])
                        let exC = Hangul.assemble([...exDef, 'ㅓ', ...exDefAfter])
                        let exD = Hangul.assemble([...exDef, 'ㅖ', ...exDefAfter])

                        console.log(`예: ${exA}, ${exB}, ${exC}, ${exD}... 등등`)
                        return
                    }else{
                        charOption.nucleusVerticality = answer
                        answer = null
                    }
                }
            }

            // PROCESS 3
            // 중성에서 수평모음이 들어갈 수 있는지
            if(parsed.initialConsonant.length == 0 &&
                parsed.verticalVowel.length == 0){

                // 초성 또는 수직모음 둘 다 존재하지 않을때
                // 만능 수평모음 사용 여부는 false
                charOption.nucleusHorizontal = false

            }else{

                // 초성 또는 수직모음 둘중하나라도 존재할 경우
                // 중성에서 수평모음이 들어갈 수 있는지
                if(charOption.nucleusHorizontal === null){
                    if(answer === null){
                        console.log(`글자 '${char}' 의 중성에 수평모음이 들어갈 수 있습니까? [Y/N]`)

                        let exDef = []
                        if(parsed.initialConsonant.length != 0)
                            exDef.push(parsed.initialConsonant)

                        let exDefAfter = []
                        if(parsed.finalConsonant.length != 0)
                            exDefAfter.push(parsed.finalConsonant)

                        let exHorizontalNucleus = [
                            "ㅗ",
                            "ㅛ",
                            "ㅜ",
                            "ㅠ",
                            "ㅡ"
                        ]

                        let exHorizontalNucleusStr = ''
                        for(let exHorizontalChar of exHorizontalNucleus){
                            let isFirst = (exHorizontalNucleusStr.length == 0) ? true : false
                            if(!isFirst) exHorizontalNucleusStr += ', '
                            exHorizontalNucleusStr += Hangul.assemble([...exDef, exHorizontalChar, ...exDefAfter])
                        }

                        /**
                         * @TODO
                         * 수평모음 전체예를 보여준 후,
                         * y 또는 n 을 입력하게 하거나,
                         * 필요한 수평모음 일부를 , 로 구분해서 입력하게 할 수 있도록
                         */

                        // 수평모음 전체를 보여주기
                        console.log(`전체 수평모음 목록의 적용결과 다음과 같습니다.`)
                        console.log(`만약 y를 입력하시면 아래의 모든 모음이 사용처리 됩니다.`)
                        console.log(`수평모음 적용 예: ${exHorizontalNucleusStr}... 등등\n`)

                        console.log(`그러나 위 모음 중 일부만 사용하고 싶은 경우,`)
                        console.log(`사용할 모음들만 모아서 아래처럼 입력해주세요.`)
                        console.log(`입력 예: ㅗ,ㅛ,ㅜ,ㅠ,ㅡ`)
                        return
                    }else{
                        charOption.nucleusHorizontal = answer
                        answer = null
                    }
                }
            }

            // PROCESS 4
            // 중성에서 복합모음이 들어갈 수 있는지
            if(parsed.initialConsonant.length === 0){

                // 입력된 글자에 초성이 없을때
                // 만능 복합모음 사용 여부는 false
                charOption.nucleusComplex = false
            }else{

                // 입력된 글자에 초성이 존재할때
                // 초성만으로 탐지가 가능한지
                if(charOption.nucleusComplex === null){
                    if(answer === null){
                        console.log(`글자 '${char}' 의 중성에 복합모음이 사용될 수 있습니까? [Y/N]`)

                        let exDef = []
                        if(parsed.initialConsonant.length != 0)
                            exDef.push(parsed.initialConsonant)

                        let exDefAfter = []
                        if(parsed.finalConsonant.length != 0)
                            exDefAfter.push(parsed.finalConsonant)

                        let exA = Hangul.assemble([...exDef, 'ㅡ', 'ㅣ', ...exDefAfter])
                        let exB = Hangul.assemble([...exDef, 'ㅗ', 'ㅐ', ...exDefAfter])
                        let exC = Hangul.assemble([...exDef, 'ㅜ', 'ㅔ', ...exDefAfter])
                        let exD = Hangul.assemble([...exDef, 'ㅜ', 'ㅣ', ...exDefAfter])

                        console.log(`예: ${exA}, ${exB}, ${exC}, ${exD}... 등등`)
                        return
                    }else{
                        charOption.nucleusComplex = answer
                        answer = null
                    }
                }
            }

            // PROCESS 5
            // 종성에서 받침이 없는 경우도 허용되는지
            if(parsed.initialConsonant.length === 0){

                // 입력된 글자에 초성이 없을때
                // 비어있는 받침표현 사용 여부는 false
                charOption.codaEmptyAllow = false
            }else{

                // 입력된 글자에 초성이 존재할때
                // 종성에서 받침이 없는 경우도 허용되는지
                if(charOption.codaEmptyAllow === null){
                    if(answer === null){
                        console.log(`글자 '${char}' 의 종성에 받침이 없는 경우도 사람이 해당 단어를 인지 가능합니까? [Y/N]`)

                        let exDef = []

                        if(parsed.initialConsonant.length != 0)
                            exDef.push(parsed.initialConsonant)

                        let exA = Hangul.assemble([...exDef, 'ㅡ', 'ㅣ'])
                        let exB = Hangul.assemble([...exDef, 'ㅗ', 'ㅐ'])
                        let exC = Hangul.assemble([...exDef, 'ㅜ', 'ㅔ'])
                        let exD = Hangul.assemble([...exDef, 'ㅜ', 'ㅣ'])

                        console.log(`예: ${exA}, ${exB}, ${exC}, ${exD}... 등등`)
                        return
                    }else{
                        charOption.codaEmptyAllow = answer
                        answer = null
                    }
                }
            }

            // PROCESS 6
            // 종성에서 받침이 있는 경우도 허용되는지
            if(parsed.initialConsonant.length === 0){

                // 입력된 글자에 초성이 없을때
                // 비어있는 받침표현 사용 여부는 false
                charOption.codaExistAllow = false
            }else{

                // 입력된 글자에 초성이 존재할때
                // 종성에서 받침이 있는 경우도 허용되는지
                if(charOption.codaExistAllow === null){
                    if(answer === null){
                        console.log(`글자 '${char}' 의 종성에 받침이 있는 경우도 단어로 사람이 해당 단어를 인지 가능합니까? [Y/N]`)

                        let exDef = []

                        if(parsed.initialConsonant.length != 0)
                            exDef.push(parsed.initialConsonant)

                        let exA = Hangul.assemble([...exDef, 'ㅡ', 'ㅣ', 'ㄱ'])
                        let exB = Hangul.assemble([...exDef, 'ㅗ', 'ㅐ', 'ㅋ'])
                        let exC = Hangul.assemble([...exDef, 'ㅜ', 'ㅔ', 'ㄹ'])
                        let exD = Hangul.assemble([...exDef, 'ㅜ', 'ㅣ', 'ㅂ'])

                        console.log(`예: ${exA}, ${exB}, ${exC}, ${exD}... 등등`)
                        return
                    }else{
                        charOption.codaExistAllow = answer
                        charOption.isFinished = true
                        answer = null
                    }
                }
            }
        }

        // 모든 구성이 완료된 경우
        console.log('모든 구성 완료')
        console.log(charsOption)
        
        /**
         * @TODO
         * 실제 JSON 옵션 구성 후 저장
         */
    }
}

var inputProcess =  new InputProcess()
inputProcess.process('')

rl.on('line', (input) => {
    inputProcess.process(input)
})