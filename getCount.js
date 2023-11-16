process.on('message', function(input) {
    console.log(input)
    let result = 0
    input = parseInt(input.input)
    for(let i = 0 ; i <= input ;i++){
        result = i
    }
    process.send(`total count ${result}`)
})  