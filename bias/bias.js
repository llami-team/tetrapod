import Hangul from 'hangul-js'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

/**
 * @author hmmhmmhm <hmmhmmhm@naver.com>
 * 
 * source.json 을 기반으로
 * build.json 에 비속어 사전을 생성합니다.
 * 
 * source.json 는 var와 code로 나뉘며
 * 
 * var 에는 반복적으로 쓰일 수 있는 음절을
 * 아예 따로 함수형태로 정의해놓을 수 있으며
 * 
 * code 에서 사전에 정의된 음절 함수를
 * <*함수명> 과 같이 표시함으로 엮을 수 있습니다.
 * 
 */

/**
 * @todo
 * 
 * [v] 중첩 연결적 데이터 포멧
 * 
 * [v] 음절 변수 개념
 * [v] 응용 함수 개념
 * [v] 자모합성 함수 개념
 * 
 * [v] 분할된 사전 데이터 파일 체계
 * [v] 특정 단어만 테스트하는 명령어 개념
 * [v] 결과배제 함수 개념
 * 
 * [ ] 음절단위 최소화 표현 필터 개념 (UniqueFilter)
 * [ ] 이전 비속 단어 사전 데이터 해석
 * [ ] 이전 정상 단어 사전 데이터 해석
 */

/**
 * @description
 * 
 * bias 는 정밀한 비속어 단어사전을
 * 구성하기 위해서 구성된 데이터 포멧으로
 * 
 * 각 비속어의 음절별 변형되어 표기되는
 * 글자 발음을 최대한 표기합니다.
 */
export default class Bias {
    /**
     * 비속어는 음절별로 발음이 약간씩
     * 달라질 수 있기 때문에 각 음절별로
     * 모든 조합의 구성이 필요합니다.
     * 
     * 그러나 이를 직접 적으면 데이터 용량이 늘뿐더러
     * 편집자도 힘드므로 각 음절별 변형음을 2차원구조로 표현합니다.
     * 
     * 
     * 이 함수는 필터에 사용될 비속어를 2차원 배열 형태로
     * 조합될 단어의 목록을 구성할 수 있게 돕습니다.
     * 
     * 2차원 배열은 before+after 의 구조로
     * 각 차원 데이터가 합쳐져서 단어를 구성하게 되며
     * 
     * 2차원 배열 내 다시 2차원 배열을 둘 수 있습니다.
     * 
     * @param {array} data 
     */
    static recursiveComponent (data, variable, nonParsedVariable = null) {
        console.log('recursiveComponent() start')

        // 데이터의 전항 후항을 순회합니다.
        for(let i=0;i<=1;i++){
    
            // 데이터의 모든 항목을 순회합니다.
            for(let itemIndex in data[i]){
                let item = data[i][itemIndex]
    
                // 데이터 항목이 배열인 경우
                // 재귀 컴포넌트 해석을 진행합니다.
                if(Array.isArray(item)){
                    let solvedData = Bias.recursiveComponent(item, variable, nonParsedVariable)
                    data[i][itemIndex] = null
                    data[i] = data[i].concat(solvedData)

                } else if(!Array.isArray(item) && typeof item === 'object'){

                    // 부가 함수를 사용한 경우
                    // 지정된 함수가 반환하는 리스트를 반영합니다.
                    data[i] = data[i].concat(Bias.recursiveComponent(item, variable, nonParsedVariable))

                } else if(typeof item === 'string' && item[0] === '*'){

                    // 만약 변수를 사용했다면 해당 부분을
                    // 변수의 리스트로 대치합니다.
                    let varName = item.split('')
                    varName.shift()
                    varName = varName.join('')
                    console.log(`함수호출됨: ${varName}`)

                    if(typeof variable[varName] !== 'undefined'){
                        console.log(`1함수호출됨: ${varName}`)

                        data[i] = data[i].concat(variable[varName])
                    }else{
                        console.log(`2함수호출됨: ${varName}`)
                        // 만약 변수 안에서 변수를 참조한 경우
                        // 필요한 부분의 변수만 파싱하여 해당 리스트를 구성합니다.
                        if(nonParsedVariable !== null){
                            console.log(`2함수진행됨: ${varName}`)
                            let parsedHeaderVariable = Bias.recursiveList(nonParsedVariable[varName], nonParsedVariable, true)
                            data[i] = data[i].concat(parsedHeaderVariable)
                            console.log(`2함수결과:`)
                            console.log(parsedHeaderVariable.length)
                            if(parsedHeaderVariable.length == 0)
                                throw new Error (`${varName} 변수를 찾을 수 없습니다. 또는 변수 내부 길이가 0입니다.`)
                        }else{
                            throw new Error (`nonParsedVariable 전해받지 못함, ${varName} 변수를 찾을 수 없습니다.`)
                        }
                    }
                    data[i][itemIndex] = null
                }
            }
        }

        // 데이터의 전항 후항을 순회합니다.
        let solvedData = []
        for(let before of data[0]){
            if(before === null) continue
            for(let after of data[1]){
                if(after === null) continue
                solvedData.push(before+after)
            }
        }
        console.log('recursiveComponent() end')
        return solvedData
    }

    /**
     * 이 함수로 배열을 감싸면 비속어 단어 정의용
     * 데이터 표현 포멧을 바로 쓸 수 있게 해줍니다.
     * 
     * @param {array} list 
     * @param {object} variable 
     * @param {boolean} isVariableParse 
     * @param {string} defaultType 
     * 
     * @returns {array} solvedList
     */
    static recursiveList (list, variable = null, isVariableParse = false, defaultType = 'string') {
        console.log('recursiveList() start')

        // 변수단을 해석처리합니다.
        let parsedVaraible = {}
        if(variable !== null && !isVariableParse){
            for(let varItemIndex in variable)
                parsedVaraible[varItemIndex] = Bias.recursiveList(variable[varItemIndex], variable, true)
        }

        // 코드단을 해석처리합니다.
        let rebuild = []
        for(let itemIndex in list){
            let item = list[itemIndex]

            if(typeof item === defaultType){

                // 그냥 문자열이면 바로 리스트에 반영합니다.
                if(item[0] !== '*'){
                    rebuild.push(item)
                }else{

                    // 만약 변수를 사용했다면 해당 부분을
                    // 변수의 리스트를 반영합니다.
                    let varName = item.split('')
                    varName.shift()
                    varName = varName.join('')
                    if(typeof parsedVaraible[varName] !== 'undefined' && !isVariableParse){
                        rebuild = rebuild.concat(parsedVaraible[varName])
                    }else{
                        if(isVariableParse){

                            // 정의된 변수가 없는데 변수가 들어갔으면
                            // 해당 변수만 별개로 해석하여 리스트에 첨부합니다.
                            let parsedHeaderVariable = Bias.recursiveList(variable[varName], variable, true)
                            rebuild = rebuild.concat(parsedHeaderVariable)
                        }else{
                            throw new Error(`${varName} 음절 변수를 찾을 수 없습니다.`)
                        }
                    }
                }

            }else if(Array.isArray(item) && typeof item === 'object'){

                // 데이터 항목이 배열인 경우
                // 재귀 컴포넌트 해석을 진행합니다.
                rebuild = rebuild.concat(Bias.recursiveComponent(item, parsedVaraible, variable))
            }else{

                // 부가 함수를 사용한 경우
                // 지정된 함수가 반환하는 리스트를 반영합니다.
                rebuild = rebuild.concat(Bias.additionalType(item, parsedVaraible, variable))
            }
        }
        console.log('recursiveList() end')
        return rebuild
    }

    /**
     * 재귀를 통해 특정 폴더 경로내 존재하는
     * 모든 파일을 찾아내서 목록을 만든 후 이를 콜백에 넘겨줍니다.
     * 
     * @param {string} staticPath 
     * @param {function} callback 
     */
    static recursiveFileSearch(staticPath, callback){
        let foundedDatas = []
        let foundedFolders = []

        // 주어진 폴더를 검색 대상에 추가합니다.
        foundedFolders.push({
            subPath: '/',
            staticPath
        })

        // 파일 탐색을 시작합니다.
        let search = (opt, searchCallback)=>{

            // 파일 검색이 끝나면 다음 폴더를 검색합니다.
            if(opt.files === null || (opt.files.length) == opt.fileIndex){

                // 검색할 폴더가 추가로 없으면
                // 검색을 최종 마무리합니다.
                if(foundedFolders.length == 0){
                    searchCallback(foundedDatas)
                    return
                }

                // 다음 폴더 정보를 가져옵니다.
                let query = foundedFolders.shift()

                opt.files = fs.readdirSync(query.staticPath)
                opt.paths = query
                opt.fileIndex = 0
            }

            let fileName = opt.files[opt.fileIndex]

            // 파일정보를 읽어옵니다.
            fs.stat(opt.paths.staticPath + '/' + fileName, (error, stats)=>{

                if(stats.isDirectory()){

                    // 찾은게 폴더면 검색해야할 폴더 목록에 추가합니다.
                    foundedFolders.push({
                        subPath: opt.paths.subPath + fileName + '/', 
                        staticPath: opt.paths.staticPath+ '/' + fileName
                    })
                }else{

                    // 찾은게 파일이면 찾은 데이터 목록에 추가합니다.
                    foundedDatas.push({
                        subPath: opt.paths.subPath, 
                        staticPath: opt.paths.staticPath, 
                        fileName
                    })
                }

                // 다음검색을 진행합니다.
                ++ opt.fileIndex
                search(opt, searchCallback)
            })
        }

        search({
            files: null,
            paths: null,
            fileIndex: 0
        }, callback)
    }

    /**
     * 데이터를 가지고 있다가
     * 해당 데이터가 빌드될 때 어떻게 처리할지를
     * 함수를 통해 정의할 수 있습니다.
     * 
     * 이 메소드 내 함수명을 정의함을 통해서
     * 빌드 과정에서 데이터에 간섭할 수 있습니다.
     * 
     * @param {object} component
     * @param {object} parsedVaraible
     * @param {object} nonParsedVariable
     */
    static additionalType(component, parsedVaraible, nonParsedVariable = null){
        console.log('additionalType() start')
        let list = []
        //let defaultList = Bias.recursiveComponent(component.data, parsedVaraible, nonParsedVariable)

        switch(component.type){
            case '단어병합':
                list = Bias.recursiveComponent(component.data, parsedVaraible, nonParsedVariable)
                break
            case '자모합성':
                for(let item of Bias.recursiveComponent(component.data, parsedVaraible, nonParsedVariable)){
                    item = item.split('')
                    console.log(item)
                    list.push(Hangul.assemble(item))
                }
                break
        }

        /* 아래부터는 공통기능을 구현합니다. */

        // 생성된 리스트 중 일부 단어 배제 기능
        if(typeof component['exclude'] !== 'undefined'){
            let preList = []
            for(let item of list){
                if(component['exclude'].indexOf(item) === -1)
                    preList.push(item)
            }
            list = preList
        }

        console.log('additionalType() end')
        return list
    }

    /**
     * 비속어 사전을 하나의 JSON파일로 변환합니다.
     * 
     * @param {object} buildOption
     * @param {function} buildCallback
     */
    static build(buildOption, buildCallback){
        Bias.recursiveFileSearch(buildOption.sourcePath, (files)=>{

            // 수집된 데이터가 여기에 담깁니다.
            let collectData = {
                "var" : {},
                "code": []
            }

            // 폴더 내 파일들을 순회합니다.
            for(let file of files){

                // json 파일이 아니면 이를 넘깁니다.
                let checkExt = file.fileName.split('.')
                if(checkExt[1] != 'json' || checkExt.length != 2) continue
        
                // 파일데이터를 읽어옵니다.
                let filePath = path.resolve(`${file.staticPath}/${file.fileName}`)
                let fileData = JSON.parse(String(fs.readFileSync(filePath)))
        
                // 수집한 데이터를 하나의 객체에 합칩니다.
                for(let topIndex of Object.keys(fileData)){

                    // 배열과 객체의 병합과정을 서로 달리합니다.
                    if(Array.isArray(collectData[topIndex])){

                        if(typeof collectData[topIndex] === 'undefined')
                            collectData[topIndex] = []

                        // 만약 테스트할 단어가 지정되있는 경우
                        // 해당 테스트 단어 만을 참조 진행합니다.
                        if(topIndex === "code" && buildOption.testWord !== undefined)
                            if(checkExt[0] != buildOption.testWord)
                                continue

                        collectData[topIndex] = collectData[topIndex].concat(fileData[topIndex])
                    }else{

                        if(typeof collectData[topIndex] === 'undefined')
                            collectData[topIndex] = {}

                        for(let itemIndex of Object.keys(fileData[topIndex])){

                            // 객체 내 동일한 데이터 키를 쓰려는
                            // 서로다른 데이터가 발생한 경우 이를 오류로 간주합니다.
                            if(typeof collectData[topIndex][itemIndex] !== 'undefined')
                                throw new Error(`중첩된 데이터 지정발생: ${itemIndex}(${filePath})`)
                            collectData[topIndex][itemIndex] = fileData[topIndex][itemIndex]
                        }
                    }
                }
            }

            console.log(`수집된 변수목록:`)
            console.log(Object.keys(collectData.var))
            let code = Bias.recursiveList(collectData.code, collectData.var)
            console.log('after process start')

            // 비속어의 음절을 겹치는 경우가 없도록
            // 겹치는 음절은 가장 작은 음절만을 저장합니다.
            if(buildOption.applyUniqueFilter){
                let preTimerKey = `${chalk.magenta(`<unq-filter>`)} 필터링 소요된 시간:`
                console.time(preTimerKey)

                // 사전을 작은 글자 순서대로 정렬합니다.
                code = code.sort((a, b)=>{
                    return a.length - b.length || // sort by length, if equal then
                        a.localeCompare(b);    // sort by dictionary order
                })

                let uniquedCode = []
                let evadeCodeIndexes = []

                // 검사를 위해 한 단어씩을 순회합니다.
                for(let checkWordIndex in code){
                    console.log(`code process start ${checkWordIndex}/${code.length - evadeCodeIndexes.length}`)
                    let checkWord = code[checkWordIndex]

                    // 배제 대상에 속하면 진행하지 않습니다.
                    if(evadeCodeIndexes.indexOf(checkWordIndex) !== -1) continue

                    // 확인할 단어도 하나씩 순회합니다
                    for(let targetWordIndex in code){
                        let targetWord = code[targetWordIndex]

                        // 배제 대상에 속하면 진행하지 않습니다.
                        if(evadeCodeIndexes.indexOf(targetWordIndex) !== -1){
                            continue
                        }

                        // 길이가 완전히 일치하는 경우는 배제합니다.
                        if(checkWord.length == targetWord.length){
                            continue
                        }

                        // 일치하는 단어를 저장합니다.
                        let matchedCount = []
                        
                        // 대조할 단어를 한글자씩 순회합니다.
                        for(let checkWordCharIndex in checkWord){
                            let checkWordChar = checkWord[checkWordCharIndex]

                            // 확인하려는 단어도 한글자씩 순회합니다.
                            for(let targetWordCharIndex in targetWord){
                                let targetWordChar = targetWord[targetWordCharIndex]

                                // 이미 체크한 글자면 넘어갑니다.
                                if(matchedCount.indexOf(targetWordCharIndex) !== -1) continue

                                // 글자가 완벽히 일치하면 체크
                                if(checkWordChar === targetWordChar){
                                    matchedCount.push(targetWordCharIndex)
                                    break
                                }
                            }
                        }

                        // 글자가 모두 존재하는 경우
                        if(matchedCount.length == checkWord.length)
                            evadeCodeIndexes.push(targetWordIndex)
                    }
                }

                if(buildOption.isDebug){
                    let debugMessage = `${code.length}개 -> ${code.length-evadeCodeIndexes.length}개로 감축`
                    console.log(`${chalk.magenta(`<${buildOption.packName}>`)} ${chalk.magentaBright(`<unq-filter>`)} ${debugMessage}`)
                    console.timeEnd(preTimerKey)
                }

                // 최종 필터링 된 결과물을 재계산합니다.
                for(let checkWordIndex in code)
                    if(evadeCodeIndexes.indexOf(checkWordIndex) === -1)
                        uniquedCode.push(code[checkWordIndex])

                // 필터 결과물을 반환합니다.
                code = uniquedCode
            }
            console.log('write process start')
            fs.writeFileSync(buildOption.buildPath, JSON.stringify(code, null, 4))

            if(typeof buildCallback === 'function') buildCallback()
        })
    }

    static buildHelper(packName, testWord, applyUniqueFilter = true){
        let buildName = packName
        if(testWord !== undefined)
            buildName = 'test-' + buildName

        let timerKey = `${chalk.magenta(`<${packName}>`)} 빌드 소요된 시간:`
        console.time(timerKey)
        console.log('')

        Bias.build({
            sourcePath: `${__dirname}/source/${packName}`,
            buildPath: `./bias/build/${buildName}.json`,
            testWord,
            packName,
            isDebug: true,
            applyUniqueFilter
        }, ()=>{
            console.log(`${chalk.magenta(`<${packName}>`)} 빌드 완료!`)
            console.timeEnd(timerKey)
        })
    }

    static hangulParse(input){
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
        return parsed
    }
}