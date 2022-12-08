import initBot from './src/bot.js'
import Database from './src/database.js'
import log from './src/logger.js'

const db = new Database()

const start = async () => {
    let dbStatus = await db.checkDatabase()
    if(dbStatus.sucess){
        log.sucess('Database is ok')
        initBot(db)
    } else {
        log.error('Database error')
        process.exit(1)
    }
}

start()