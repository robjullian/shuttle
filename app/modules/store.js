const config = require('./config.json')

const fs = require('fs')
const http = require('https')
const extractZip = require('extract-zip')

const bookmarks = require('./bookmarks.js')
const files = require('./files.js')

const userData = require('electron').remote.app.getPath('userData').replace(/\\/g,"/")

let storeIsShow = false

EventsEmitter.on('SHOW_STORE', (bool) => {
  let storeView = document.querySelector('.store')
  if (bool === true) {
    storeView.style.display = 'block'
    storeIsShow = true
  } else if (bool === false) {
    storeView.style.display = 'none'
    storeIsShow = false
  } else {
    if (storeIsShow) {
      storeView.style.display = 'none'
      storeIsShow = false
    } else {
      storeView.style.display = 'block'
      storeIsShow = true
    }
  }
})

const store = {
  addonsTypes: [
    {
      type: "app",
      path: `${userData}/addons/apps/`
    },
    {
      type: "module",
      path: `${userData}/addons/modules/`
    }
  ],

  popup: {
    install (show, name, description, uuid, type) {
      if (show) {
        let input = [
          `<div class="store-in-app">`,
            `<a href="#" class="store-in-app-close" onclick="store.popup.install(false)"></a>`,
            `<h1 class="store-title">${name.toUpperCase()}</h1>`,
            `<br>`,
            `<br>`,
            `<div class="store-in-app-background" style="background: url(${config.api}/store/assets/${uuid}/banner) no-repeat center; background-size: contain;"></div>`,
            `<div class="store-in-app-content">`,
              `<h4 class="store-in-app-title">${name}</h4>`,
              `<a href="#" onclick="store.install('${uuid}', '${type}')">`,
                `<div class="store-in-app-button">`,
                  `<p class="store-in-app-button-text">ADD TO SHUTTLE</p>`,
                  `<i class="store-in-app-button-icon"></i>`,
                `</div>`,
              `</a>`,
              `<p class="store-in-app-description">${description}</p>`,
              `</div>`,
            `</div>`,
          `<div class="store-popup-overlay"></div>`
        ].join('')
        document.querySelector('.popup').innerHTML = input
        document.querySelector('.store-in-app').style.display = 'block'
      } else {
        document.querySelector('.store-in-app').style.display = 'none'
        document.querySelector('.popup').innerHTML = ''
      }
    },

    search (show) {
      let search = document.querySelector('.store-search')
      let home = document.querySelector('.store-home')

      let searchIcon = document.querySelector('.store-search-icon')
      let searchCloseIcon = document.querySelector('.store-search-close-icon')

      let searchBarValue = document.querySelector('.store-search-bar')
      let appsContainer = document.querySelector('#apps')
      if (show) {
        search.style.display = 'block'
        home.style.display = 'none'

        searchCloseIcon.style.display = 'block'
        searchIcon.style.display = 'none'

        fetch(`${config.api}/store/get/search/shuttle?q=${searchBarValue.value}`).then(res => res.json()).then((data) => {
          appsContainer.innerHTML = ''
          for (i in data) {
            appsContainer.innerHTML = `
              <div class="store-app-collection-item">
                <img class="store-app-collection-item-img" src="${config.api}/store/assets/${data[i].uuid}/icon" alt="">
                <h4 class="store-app-collection-item-name">${data[i].name}</h4>
                <p class="store-app-collection-item-description">${data[i].description}</p>
                <a href="#" class="store-app-collection-item-add-btn" onclick="store.popup.install(true, '${data[i].name}', '${data[i].description}', '${data[i].uuid}', '${data[i].type}')"></a>
              </div>`
          }
        })
      } else {
        search.style.display = 'none'
        home.style.display = 'block'

        searchCloseIcon.style.display = 'none'
        searchIcon.style.display = 'block'
        
        appsContainer.innerHTML = ''
        searchBarValue.value = ''
      }
    }

  },

  runListener () {
    document.querySelector('.store-search-bar').addEventListener('input', () => {
      store.popup.search(true)
    })
  },

  checkDirectorie (path) {
    return new Promise((resolve, reject) => {

      fs.exists(`${userData}/addons`, (bool) => {

        if (!bool) {
          fs.mkdir(`${userData}/addons`, { recursive: true }, (err) => {
            fs.exists(path, (bool) => {
              if (!bool) {
                fs.mkdir(path, { recursive: true }, (err) => {
                  resolve()
                })
              }
            })
          })
        } else {
          resolve()
        }

      })
    })
  },

  download (type, path, uuid) {
    return new Promise((resolve, reject) => {

      fs.mkdir(path + uuid, () => {
        let iconFile = fs.createWriteStream(`${path + uuid}/icon.png`)
        let appFile = fs.createWriteStream(`${path + uuid}/app.zip`)
  
        http.get(`${config.api}/store/assets/${uuid}/icon`, (res) => {
          res.pipe(iconFile)
        })
  
        http.get(`${config.api}/store/action/download/${uuid}`, (res) => {
          res.pipe(appFile)

          res.on('end', () => {
            resolve()
          })
        })
  
      })

    })
  },

  addInFile (path, type, uuid) {
    return new Promise((resolve, reject) => {

      if (type === "app") {
        bookmarks.createBookmark(path + uuid, 'app', uuid)
      } else if (type === "module") {
        files.modules.push({
          uuid: uuid,
          path: path + uuid 
        })
      }

      resolve()
    })
  },

  unzip (path, uuid) {
    return new Promise((resolve, reject) => {
      extractZip(`${path + uuid}/app.zip`, {
        dir: `${path + uuid}/app`
      }, () => {
        resolve()
      })
    })
  },

  install (uuid, type) {
    console.log('installing...')
    for (i in this.addonsTypes) {

      if (this.addonsTypes[i].type === type) {
        this.checkDirectorie(this.addonsTypes[i].path).then(() => {
          this.download(type, this.addonsTypes[i].path, uuid).then(() => {
            this.unzip(this.addonsTypes[i].path, uuid).then(() => {
              this.addInFile(this.addonsTypes[i].path, type, uuid).then(() => {

              })
            })
          })
        })

        break
      }

    }

  },

  uninstall (uuid, type) {
    bookmarks.removeBookmark(uuid)
  }

}

/*

download: `${config.api}/store/action/download/${uuid}`
install path:
  app: ${userData}/addons/apps/${uuid} || icon.png || index.html
  modules: ${userData}/addons/modules/${uuid} || icon.png || index.js

*/

module.exports = store