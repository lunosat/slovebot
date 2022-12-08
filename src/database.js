import fs from "fs/promises";
import { readFileSync } from "fs";
import log from './logger.js'

class Database {
  constructor() {
    this.db;
  }
  /**
   * 
   * @param {Object} data 
   * @returns 
   */
  async addFilm(data) {
    try {
      this.db.push(data)
      this.write()
      return true
    } catch (e){
      console.log(e)
      return false
    }
  }
  /**
   * 
   * @returns {Array}
   */
  async getFilmsTitles(watched){

    if(!watched){
      let isValid = this.db.filter(item => item.watched === false && item?.title)
      return isValid
    }
    let isValid = this.db.filter(item => item.title)
    let titles = []
    isValid.forEach(element => {
      titles.push({title: element.title, userTitle: element.userTitle, addedBy: element.addedBy, watched: element.watched})
    });
    return titles
  }
  async deleteFilm() {}
  async checkDatabase() {
    log.process('Cheking database...')
    let status = { sucess: null };
    const files = await fs.readdir("./database");
    //console.log(files);
    if (files.length === 0) {
      //console.log("here");
      let data = [];
      await fs.writeFile(
        "./database/db.json",
        JSON.stringify(data),
        { encoding: "utf-8" },
        (err) => {
          if (err) {
            status.sucess = false;
            return new Error("Error on create database");
          } else status.sucess = true;
        }
      );
    } else status.sucess = true;

    if (status.sucess) {
      this.db = JSON.parse(readFileSync("./database/db.json"));
    }
  
    return status;
  }
  async write(){
    fs.writeFile(
      "./database/db.json",
      JSON.stringify(this.db),
      { encoding: "utf-8" },
      (err) => {
        if (err) {
          return new Error("Error on create database");
        } else return
      }
    );
  }
  /**
   * 
   * @param {String} title 
   */
  async turnWatched(title){
    let search = this.db.find(item => item.title === title)
    let index = this.db.indexOf(search)
    this.db[index].watched = true
    this.write()
  }
}

export default Database;
