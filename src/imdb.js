import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

/**
 * 
 * @param {String} title 
 */

const imdb = async (title) => {
  try {
    let options = {
        method: 'GET',
        url: 'https://imdb8.p.rapidapi.com/auto-complete',
        params: {q: title},
        headers: {
          'x-rapidapi-host': 'imdb8.p.rapidapi.com',
          'x-rapidapi-key': process.env.RAPID_API
        }
    };

    const req = await axios.request(options)
    req.data.error = false
    return req.data
  } catch (e){
    return {error: true}
  }
    
}

export default imdb