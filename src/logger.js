import chalk from "chalk"

class Log {
    sucess(text){
        console.log(chalk.greenBright(`✅ | ${text}`))
    }
    error(text){
        console.log(chalk.redBright(`❌ | ${text}`))
    }
    warn(text){
        console.log(chalk.yellowBright(`⚠ | ${text}`))
    }
    process(text){
        console.log(chalk.cyan(`⏳ | ${text}`))
    }
}

export default new Log