const view = {
  mobileUserAgent: 'Mozilla/5.0 (Linux; Android 9.0; Pixel XL 2 Build/LMY48B; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.181 Mobile Safari/537.36',
  desktopUserAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',

  load () {
    let landingPageUrl = `file://${require('electron').remote.app.getAppPath()}/app/views/changelog.html`.replace(/\\/g,"/")
    this.show(0, landingPageUrl)
  },

  fixUrl (url) {
    return new Promise((resolve) => {
      if (url.includes('https://') || url.includes('http://') || url.includes('file://')) {
        resolve(url)
      } else {
        resolve(`http://${url}`)
      }
    })
  },

  create (id, url, type) {
    return new Promise((resolve) => {
      const webViewList = document.querySelector('.views')
      this.fixUrl(url).then((url) => {

        let webViewToCreate = document.createElement("webview")

        if (type === 'app') {
          webViewToCreate.setAttribute('src', `file://${url}`)
          webViewToCreate.setAttribute('preload', './modules/applications.js')
        } else {
          webViewToCreate.setAttribute('src', url)
          webViewToCreate.setAttribute('preload', './modules/webviewPreloader.js')
        }

        webViewToCreate.setAttribute('id', `view-${id}`)
        webViewToCreate.setAttribute('onmouseover', 'controlBar.show(0, false)')
        webViewToCreate.setAttribute('class', 'web-content inactive')
        webViewToCreate.setAttribute('useragent', this.mobileUserAgent)
        webViewToCreate.setAttribute('disablewebsecurity', '')

        webViewList.appendChild(webViewToCreate)

        this.listenWebViewError(id)
        this.show(id)
        resolve()

      })
    })
  },

  remove (id) {
    let viewToRemove = document.getElementById(`view-${id}`)
    if (viewToRemove) {
      document.getElementById(`view-${id}`).remove()
    }

    this.show(0)
  },

  show (id, url, type) {
    EventsEmitter.emit('SHOW_SETTINGS', false)
    EventsEmitter.emit('SHOW_STORE', false)
    const activeWebView = 'web-content active'
    const inactiveWebView = 'web-content inactive'

    if (document.querySelector('.active')) {
      document.querySelector('.active').className = inactiveWebView
    }
    if (!document.querySelector(`#view-${id}`)) {
      this.create(id, url, type).then(() => {
        document.querySelector(`#view-${id}`).className = activeWebView
      })
    } else {
      document.querySelector(`#view-${id}`).className = activeWebView
    }
  },

  generateErrorPage (message, type) {
    let error = `<!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8"> <title>No internet</title> <style>@import url(../assets/fonts/SourceSansPro.css); html{overflow: hidden; font-family: 'Light';}body{user-select: none;text-align: center; background-color: white;}img{width: 70%; max-width: 200px;}h3{margin-top: 30px; font-family: 'Source Sans Pro', sans-serif; font-weight: 300; font-size: 11.4pt;}.main-content{position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 50%;}</style></head><body><div class="main-content"> <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkNhbHF1ZV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDYwLjQgNTQuOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjAuNCA1NC44OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHN0eWxlIHR5cGU9InRleHQvY3NzIj4uc3Qwe2ZpbGw6IzAxMDIwMjt9PC9zdHlsZT48ZyBpZD0iWE1MSURfMjk3XyI+PHBhdGggaWQ9IlhNTElEXzMxMV8iIGNsYXNzPSJzdDAiIGQ9Ik0wLDUwLjdjMi40LTEuMSw0LjMtMi41LDUuNi00LjNjMS40LTEuOCwyLTMuOCwyLTYuMWMtMC4yLDAuMS0wLjUsMC4xLTAuOSwwLjFjLTEuNCwwLTIuNS0wLjQtMy41LTEuMmMtMS0wLjgtMS41LTItMS41LTMuNmMwLTEuNSwwLjUtMi43LDEuNS0zLjZjMS0wLjksMi4yLTEuMywzLjctMS4zYzEuOCwwLDMuMiwwLjcsNC4zLDIuMmMxLDEuNSwxLjYsMy41LDEuNiw2YzAsMy43LTEsNi45LTMsOS42Yy0yLDIuNy00LjcsNC44LTguMiw2LjNMMCw1MC43eiBNNi42LDEwLjdDNS4yLDEwLjcsNCwxMC4yLDMsOS4yQzIsOC4yLDEuNSw3LDEuNSw1LjRjMC0xLjYsMC41LTMsMS41LTRDNCwwLjUsNS4yLDAsNi42LDBDOCwwLDkuMiwwLjUsMTAuMiwxLjVjMSwxLDEuNSwyLjMsMS41LDRjMCwxLjUtMC41LDIuOC0xLjUsMy44QzkuMiwxMC4yLDgsMTAuNyw2LjYsMTAuN3oiLz48cGF0aCBpZD0iWE1MSURfMzE0XyIgY2xhc3M9InN0MCIgZD0iTTIwLjcsMTYuNGgxOS42djUuNEgyMC43VjE2LjR6Ii8+PHBhdGggaWQ9IlhNTElEXzMxNl8iIGNsYXNzPSJzdDAiIGQ9Ik00Ny42LDUwLjdjMi40LTEuMSw0LjMtMi41LDUuNi00LjNjMS40LTEuOCwyLTMuOCwyLTYuMWMtMC4yLDAuMS0wLjUsMC4xLTAuOSwwLjFjLTEuNCwwLTIuNS0wLjQtMy41LTEuMmMtMS0wLjgtMS41LTItMS41LTMuNmMwLTEuNSwwLjUtMi43LDEuNS0zLjZjMS0wLjksMi4yLTEuMywzLjctMS4zYzEuOCwwLDMuMiwwLjcsNC4zLDIuMmMxLDEuNSwxLjYsMy41LDEuNiw2YzAsMy43LTEsNi45LTMsOS42Yy0yLDIuNy00LjcsNC44LTguMiw2LjNMNDcuNiw1MC43eiBNNTQuMiwxMC43Yy0xLjQsMC0yLjYtMC41LTMuNi0xLjVjLTEtMS0xLjUtMi4zLTEuNS0zLjhjMC0xLjYsMC41LTMsMS41LTRjMS0xLDIuMi0xLjUsMy42LTEuNWMxLjQsMCwyLjUsMC41LDMuNSwxLjVjMSwxLDEuNSwyLjMsMS41LDRjMCwxLjUtMC41LDIuOC0xLjUsMy44QzU2LjgsMTAuMiw1NS42LDEwLjcsNTQuMiwxMC43eiIvPjwvZz48L3N2Zz4=" alt=""> <h3>${message}</h3></div></body></html>`
    let certif = `<!DOCTYPE html><html lang="en"><head> <meta charset="UTF-8"> <title>Warning</title> <style>@import url(../assets/fonts/SourceSansPro.css); html{overflow: hidden; font-family: 'Light';}body{user-select: none; text-align: center; background-color: white; font-family: 'Source Sans Pro', sans-serif;}img{width: 25%; max-width: 400px;}h1{margin-top: 20px; font-weight: 300; font-size: 12pt;}p{margin-top: 20px; font-weight: 100; font-size: 11.4pt; color: #919192;}a{text-decoration: none; margin-top: 20px; font-weight: 100; font-size: 11.4pt; color: #E71F5F;}.continue{position: absolute; right: 40px; bottom: 20px; color: #919192; font-size: 9pt;}.main-content{position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%;}</style></head><body> <div class="main-content"> <img src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkNhbHF1ZV8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ0LjcgMzguNyIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDQuNyAzOC43OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHN0eWxlIHR5cGU9InRleHQvY3NzIj4uc3Qwe2ZpbGw6I0U3MjQ2MDt9PC9zdHlsZT48cGF0aCBjbGFzcz0ic3QwIiBkPSJNNDQuNywzOC43SDBMMjIuMywwTDQ0LjcsMzguN3ogTTEuNywzNy43aDQxLjJMMjIuMywyTDEuNywzNy43eiIvPjxnPjxwYXRoIGNsYXNzPSJzdDAiIGQ9Ik0yMi4zLDMwLjNjLTAuNSwwLTAuOS0wLjItMS4zLTAuNWMtMC4zLTAuNC0wLjUtMC44LTAuNS0xLjNjMC0wLjUsMC4yLTAuOSwwLjUtMS4zYzAuMy0wLjQsMC43LTAuNSwxLjMtMC41czAuOSwwLjIsMS4zLDAuNWMwLjMsMC40LDAuNSwwLjgsMC41LDEuM2MwLDAuNS0wLjIsMC45LTAuNSwxLjNDMjMuMywzMC4xLDIyLjksMzAuMywyMi4zLDMwLjN6IE0yMS40LDI1LjhsLTAuNC00LjlsLTAuMS0yLjZoM2wtMC4xLDIuNmwtMC40LDQuOUgyMS40eiIvPjwvZz48L3N2Zz4=" alt=""> <h1>${lang('CERT_ERROR_TITLE')}</h1> <p>${lang('CERT_ERROR_TEXT')}</p><br><a href="#" onclick="window.goHome()">${lang('CERT_ERROR_BACK')}</a> </div><a href="${message}" class="continue">${lang('CERT_ERROR_CONTINUE')}</a></body></html>`

    if (type === 'error') {
      return 'data:text/html;charset=UTF-8,' + encodeURIComponent(error)
    } else {
      return 'data:text/html;charset=UTF-8,' + encodeURIComponent(certif)
    }
  },

  getActiveView() {
    return document.querySelector('webview.web-content.active');
  },

  showWebviewConsole() {
    let w = this.getActiveView()
    if(w != undefined) {
      w.openDevTools()
    }
  },

  changeVersion() {
    let v = this.getActiveView()
    if(v.classList.contains('desktop')) {
      v.classList.remove('desktop')
      v.setUserAgent(this.mobileUserAgent)
    }
    else {
      v.classList.add('desktop')
      v.setUserAgent(this.desktopUserAgent)
    }
    v.reload()
  },

  listenWebViewError (id) {
    let webviewToListen = document.querySelector(`#view-${id}`)
    if (webviewToListen) {
      webviewToListen.addEventListener('did-fail-load', (errorCode, errorDescription, validatedURL) => {
        console.log(errorCode)
        if (errorCode.errorCode !== -3 && errorCode.errorCode !== -27 && errorCode.errorCode !== -105) {
          if (navigator.onLine === false) {
            webviewToListen.loadURL(this.generateErrorPage('NO INTERNET CONNECTION', 'error'))
          } else {
            if (errorCode.errorDescription) {
              webviewToListen.loadURL(this.generateErrorPage(errorCode.errorDescription, 'error'))
            } else {
              webviewToListen.loadURL(this.generateErrorPage('UNKNOW ERROR', 'error'))
            }
          }
        } else if (errorCode.errorCode === -203) {
          webviewToListen.loadURL(this.generateErrorPage(event.url.replace('https://', 'http://'), 'cert'))
        }
      })

      webviewToListen.addEventListener('ipc-message', event => {
        if (event.channel === 'OPEN_QUICK_SEARCH') {
          EventsEmitter.emit('OPEN_QUICK_SEARCH', event.args[0])
        } if (event.channel === 'PAGE_ALERT') {
          alert(`${event.args[0].site} : ${event.args[0].message}`)
        } if (event.channel === 'COPY_TO_CLIPBOARD') {
          require('electron').clipboard.writeText(event.args[0])
        } if (event.channel === 'OPEN_IN_BROWSER') {
          require('electron').shell.openExternal(event.args[0])
        } if (event.channel === 'SWITCH_VERSION') {
          this.changeVersion()
        } if (event.channel === 'GO_HOME') {
            const bookmarks = require('./bookmarks.js')
            const files = require('./files.js')
            if (event.args[0].href.includes('data:text/html;charset=UTF-8,')) {
              if (files.settings.getValue('settings.blockDangerousWebsite')) {
                let id = webviewToListen.id.replace('view-', '')
                this.show(0)
  
                if (id.includes('quickSearch') === true || id.includes('app') === true) {
                  bookmarks.removeBookmark(id)
                } else {
                  rbookmarks.removeBookmark(Number(id))
                }
              }
            }
        }
      })

      webviewToListen.addEventListener('new-window', event => {
        EventsEmitter.emit('OPEN_QUICK_SEARCH', event.url)
      })

      webviewToListen.addEventListener('enter-html-full-screen', () => {
        this.setFullscreen(true, webviewToListen)
      })
      
      webviewToListen.addEventListener('leave-html-full-screen', () => {
        this.setFullscreen(false, webviewToListen)
      })

    }
  },

  setFullscreen: (bool, view) => {

    let bookmarksBar = document.querySelector('.bar')
    let controlBar = document.querySelector('.control-bar')

    console.log(bool)

    if (bool) {
      bookmarksBar.style.display = 'none'
      controlBar.style.display = 'none'
      document.querySelector('.add-btn').style.display = 'none'
      view.style.left = '0px'
    } else {
      bookmarksBar.style.display = 'block'
      controlBar.style.display = 'block'
      document.querySelector('.add-btn').style.display = 'block'
      view.style.left = '35px'
      view.executeJavaScript(`
        document.webkitExitFullscreen()
      `)
    }

    require('electron').ipcRenderer.send('SetBounds', bool)
  }

}

module.exports = view