import Hangul from 'hangul-js'

// 사전데이터들을 배열형태로 저장해서 보관합니다. (json)
var badWords = []
var normalWords = []
var softSearchWords = []

// 빠른 비속어단어 확인을 위해 사전에
// 단어목록을 한글자씩 조각내놓고 사용합니다.
var parsedBadWords = []

// 유동적인 비속어 목록 관리를 위해 이미 배열에
// 특정 단어가 존재하는지를 확인하기위해 해시맵을 사용합니다.
var badWordsMap = {}
var normalWordsMap = {}
var softSearchWordsMap = {}

const Utils = {
    escape: (text) => {
        return String(text).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
    },

    replaceAll: (message, search, replace) => {
        return message.replace(new RegExp(search, 'gi'), replace)
    },

    getPositionAll: (message, search, isString = true) => {
        let i = message.indexOf(search),
            indexes = []
        while (i !== -1) {
            indexes.push(i)
            i = message.indexOf(search, ++i)
        }

        if(!isString) return indexes

        let stringPoses = []
        for(let wordIndex of indexes){
            if(wordIndex === -1) continue
            for(let i=0;i<search.length;i++)
                stringPoses.push(wordIndex++)
        }
        return stringPoses
    },

    grabCouple: (manyArray) => {
        let i = 0
        let couple = []
        for(;;){
            if((manyArray.length - i) == 1) break
            couple.push([manyArray[i], manyArray[i+1]])
            if(++i>=manyArray.length) break
        }
        return couple
    },

    wordToArray: word => {
        let wordArray = []
        for (let i = 0; i <= word.length - 1; i++) {
            wordArray[i] = word[i]
        }
        return wordArray
    },

    lengthSplit: (message, limit) => {
        if (message.length <= limit) return [message]

        let fixedMessage = []
        let fullMessageLength = message.length
        let currentLength = 0

        let splitList = []
        while (true) {
            if (currentLength == fullMessageLength) {
                if (currentLength != 0 && splitList.length != 0) {
                    fixedMessage.push(splitList.join(''))
                    splitList = []
                }
                break
            }
            if (currentLength != 0 && currentLength % limit == 0 && splitList.length != 0) {
                fixedMessage.push(splitList.join(''))
                splitList = []
            }
            splitList.push(message[currentLength])
            currentLength++
        }

        return fixedMessage
    },

    sortMap: (inputMap) => {
        let sortedMap = {}

        Object.keys(inputMap).sort().forEach((key) => {
            sortedMap[key] = inputMap[key]
        })

        return sortedMap
    }
}

class Tetrapod {

    static load(inputBadwords, inputDictionary, inputSoftSearchWords, disableAutoParse) {
        badWords = inputBadwords
        normalWords = inputDictionary
        softSearchWords = inputSoftSearchWords

        if (disableAutoParse != false) {
            Tetrapod.parse(badWords)
            Tetrapod.mapping()
        }
    }

    static loadFile(badWordsPath, normalWordsPath, softSearchWordsPath) {
        let data = {
            badWords: require(badWordsPath).badwords,
            normalWords: require(normalWordsPath).dictionary,
            softSearchWords: require(softSearchWordsPath).badwords
        }
        Tetrapod.load(data.badWords, data.normalWords, data.softSearchWords)
    }

    static defaultLoad() {
        let data = Tetrapod.getDefaultData()
        Tetrapod.load(data.badWords, data.normalWords, data.softSearchWords)
    }

    static parse() {
        parsedBadWords = []
        for (let index in badWords)
            parsedBadWords.push(Utils.wordToArray(badWords[index]))
    }

    static mapping() {
        badWordsMap = {}
        normalWordsMap = {}
        softSearchWordsMap = {}

        for (let index in badWords)
            badWordsMap[badWords[index]] = true
        for (let index in normalWords)
            normalWordsMap[normalWords[index]] = true
        for (let index in softSearchWords)
            softSearchWordsMap[softSearchWords[index]] = true
    }

    static sortBadWordsMap() {
        badWordsMap = Utils.sortMap(badWordsMap)
        badWords = []
        for (var index in badWordsMap) badWords.push(index)
    }

    static sortNormalWordsMap() {
        normalWordsMap = Utils.sortMap(normalWordsMap)
        normalWords = []
        for (var index in normalWordsMap) normalWords.push(index)
    }

    static sortSoftSearchWordsMap() {
        softSearchWordsMap = Utils.sortMap(softSearchWordsMap)
        softSearchWords = []
        for (var index in softSearchWordsMap) softSearchWords.push(index)
    }

    static sortAll() {
        Tetrapod.sortBadWordsMap()
        Tetrapod.sortNormalWordsMap()
        Tetrapod.sortSoftSearchWordsMap()
    }

    static getDefaultData() {
        return {
            badWords: Tetrapod.recursiveList(require('./dictionary/bad-words.json').badwords),
            normalWords: require('./dictionary/normal-words.json').dictionary,
            softSearchWords: require('./dictionary/soft-search-words.json').badwords
        }
    }

    static getLoadedData() {
        return {
            badWords: badwords,
            normalWords: normalWords,
            softSearchWords: softSearchWords
        }
    }

    /*
    static saveAllData(badWordsPath, normalWordsPath, softSearchWordsPath, isAsync) {
        Tetrapod.saveBadWordsData(badWordsPath, isAsync)
        Tetrapod.saveNormalWordsData(normalWordsPath, isAsync)
        Tetrapod.saveSoftSearchWordsData(softSearchWordsPath, isAsync)
    }

    static saveBadWordsData(path, isAsync) {
        Tetrapod.sortBadWordsMap()

        let data = JSON.stringify({
            badwords: badWords
        }, null, 4)

        (isAsync === true) ? fs.writeFile(path, data) : fs.writeFileSync(path, data)
    }

    static saveNormalWordsData(path, isAsync) {
        Tetrapod.sortNormalWordsMap()

        let data = JSON.stringify({
            dictionary: normalWords
        }, null, 4)

        (isAsync === true) ? fs.writeFile(path, data) : fs.writeFileSync(path, data)
    }

    static saveSoftSearchWordsData(path, isAsync) {
        Tetrapod.sortSoftSearchWordsMap()

        let data = JSON.stringify({
            badwords: softSearchWords
        }, null, 4)

        (isAsync === true) ? fs.writeFile(path, data) : fs.writeFileSync(path, data)
    }
    */

    static isBad(message) {
        return Tetrapod.find(message, false).length != 0
    }

    static find(message, needMultipleCheck, splitCheck) {
        var totalResult = []

        if (splitCheck === undefined) splitCheck = 15
        var messages = (splitCheck != 0) ? Utils.lengthSplit(message, splitCheck) : [message]

        for (var index1 = 0; index1 <= messages.length - 1; index1++) {
            let currentResult = Tetrapod.nativeFind(messages[index1], needMultipleCheck)

            if (needMultipleCheck) {
                for (var index2 = 0; index2 <= currentResult.length - 1; index2++)
                    if (currentResult !== null)
                        totalResult.push(currentResult.founded[index2])
            } else {
                if (currentResult !== null)
                    totalResult.push(currentResult.founded)
            }
        }
        return totalResult;
    }

    static nativeFind(message, needMultipleCheck) {
        //let unsafeMessage = message.toLowerCase()
        let normalWordPositions = {}
        let foundedBadWords = []
        let foundedBadWordPositions = []

        // 정상단어를 배제합니다.
        /*
        for (let index in normalWords) {
            if (unsafeMessage.length == 0) break
            unsafeMessage = Utils.replaceAll(unsafeMessage, normalWords[index], '')
        }
        */

        // 정상단어의 포지션을 찾습니다.
        for (let index in normalWords) {
            if (message.length == 0) break
            let searchedPositions = Utils.getPositionAll(message, normalWords[index])
            for(let searchedPosition of searchedPositions)
                if(searchedPosition !== -1)
                    normalWordPositions[searchedPosition] = true
        }

        // 타국의 비속어를 삭제합니다.
        /*
        for (var otherLangBadWordsIndex in softSearchWords) {
            let otherLangBadWord = softSearchWords[otherLangBadWordsIndex]
            if (unsafeMessage.search(otherLangBadWord) != -1) {
                foundedBadWords.push(otherLangBadWord)
                if (!needMultipleCheck) return foundedBadWords
            }
        }
        */

        // KR BAD WORDS FIND ALGORITHM

        // 비속어 단어를 한 단어씩 순회합니다.
        for (let index1 in parsedBadWords) {
            let badWord = parsedBadWords[index1]

            let findCount = {}
            let badWordPositions = []

            // 비속어 단어를 한글자씩
            // 순회하며 존재여부를 검사합니다.
            for (let index2 in badWord) {
                let badOneCharacter = String(badWord[index2]).toLowerCase()

                // 비속어 단어의 글자위치를 수집합니다.

                // 메시지 글자를 모두 반복합니다.
                for (let index3 in message) {

                    // 정상적인 단어의 글자일경우 검사하지 않습니다.
                    if(typeof normalWordPositions[Number(index3)] != 'undefined') continue

                    // 단어 한글자라도 들어가 있으면
                    // 찾은 글자를 기록합니다.
                    let unsafeOneCharacter = String(message[index3]).toLowerCase()
                    if (badOneCharacter == unsafeOneCharacter) {
                        findCount[badOneCharacter] = true
                        badWordPositions.push(Number(index3))
                        break
                    }
                }

                // 비속어를 구성하는 글자가
                // 전부 존재하는 경우 이를 발견처리합니다.
                if (badWord.length == Object.keys(findCount).length) {

                    // 포지션을 순서대로 정렬했는데
                    // 순서가 달라진다면 글자가 섞여있는 것으로 간주합니다.
                    let isShuffled = false
                    let sortedPosition = badWordPositions.slice().sort((a, b) => a - b)
                    if(sortedPosition != badWordPositions){
                        isShuffled = true
                        badWordPositions = sortedPosition
                    }

                    // TODO
                    // 발견된 각 문자 사이의 거리 및
                    // 사람이 인식할 가능성 거리의 계산

                    // (3글자가 각각 떨어져 있을 수도 있음)


                    // 글자간 사이들을 순회하여서
                    // 해당 비속어가 사람이 인식하지 못할 정도로
                    // 퍼져있다거나 섞여있는지를 확인합니다.
                    let isNeedToPass = false
                    for(let diffRanges of Utils.grabCouple(badWordPositions)){

                        // 글자간 사이에 있는 모든 글자를 순회합니다.
                        let diff = ''
                        for(let diffi = diffRanges[0]+1; diffi <= (diffRanges[1]-1); diffi++){
                            diff += message[diffi]
                        }

                        if(isShuffled){
                            // 뒤집힌 단어의 경우엔 자음과 모음이
                            // 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.
                            if(!Tetrapod.shuffledMessageFilter(diff))
                                isNeedToPass = true
                        }
                    }

                    // 해당 비속어를 발견은 하였지만,
                    // 사람이 인지하지 못할 것으로 간주되는 경우
                    // 해당 발견된 비속어를 무시합니다.
                    if(isNeedToPass) continue

                    console.log(`isShuffled: ${isShuffled}`)
                    console.log(`원문: ${message}`)
                    console.log(`발견된 비속어: [${badWord.join()}]`)
                    console.log(`발견된 비속어 위치: [${badWordPositions}]`)

                    if (needMultipleCheck != true){
                        return {
                            founded: badWord.join(''),
                            positions: badWordPositions
                        }
                    }
                    foundedBadWords.push(badWord.join(''))
                    foundedBadWordPositions.push(badWordPositions)
                }
            }
        }

        if (needMultipleCheck != true) return null
        return {
            founded: foundedBadWords,
            positions: foundedBadWordPositions
        }
    }

    static fix(message, replaceCharacter) {
        let fixedMessage = message
        let foundedBadWords = Tetrapod.find(message, true)

        replaceCharacter = (replaceCharacter === undefined) ? '*' : replaceCharacter
        for (let index1 in foundedBadWords) {
            let foundedBadWord = Utils.wordToArray(foundedBadWords[index1])

            for (let index2 in foundedBadWord) {
                let foundedBadOneCharacter = foundedBadWord[index2]
                fixedMessage = Utils.replaceAll(fixedMessage, foundedBadOneCharacter, replaceCharacter)
            }
        }
        return fixedMessage
    }

    static isExistNormalWord(word) {
        return (typeof(normalWordsMap[word]) != 'undefined')
    }

    static addNormalWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (word.length == 0) continue

            if (Tetrapod.isExistNormalWord(word)) continue

            normalWordsMap[word] = true
            normalWords.push(word)
        }
    }

    static deleteNormalWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (!Tetrapod.isExistNormalWord(word)) continue

            delete(normalWordsMap[word])

            for (let mapIndex = normalWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (normalWords[mapIndex] === word) {
                    normalWords.splice(mapIndex, 1)
                    break
                }
            }
        }
    }

    static isExistBadWord(word) {
        return (typeof(badWordsMap[word]) != 'undefined')
    }

    static addBadWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (word.length == 0) continue

            if (Tetrapod.isExistBadWord(word)) continue

            badWordsMap[word] = true
            badWords.push(word)
        }
    }

    static deleteBadWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (!Tetrapod.isExistBadWord(word)) continue

            delete(badWordsMap[word])

            for (let mapIndex = badWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (badWords[mapIndex] === word) {
                    badWords.splice(mapIndex, 1)
                    break
                }
            }
        }
    }

    static isExistSoftSearchWord(word) {
        return (typeof(softSearchWordsMap[word]) != 'undefined')
    }

    static addSoftSearchWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (word.length == 0) continue

            if (Tetrapod.isExistSoftSearchWord(word)) continue

            softSearchWordsMap[word] = true
            softSearchWords.push(word)
        }
    }

    static deleteSoftSearchWords(words) {
        for (let wordsIndex in words) {
            let word = words[wordsIndex]
            if (!Tetrapod.isExistSoftSearchWord(word)) continue

            delete(softSearchWordsMap[word])

            for (let mapIndex = softSearchWords.length - 1; mapIndex >= 0; mapIndex--) {
                if (softSearchWords[mapIndex] === word) {
                    softSearchWords.splice(mapIndex, 1)
                    break
                }
            }
        }
    }

    // 뒤집힌 단어의 경우엔 자음과 모음이
    // 한글글자가 글자사이에 쓰인 경우 비속어에서 배제합니다.
    static shuffledMessageFilter(message, isChar = false) {
        for(let char of message){
            if(Hangul.disassemble(char)[0] == 'ㅇ') continue
            if(Hangul.isComplete(char))
                return false
        }
        return true
    }

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
    static recursiveComponent (data) {

        // 데이터의 전항 후항을 순회합니다.
        for(let i=0;i<=1;i++){
    
            // 데이터의 모든 항목을 순회합니다.
            for(let itemIndex in data[i]){
                let item = data[i][itemIndex]
    
                // 데이터 항목이 배열인 경우
                // 재귀 컴포넌트 해석을 진행합니다.
                if(Array.isArray(item)){
                    let solvedData = Tetrapod.recursiveComponent(item)
                    data[i][itemIndex] = null
                    data[i] = data[i].concat(solvedData)
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
        return solvedData
    }

    static recursiveList (list, defaultType = 'string') {
        let rebuild = []
        for(let item of list){
            if(typeof item === defaultType){
                rebuild.push(item)
            }else{
                rebuild = rebuild.concat(Tetrapod.recursiveComponent(item))
            }
        }
        return rebuild
    }
}

module.exports = Tetrapod