imitation()

function imitation() {
    const time = 36000 //с
    const lambda = 0.05
    const mu = 0.005
    const eta = 0.01
    const n = 4
    const l = 2
    const m = 1
    const timeInQueue = 150 // время нахождения заявки в очереди сек

    let freeChannels = n
    let countApps = [] //обслуженные заявки
    let allApps = 0
    let timeNewApp = 0 //время прихода новой заявки
    let refusalAppsCount = 0 // количество заявок с отказом
    let freeTimeCount = 0 //время простоя системы
    let apps = [] //массив заявок на обслуживании
    let queue = [] // заявки в очереди

    ////=======main cycle==================

    for (let i = 0; i <= time; i++) {

        apps = apps.length // проверка готовнисти заявки
            ? apps.filter(app => {
                if (app.serviceTime + app.arrivalTimeApp === i) {
                    freeChannels += app.workingChannels
                    countApps.push(app)
                    return 0
                } else {
                    return 1
                }
            })
            : apps

        queue = queue.length
            ? queue.filter(app => {
                if (i - app.arrivalTimeApp === timeInQueue) {
                    refusalAppsCount++
                    return 0
                } else {
                    return 1
                }
            }) : queue

        if (freeChannels) {
            apps = redistributionChannels(apps, i)
        }

        timeNewApp = i ? timeNewApp : getTimeNewApp(i)

        if (i === timeNewApp) {

            allApps++
            timeNewApp = getTimeNewApp(i)

            debugger

            if (apps.length === n && queue.length === m) {
                refusalAppsCount++
            } else if (apps.length === n && queue.length < m) {
                queue.push({
                    arrivalTimeApp: i,
                })
            } else {
                let newApp = {
                    serviceTime: getServiceTime(l),
                    arrivalTimeApp: i,
                    workingChannels: l,
                }

                if (!apps.length && l <= n) {
                    freeChannels -= l
                    apps.push(newApp)
                    continue
                }

                if (n >= 2 * l && apps.length === 1) {
                    freeChannels -= l
                    apps.push(newApp)
                    continue
                }

                if ((apps.length + 1) * l <= n) {
                    freeChannels -= l
                    apps.push(newApp)
                    continue
                }

                if ((apps.length + 1) * l > n && apps.length < n) {
                    if (apps.length > 1) {
                        apps = sortByWorkingChannels(apps)

                        if (apps[0].workingChannels > 1) {
                            let recalcChannels = recalcServiceTimeApp(
                                apps[0],
                                newApp,
                                i
                            )
                            apps[0] = recalcChannels.currentApp
                            newApp = recalcChannels.newApp
                            apps.push(newApp)
                            continue
                        }
                    } else if (l === n && apps.length === 1) {
                        let recalcChannels = recalcServiceTimeApp(
                            apps[0],
                            newApp,
                            i
                        )
                        apps[0] = recalcChannels.currentApp
                        newApp = recalcChannels.newApp
                        apps.push(newApp)
                    } else {
                        newApp.serviceTime = getServiceTime(freeChannels)
                        newApp.workingChannels = freeChannels
                        apps.push(newApp)
                    }
                }
            }
        }

        if (!apps.length && i) {
            freeTimeCount++
        }
    }
    ////=======main cycle==================

    //////==========functions=====================
    function redistributionChannels(apps, i) {
        if (apps.length) {
            for (let j = 0; j < apps.length; j++) {
                while (freeChannels) {
                    if (apps[j].workingChannels < l) {
                        apps[j].workingChannels += 1
                        freeChannels -= 1
                        apps[j].serviceTime =
                            i -
                            apps[j].arrivalTimeApp + 
                            getServiceTime(apps[j].workingChannels)
                    } else {
                        break
                    }
                }
            }

        }

        return apps
    }

    function sortByWorkingChannels(apps) {
            apps.sort((prev, next) => {
                if (prev.workingChannels < next.workingChannels) {
                    return 1
                }
                if (prev.workingChannels > next.workingChannels) {
                    return -1
                }
                return 0
            })
        
        return apps
    }

    function recalcServiceTimeApp(currentApp, newApp, i) {
        currentApp = recalcServiceTime(currentApp, i)
        newApp.serviceTime = getServiceTime(1)
        newApp.workingChannels = 1

        return {currentApp, newApp}
    }

    function recalcServiceTime(app, i) {
        app.workingChannels -= 1
        app.serviceTime =
            i - app.arrivalTimeApp + getServiceTime(app.workingChannels)

        return app
    }

    function getTimeNewApp(i) {
        return i + Math.round((-1 / lambda) * Math.log(getRandom()))
    }

    function getServiceTime(l) {
        return Math.round((-1 / (l * mu + eta)) * Math.log(getRandom()))
    }


    function getRandom() {
        let min = 0.0000000001
        let max = 0.9999999999
        return Math.random() * (max - min) + min
    }
}



