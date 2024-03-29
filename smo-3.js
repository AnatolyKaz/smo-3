statisticCalcParam(3, 5)
//==============imitation=================
function imitation(currentN) {
	const time = 3600 //с
	const lambda = 0.05
	const mu = 0.005
	const eta = 0.01
	const n = currentN
	const l = 2
	const m = 1
	const timeInQueue = 120 // время нахождения заявки в очереди сек

	let freeChannels = n
	let countApps = [] //обслуженные заявки
	let allApps = 0 /// все заявки
	let timeNewApp = 0 //время прихода новой заявки
	let refusalAppsCount = 0 // количество заявок с отказом
	let freeTimeCount = 0 //время простоя системы
	let apps = [] //массив заявок на обслуживании
	let queue = [] // заявки в очереди
	let appInQueue = 0

	/// параметры которые необходимо найти
	let countChannels = [] // количество занятых каналов в оазные моменты времени
	let fullWorkingSystem = 0 // количество моментов времени когда истема полностью занята
	let queueTime = 0 // [] // время проведенное в очереди

	////=======main cycle==================

	for (let i = 0; i <= time; i++) {
		if (apps.length === n && queue.length === m) {
			fullWorkingSystem++
		}
		apps = apps.length // проверка готовнисти заявки
			? apps.filter((app) => {
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
			? queue.filter((app) => {
					queueTime++
					if (app.arrivalTimeApp + timeInQueue === i) {
						//queueTime.push(timeInQueue)
						refusalAppsCount++
						return 0
					} else {
						return 1
					}
			  })
			: queue

		if (freeChannels) {
			let systemState = redistributionChannels(apps, queue, i)
			apps = systemState.apps
			queue = systemState.queue
		}

		timeNewApp = i ? timeNewApp : getTimeNewApp(i)

		if (i === timeNewApp) {
			allApps++
			timeNewApp = getTimeNewApp(i)

			if (apps.length === n && queue.length === m) {
				refusalAppsCount++
			} else if (apps.length === n && queue.length < m) {
				appInQueue++
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
						freeChannels = 0
						apps.push(newApp)
					}
				}
			}
		}

		countChannels.push(apps.length)

		
		if (!apps.length && i) {
			freeTimeCount++
		}
	}
	////=======main cycle==================
	/////=============calc params=================
	let midWorkingChannels =
		countChannels.reduce((a, b) => a + b) / countChannels.length
	let midQueueTime = queueTime / appInQueue 
	let probFullWorkingSystem = fullWorkingSystem / (time - freeTimeCount)

	return {
		midWorkingChannels,
		midQueueTime,
		probFullWorkingSystem,
		allApps,
	}

	/////=============calc params=================
	//////==========functions=====================
	function redistributionChannels(apps, queue, i) {
		if (queue.length) {
			for (let j = 0; j < queue.length; j++) {
				if (freeChannels) {
					queue[j].serviceTime = getServiceTime(1)
					queue[j].workingChannels = 1
					freeChannels -= 1
					apps.push(queue[j])
					//queueTime.push(i - queue[j].arrivalTimeApp)
					queue = queue.filter((app, index) => (index === j ? 0 : 1))
					apps = redistribution(apps, i)
				}
			}
		} else if (apps.length) {
			apps = redistribution(apps, i)
		}

		return { apps, queue }
	}

	function redistribution(apps, i) {
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

		return { currentApp, newApp }
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
		let max = 0.9
		return Math.random() * (max - min) + min
	}
}
//==============imitation=================
//============main calc params=============
function statisticCalcParam(n1, n2) {
	for (let index = n1; index <= n2; index++) {
		let data = []
		let countImitations = 10
		for (let i = 0; i < countImitations; i++) {
			data.push(imitation(index))
		}
		data.sort((prev, next) => {
			if (prev.allApps < next.allApps) {
				return 1
			}
			if (prev.allApps > next.allApps) {
				return -1
			}
			return 0
		})

		//let mostWorkingChannels = data.splice(0, 9)
		let midWorkingChannels = 0
		let midQueueTime = 0
		let probFullWorkingSystem = 0

		data.forEach((app) => {
			midWorkingChannels += app.midWorkingChannels
			midQueueTime += app.midQueueTime
			probFullWorkingSystem += app.probFullWorkingSystem
		})

		console.log('\n')
		console.log(
			`Среднее число занятых каналов: ${
				midWorkingChannels / countImitations
			}`
		)
		console.log(
			`Среднее время в очереди: ${midQueueTime / countImitations} сек`
		)
		console.log(
			`Веротность полной занятости ситемы: ${
				probFullWorkingSystem / countImitations
			} `
		)
		console.log('\n')
	}
}
//============main calc params=============
