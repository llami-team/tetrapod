const readline = require('readline')
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
                    isFinished = false
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
                        console.log('잘못된 입력입니다. Y 또는 N 을 입력해주세요.')
                        return
                }
            }

            // 초성만으로 존재가능한지
            if(charOption.onsetIndependent === null){
                if(answer === null){
                    console.log(`${char} 가 초성만 있어도 단어로 탐지될 수 있습니까? [Y/N]`)
                    /**
                     * @TODO
                     * 한글 자모를 Hangul.js 로 조각낸 뒤 초성만 확인
                     */
                    console.log(`예:`)
                    return
                }
            }
        }

        // 모든 구성이 완료된 경우
    }
}

process('')

rl.on('line', (input) => {
    process(input)
})