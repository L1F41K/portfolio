document.addEventListener('DOMContentLoaded', () => {
	/* === 1. СЛАЙДЕР === */
	const slides = document.querySelectorAll('.hero-slide')
	const titles = document.querySelectorAll('.hero-title')
	const btnPrev = document.getElementById('btn-prev')
	const btnNext = document.getElementById('btn-next')
	let currentSlide = 0
	let isAnimating = false

	function initSlider() {
		if (slides.length > 0) {
			slides.forEach((s, i) => {
				if (i === 0) s.classList.add('is-active')
				else s.classList.remove('is-active', 'is-left', 'is-right')
			})
		}
		if (titles.length > 0) {
			titles.forEach((t, i) => {
				if (i === 0) t.classList.add('is-active')
				else t.classList.remove('is-active', 'is-exit')
			})
		}
	}

	initSlider()

	function changeSlide(direction) {
		if (isAnimating || slides.length < 2) return
		isAnimating = true

		const activeSlide = slides[currentSlide]
		const activeTitle = titles[currentSlide]

		let nextSlideIndex
		if (direction === 'next') {
			nextSlideIndex = (currentSlide + 1) % slides.length
		} else {
			nextSlideIndex = (currentSlide - 1 + slides.length) % slides.length
		}

		const nextSlide = slides[nextSlideIndex]
		const nextTitle = titles[nextSlideIndex]

		/* --- ФОН --- */
		nextSlide.classList.add('no-transition')

		if (direction === 'next') {
			nextSlide.classList.remove('is-left', 'is-active')
			nextSlide.classList.add('is-right')
		} else {
			nextSlide.classList.remove('is-right', 'is-active')
			nextSlide.classList.add('is-left')
		}

		nextSlide.offsetHeight // reflow
		nextSlide.classList.remove('no-transition')

		activeSlide.classList.remove('is-active')

		if (direction === 'next') {
			activeSlide.classList.add('is-left')
			activeSlide.classList.remove('is-right')
		} else {
			activeSlide.classList.add('is-right')
			activeSlide.classList.remove('is-left')
		}

		nextSlide.classList.add('is-active')
		nextSlide.classList.remove('is-left', 'is-right')

		/* --- ТЕКСТ --- */
		nextTitle.classList.add('no-transition')
		nextTitle.classList.remove('is-active', 'is-exit')
		nextTitle.offsetHeight
		nextTitle.classList.remove('no-transition')

		activeTitle.classList.remove('is-active')
		activeTitle.classList.add('is-exit')

		nextTitle.classList.add('is-active')

		currentSlide = nextSlideIndex

		setTimeout(() => {
			isAnimating = false
		}, 1400)
	}

	if (btnNext) btnNext.addEventListener('click', () => changeSlide('next'))
	if (btnPrev) btnPrev.addEventListener('click', () => changeSlide('prev'))

	/* === 2. PING-PONG VIDEO LOOP === */
	function setupPingPongVideos() {
		const videos = document.querySelectorAll('.hero-slide__video')
		videos.forEach(video => {
			video.removeAttribute('loop')
			let rewindInterval = null
			const intervalSpeed = 30
			const rewindStep = 0.04

			video.addEventListener('ended', () => {
				video.pause()
				if (rewindInterval) clearInterval(rewindInterval)
				rewindInterval = setInterval(() => {
					if (video.currentTime <= 0.1) {
						clearInterval(rewindInterval)
						video.currentTime = 0
						video.play()
					} else {
						video.currentTime -= rewindStep
					}
				}, intervalSpeed)
			})

			video.addEventListener('play', () => {
				if (rewindInterval) clearInterval(rewindInterval)
			})
		})
	}
	setupPingPongVideos()

	/* === 3. TYPEWRITER (Обновленная версия: без курсора, "Мы" остается) === */
	const textEl = document.getElementById('typewriter-text')
	const fullPhrase = 'Мы не делаем туры'
	const prefix = 'Мы ' // Часть, которая не стирается
	const partToRemove = 'не '

	// Тайминги
	const typeSpeed = 50
	const deleteSpeed = 60
	const backspaceSpeed = 30

	async function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	async function typeWriterLoop() {
		// Устанавливаем начальное состояние
		textEl.textContent = prefix

		while (true) {
			textEl.classList.remove('is-strike')

			// Сбрасываем текст до префикса перед началом круга
			textEl.textContent = prefix

			// Вычисляем, что нужно допечатать (всё, что после "Мы ")
			const textToType = fullPhrase.substring(prefix.length)

			// 1. Набор оставшегося текста
			for (let i = 0; i < textToType.length; i++) {
				textEl.textContent += textToType.charAt(i)
				await sleep(typeSpeed)
			}

			await sleep(1000)

			// 2. Удаление "не " из середины
			let currentString = textEl.textContent
			// Ищем "не " строго после префикса
			const startIndex = currentString.indexOf(partToRemove, prefix.length)

			if (startIndex !== -1) {
				let tempStr = currentString
				for (let i = 0; i < partToRemove.length; i++) {
					tempStr = tempStr.slice(0, startIndex) + tempStr.slice(startIndex + 1)
					textEl.textContent = tempStr
					await sleep(deleteSpeed)
				}
			}

			// 3. Зачеркивание
			textEl.classList.add('is-strike')

			await sleep(2000)

			// 4. Стираем всё, пока длина больше длины префикса ("Мы ")
			while (textEl.textContent.length > prefix.length) {
				textEl.textContent = textEl.textContent.slice(0, -1)
				await sleep(backspaceSpeed)
			}

			textEl.classList.remove('is-strike')

			await sleep(500)
		}
	}

	if (textEl) {
		typeWriterLoop()
	}

	/* === 4. MOBILE MENU === */
	const mobileTrigger = document.getElementById('mobile-trigger')
	const mobileMenu = document.getElementById('mobile-menu')
	const header = document.getElementById('header')
	const header2 = document.getElementById('header2') // Добавили переменную

	// Проверяем главные элементы меню
	if (mobileTrigger && mobileMenu) {
		mobileTrigger.addEventListener('click', () => {
			mobileTrigger.classList.toggle('is-active')
			mobileMenu.classList.toggle('is-open')

			// Переключаем классы у хедеров по отдельности (если они есть на странице)
			if (header) header.classList.toggle('is-menu-open')
			if (header2) header2.classList.toggle('is-menu-open')

			// Блокировка скролла
			document.body.style.overflow = mobileMenu.classList.contains('is-open')
				? 'hidden'
				: ''
		})
	}

	/* === 5. WORLD VIDEO CARDS INTERACTION === */
	const worldCards = document.querySelectorAll('.world-card')

	if (worldCards.length > 0) {
		worldCards.forEach(card => {
			const video = card.querySelector('video')

			if (video) {
				card.addEventListener('mouseenter', () => {
					video.pause()
				})

				card.addEventListener('mouseleave', () => {
					video.play()
				})
			}
		})
	}
}) // <--- Эта скобка закрывает самый первый document.addEventListener

/* === PERF: ЛЕНИВОЕ ВОСПРОИЗВЕДЕНИЕ ВИДЕО ===
   Раньше 8 видео-карточек грузились и декодировались одновременно (~90 МБ),
   из-за чего страницу фризило. Теперь играют только те, что во вьюпорте. */
document.addEventListener('DOMContentLoaded', () => {
	const safePlay = v => {
		const p = v.play()
		if (p && typeof p.catch === 'function') p.catch(() => {})
	}

	// --- Карточки (preload="none", src уже в разметке): грузим и играем по факту видимости ---
	const cardVideos = document.querySelectorAll('.card-video')

	if (!('IntersectionObserver' in window)) {
		// Старые браузеры — просто запускаем всё
		cardVideos.forEach(safePlay)
	} else if (cardVideos.length) {
		const cardObserver = new IntersectionObserver(
			entries => {
				entries.forEach(entry => {
					const v = entry.target
					if (entry.isIntersecting) {
						if (v.preload === 'none') v.preload = 'auto'
						safePlay(v)
					} else {
						v.pause()
					}
				})
			},
			{ rootMargin: '200px 0px', threshold: 0.1 }
		)
		cardVideos.forEach(v => cardObserver.observe(v))
	}

	// --- Hero: пауза всей секции, когда её проскроллили ---
	const heroSlides = document.querySelector('.slides-container')
	const heroVideos = document.querySelectorAll('.hero-slide__video')

	if ('IntersectionObserver' in window && heroSlides && heroVideos.length) {
		const heroObserver = new IntersectionObserver(
			entries => {
				const visible = entries[0].isIntersecting
				// Играют все слайды hero (их 3, они лёгкие) — иначе слайдер
				// переключится на замороженный кадр. Пауза — только когда hero ушла из вида.
				heroVideos.forEach(v => (visible ? safePlay(v) : v.pause()))
			},
			{ threshold: 0.05 }
		)
		heroObserver.observe(heroSlides)
	}
})

document.addEventListener('DOMContentLoaded', () => {
	const modal = document.getElementById('video-modal')
	// Если модалки нет на странице — выходим, чтобы не ловить ошибки
	if (!modal) return

	const iframe = modal.querySelector('iframe')
	const playBtns = document.querySelectorAll('.play-btn')

	// Переносим в body сразу, чтобы не перекрывало шапкой
	document.body.appendChild(modal)

	playBtns.forEach(btn => {
		btn.addEventListener('click', e => {
			e.preventDefault()
			const url = btn.getAttribute('data-video-url')

			if (url && iframe) {
				// 1. Сначала обнуляем src (на всякий случай)
				iframe.src = ''
				// 2. Вставляем ссылку — это спровоцирует автозапуск внутри iframe
				iframe.src = url

				modal.classList.add('is-active')
				document.body.style.overflow = 'hidden'
			}
		})
	})

	// Функция закрытия
	const closeModal = () => {
		modal.classList.remove('is-active')
		if (iframe) iframe.src = '' // Очищаем, чтобы видео не пело в фоне
		document.body.style.overflow = ''
	}

	modal.querySelector('.modal-close')?.addEventListener('click', closeModal)
	modal.querySelector('.modal-overlay')?.addEventListener('click', closeModal)
})
document.querySelectorAll('.faq-trigger').forEach(trigger => {
	trigger.addEventListener('click', () => {
		const parent = trigger.parentElement

		// Закрыть другие, если нужно (опционально)
		// document.querySelectorAll('.faq-item').forEach(item => {
		//   if (item !== parent) item.classList.remove('active');
		// });

		parent.classList.toggle('active')
	})
})
document.addEventListener('DOMContentLoaded', function () {
	const toggles = document.querySelectorAll('.js-mobile-submenu-toggle')

	toggles.forEach(function (toggle) {
		toggle.addEventListener('click', function (e) {
			const parent = this.closest('.mobile-nav__item-wrapper')
			const href = this.getAttribute('href')

			// Если родителя нет или ссылка - это просто заглушка "#"
			if (!parent || href === '#') {
				if (href === '#') e.preventDefault()
				parent?.classList.toggle('is-active')
				return
			}

			// ЛОГИКА: Если меню еще НЕ открыто
			if (!parent.classList.contains('is-active')) {
				e.preventDefault() // Останавливаем переход по ссылке

				// Опционально: закрываем другие открытые подменю, если нужно
				// document.querySelectorAll('.mobile-nav__item-wrapper.is-active').forEach(openItem => {
				//   openItem.classList.remove('is-active');
				// });

				parent.classList.add('is-active') // Открываем текущее
			}
			// Если меню УЖЕ открыто (is-active есть), e.preventDefault() не сработает,
			// и браузер перейдет по адресу в href.
		})
	})
})
document.addEventListener('DOMContentLoaded', function () {
	const modal = document.querySelector('#booking-modal')
	// Если модалки нет на странице — выходим, чтобы не ловить ошибки
	if (!modal) return

	const openBtns = document.querySelectorAll('.js-open-modal')
	const closeBtn = document.querySelector('.modal__close')
	const overlay = document.querySelector('.modal__overlay')

	// Открытие
	openBtns.forEach(btn => {
		btn.addEventListener('click', e => {
			e.preventDefault()
			modal.classList.add('is-active')
			document.body.style.overflow = 'hidden' // Запрещаем скролл сайта
		})
	})

	// Закрытие
	const closeModal = () => {
		modal.classList.remove('is-active')
		document.body.style.overflow = ''
	}

	closeBtn?.addEventListener('click', closeModal)
	overlay?.addEventListener('click', closeModal)

	// Закрытие по ESC
	document.addEventListener('keydown', e => {
		if (e.key === 'Escape' && modal.classList.contains('is-active')) {
			closeModal()
		}
	})
})
document.addEventListener('DOMContentLoaded', function () {
	const dateInput = document.querySelector('.js-date-picker')

	if (dateInput) {
		// Когда пользователь нажимает на поле
		dateInput.addEventListener('focus', function () {
			this.type = 'date'
			// Автоматически открываем календарь (для мобилок)
			this.showPicker()
		})

		// Когда фокус уходит
		dateInput.addEventListener('blur', function () {
			// Если дата не выбрана, возвращаем тип text, чтобы был виден placeholder
			if (!this.value) {
				this.type = 'text'
			}
		})
	}
})
;(function () {
	const header = document.getElementById('main-header')
	// Нет шапки — нечего переключать, выходим
	if (!header) return

	let ticking = false
	const onScroll = () => {
		if (ticking) return
		ticking = true
		requestAnimationFrame(() => {
			const isHomePage = document.body.classList.contains('home')
			if (isHomePage) {
				header.classList.toggle('var2', window.scrollY > 150)
			}
			ticking = false
		})
	}

	window.addEventListener('scroll', onScroll, { passive: true })
})()
