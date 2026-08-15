/* ============================================================
   antoweb — портфолио · интерактив на GSAP
   GSAP + ScrollTrigger подключены до этого файла (lib/gsap).
   Всё лениво, на transform/opacity, с учётом reduced-motion.
   ============================================================ */
(function () {
	'use strict';

	var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var hasGsap = typeof window.gsap !== 'undefined';
	var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

	if (hasGsap && window.ScrollTrigger) {
		gsap.registerPlugin(ScrollTrigger);
	}

	/* ==================== УТИЛИТЫ ==================== */
	function $(sel, ctx) {
		return (ctx || document).querySelector(sel);
	}
	function $$(sel, ctx) {
		return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
	}

	/* ==================== ГОД В ФУТЕРЕ ==================== */
	(function () {
		var yearEl = $('[data-year]');
		if (yearEl) yearEl.textContent = new Date().getFullYear();
	})();

	/* ==================== МОБИЛЬНОЕ МЕНЮ ==================== */
	(function () {
		var nav = $('[data-nav]');
		var burger = $('[data-burger]');
		var menu = $('[data-menu]');
		if (!nav || !burger || !menu) return;

		burger.addEventListener('click', function () {
			var open = nav.toggleAttribute('data-open');
			burger.setAttribute('aria-expanded', String(open));
			document.body.style.overflow = open ? 'hidden' : '';
		});
		menu.addEventListener('click', function (e) {
			if (e.target.closest('a')) {
				nav.removeAttribute('data-open');
				burger.setAttribute('aria-expanded', 'false');
				document.body.style.overflow = '';
			}
		});
	})();

	/* ==================== ШАПКА: скролл + инверсия над полосами ==================== */
	/* Работает всегда (без GSAP), иначе тёмный текст шапки был бы
	   невидим на тёмном hero. Тонкая «линия» под шапкой определяет,
	   какая полоса сейчас проходит под ней. */
	(function () {
		var nav = $('[data-nav]');
		if (!nav) return;

		nav.setAttribute('data-on-dark', ''); // старт над тёмным hero

		// data-scrolled
		var ticking = false;
		window.addEventListener(
			'scroll',
			function () {
				if (ticking) return;
				ticking = true;
				window.requestAnimationFrame(function () {
					nav.toggleAttribute('data-scrolled', window.scrollY > 20);
					ticking = false;
				});
			},
			{ passive: true }
		);

		var bands = $$('[data-band]');
		if (!bands.length || !('IntersectionObserver' in window)) return;

		function makeObserver() {
			var line = 74;
			var io = new IntersectionObserver(
				function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							var dark = entry.target.getAttribute('data-band') === 'dark';
							nav.toggleAttribute('data-on-dark', dark);
						}
					});
				},
				{
					rootMargin: '-' + line + 'px 0px -' + (window.innerHeight - line - 1) + 'px 0px'
				}
			);
			bands.forEach(function (b) {
				io.observe(b);
			});
			return io;
		}

		var observer = makeObserver();
		var rz;
		window.addEventListener(
			'resize',
			function () {
				clearTimeout(rz);
				rz = setTimeout(function () {
					observer.disconnect();
					observer = makeObserver();
				}, 200);
			},
			{ passive: true }
		);
	})();

	/* ==================== IFRAME: ЛЕНИВАЯ ЗАГРУЗКА + МАСШТАБ ==================== */
	/* Логика подгонки холста проекта под рамку браузера. */
	var BASE_WIDTH = 1440;
	var viewports = $$('[data-viewport]');

	function fitFrame(vp) {
		var frame = $('.browser__frame', vp);
		if (!frame) return;
		var w = vp.clientWidth;
		var h = vp.clientHeight;
		if (!w) return;
		var base = parseInt(frame.dataset.base, 10) || BASE_WIDTH;
		var scale = w / base;
		frame.style.setProperty('--fw', base + 'px');
		frame.style.setProperty('--fh', h / scale + 'px');
		frame.style.setProperty('--fs', scale);
	}

	function loadFrame(vp) {
		var frame = $('.browser__frame', vp);
		if (frame && frame.dataset.src && !frame.src) {
			fitFrame(vp);
			frame.addEventListener(
				'load',
				function () {
					fitFrame(vp);
					frame.classList.add('is-fitted');
				},
				{ once: true }
			);
			frame.src = frame.dataset.src;
		}
	}

	if ('IntersectionObserver' in window) {
		var frameIO = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (entry.isIntersecting) {
						loadFrame(entry.target);
						frameIO.unobserve(entry.target);
					}
				});
			},
			{ rootMargin: '300px 0px' }
		);
		viewports.forEach(function (vp) {
			if ($('.browser__frame', vp)) frameIO.observe(vp);
		});
	} else {
		viewports.forEach(loadFrame);
	}

	var rt;
	window.addEventListener(
		'resize',
		function () {
			clearTimeout(rt);
			rt = setTimeout(function () {
				viewports.forEach(fitFrame);
			}, 150);
		},
		{ passive: true }
	);

	/* «Живой просмотр» — включение интерактива в рамке */
	$$('[data-activate]').forEach(function (btn) {
		btn.addEventListener('click', function () {
			var vp = btn.closest('[data-viewport]');
			loadFrame(vp);
			vp.setAttribute('data-live', '');
		});
	});

	/* ==================== ПЛЕЙСХОЛДЕРЫ КОНТАКТОВ ==================== */
	$$('[data-edit]').forEach(function (a) {
		a.addEventListener('click', function (e) {
			if (a.getAttribute('href') === '#') {
				e.preventDefault();
				alert('Здесь будет ссылка на ' + a.dataset.edit + '. Пришли её — вставлю.');
			}
		});
	});

	/* ============================================================
	   Дальше — только анимации. Если GSAP не загрузился или включён
	   reduced-motion, показываем всё статикой и выходим.
	   ============================================================ */
	function revealAllStatic() {
		$$('[data-reveal], [data-hero]').forEach(function (el) {
			el.style.opacity = '1';
			el.style.transform = 'none';
			el.style.clipPath = 'none';
		});
		$$('.hero__line-in').forEach(function (el) {
			el.style.opacity = '1';
			el.style.transform = 'none';
		});
		$$('.section__head--reveal .section__label, .section__title--reveal .line-inner').forEach(
			function (el) {
				el.style.opacity = '1';
				el.style.transform = 'none';
				el.style.filter = 'none';
			}
		);
		// без GSAP рельсы diff-списка и процесса показываем сразу набранными
		$$('[data-rail-fill]').forEach(function (el) {
			el.style.transform = 'translateX(-50%) scaleY(1)';
		});
	}

	if (!hasGsap || reduceMotion) {
		revealAllStatic();
		// прогресс-бар всё равно оживим лёгким скриптом
		var bar = $('.scroll-progress__bar');
		if (bar) {
			window.addEventListener(
				'scroll',
				function () {
					var h = document.documentElement.scrollHeight - window.innerHeight;
					bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
				},
				{ passive: true }
			);
		}
		return;
	}

	/* ==================== ПРОГРЕСС СКРОЛЛА ==================== */
	(function () {
		var bar = $('.scroll-progress__bar');
		if (!bar) return;
		gsap.to(bar, {
			scaleX: 1,
			ease: 'none',
			scrollTrigger: { start: 0, end: 'max', scrub: 0.2 }
		});
	})();

	/* ==================== HERO: киноленточная загрузка ==================== */
	(function () {
		var hero = $('.hero');
		if (!hero) return;

		// стартовые состояния
		gsap.set('.hero__line-in', { yPercent: 105, opacity: 0 });
		gsap.set('.hero__line-num', { opacity: 0, x: -8 });
		gsap.set('[data-hero="1"], [data-hero="5"], [data-hero="6"]', { y: 24, opacity: 0 });
		gsap.set('[data-hero="7"]', { opacity: 0 });

		var tl = gsap
			.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
			.to('[data-hero="1"]', { opacity: 1, y: 0, duration: 0.6 })
			.to(
				'.hero__line-in',
				{ yPercent: 0, opacity: 1, duration: 1, stagger: 0.09, ease: 'power4.out' },
				'-=0.3'
			)
			.to(
				'.hero__line-num',
				{ opacity: 1, x: 0, duration: 0.7, stagger: 0.09, ease: 'power4.out' },
				'<'
			)
			.to(
				'[data-hero="5"], [data-hero="6"]',
				{ opacity: 1, y: 0, duration: 0.7, stagger: 0.08 },
				'-=0.5'
			)
			.to('[data-hero="7"]', { opacity: 1, duration: 0.8 }, '-=0.4');

		/* Печатающийся терминальный prompt в eyebrow */
		var typedEl = $('.hero__eyebrow-text');
		if (typedEl) {
			var full = typedEl.textContent;
			typedEl.textContent = '';
			tl.add(function () {
				var i = 0;
				var iv = setInterval(function () {
					i++;
					typedEl.textContent = full.slice(0, i);
					if (i >= full.length) clearInterval(iv);
				}, 26);
			}, 0.1);
		}
	})();

	/* ==================== МАРКИЗА (бесшовная) ==================== */
	(function () {
		var track = $('[data-marquee]');
		if (!track) return;
		// дублируем содержимое, чтобы прокрутка была бесшовной
		track.innerHTML += track.innerHTML;
		var half = track.scrollWidth / 2;
		gsap.to(track, {
			x: -half,
			duration: 26,
			ease: 'none',
			repeat: -1,
			modifiers: {
				x: function (x) {
					var v = parseFloat(x) % half;
					return v + 'px';
				}
			}
		});
	})();

	/* ==================== REVEAL СЕКЦИЙ (batch + stagger) ==================== */
	(function () {
		var items = $$('[data-reveal]');
		gsap.set(items, { y: 34 });
		ScrollTrigger.batch(items, {
			start: 'top 88%',
			once: true,
			onEnter: function (batch) {
				gsap.to(batch, {
					opacity: 1,
					y: 0,
					duration: 0.9,
					ease: 'power3.out',
					stagger: 0.1,
					overwrite: true,
					// снимаем inline-transform после появления, иначе он
					// перебивает CSS-:hover (translateY) на карточках
					clearProps: 'transform'
				});
			}
		});
	})();

	/* ==================== ЗАГОЛОВОК «О СЕБЕ»: построчный masked-reveal ====================
	   Метка выезжает первой, затем строки заголовка поднимаются из «маски»
	   со стаггером и лёгким blur→sharp — складываются в единый блок. */
	(function () {
		var title = $('[data-title-reveal]');
		if (!title) return;
		var lines = $$('.line-inner', title);
		var head = title.closest('.section__head');
		var label = head ? $('.section__label', head) : null;

		gsap.set(lines, { yPercent: 115, opacity: 0, filter: 'blur(7px)' });
		if (label) gsap.set(label, { opacity: 0, y: 18 });

		ScrollTrigger.create({
			trigger: title,
			start: 'top 85%',
			once: true,
			onEnter: function () {
				var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
				if (label) {
					tl.to(label, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' });
				}
				tl.to(
					lines,
					{
						yPercent: 0,
						opacity: 1,
						filter: 'blur(0px)',
						duration: 1.05,
						stagger: 0.13,
						// снимаем inline-стили после появления, чтобы ничего
						// не мешало последующим CSS-состояниям
						clearProps: 'filter'
					},
					label ? '-=0.3' : 0
				);
			}
		});
	})();

	/* ==================== «О СЕБЕ»: пин-стенд сборки навыков ==================== */
	/* На широких экранах (и без prefers-reduced-motion) секция фиксируется
	   на месте, а скролл переключает карточки-модули — с кольцом прогресса
	   и номером в центральной плашке, как индикатор сборки. На узких
	   экранах и при reduced-motion остаётся простой статичный список
	   (базовое состояние .skills__panel в CSS, JS его не трогает). */
	(function () {
		var root = $('[data-skills]');
		var stage = root && $('[data-skills-stage]', root);
		if (!root || !stage) return;

		var navItems = $$('[data-skills-nav-item]', root);
		var panels = $$('[data-skills-panel]', root);
		var core = $('[data-skills-core]', root);
		var face = core && $('.skills__core-face', core);
		var numEl = core && $('[data-skills-num]', core);
		var fileEl = core && $('[data-skills-file]', core);
		var pctEl = core && $('[data-skills-pct]', core);
		var ring = core && $('[data-skills-ring]', core);
		var progressFill = $('[data-skills-progress]', root);
		var countEl = $('[data-skills-count]', root);
		if (!navItems.length || !panels.length) return;

		var total = panels.length;
		var ringCirc = ring ? 2 * Math.PI * ring.r.baseVal.value : 0;
		if (ring && ringCirc) {
			ring.style.strokeDasharray = String(ringCirc);
			ring.style.strokeDashoffset = String(ringCirc);
		}

		var current = -1;

		function pad2(n) {
			return n < 10 ? '0' + n : String(n);
		}

		function setRing(pct) {
			if (!ring || !ringCirc) return;
			var clamped = Math.max(0, Math.min(100, pct));
			gsap.to(ring, {
				strokeDashoffset: ringCirc * (1 - clamped / 100),
				duration: 0.6,
				ease: 'power2.out'
			});
		}

		function setActive(idx) {
			idx = Math.max(0, Math.min(total - 1, idx));
			if (idx === current) return;
			current = idx;

			navItems.forEach(function (item, i) {
				item.classList.toggle('is-active', i === idx);
			});
			panels.forEach(function (panel, i) {
				panel.classList.toggle('is-active', i === idx);
			});

			var panel = panels[idx];
			var bw = parseFloat(panel.getAttribute('data-bw') || '0');

			if (countEl) {
				countEl.textContent = pad2(idx + 1) + ' / ' + pad2(total);
			}
			if (face) {
				gsap.killTweensOf(face);
				face.classList.add('is-swapping');
				gsap.delayedCall(0.14, function () {
					if (numEl) numEl.textContent = panel.getAttribute('data-num') || '';
					if (fileEl) fileEl.textContent = panel.getAttribute('data-file') || '';
					if (pctEl) pctEl.textContent = bw + '%';
					face.classList.remove('is-swapping');
				});
			}
			setRing(bw);
		}

		setActive(0);

		if (!hasGsap || !window.ScrollTrigger) return;

		ScrollTrigger.matchMedia({
			'(min-width: 900px) and (prefers-reduced-motion: no-preference)': function () {
				root.classList.add('skills--pinned');

				ScrollTrigger.create({
					trigger: root,
					start: 'top top+=80',
					end: function () {
						return '+=' + Math.round(window.innerHeight * 1.7);
					},
					pin: true,
					scrub: 0.6,
					snap: {
						snapTo: 1 / (total - 1),
						duration: 0.35,
						ease: 'power1.inOut'
					},
					onUpdate: function (self) {
						setActive(Math.round(self.progress * (total - 1)));
						if (progressFill) {
							gsap.set(progressFill, { scaleX: self.progress });
						}
					}
				});

				return function () {
					root.classList.remove('skills--pinned');
					current = -1;
					setActive(0);
					if (progressFill) gsap.set(progressFill, { scaleX: 0 });
				};
			}
		});
	})();

	/* ==================== «ПРОЦЕСС»: рельс-пайплайн + активные шаги ==================== */
	/* Тот же приём рельса, но здесь шаги реально последовательны — каждый
	   получает .is-done, когда прогресс скролла до него доходит: номер
	   заливается voltage, точка на рельсе загорается, статус меняется
	   с «в очереди» на «готово» — как лог настоящего деплоя. */
	(function () {
		var wrap = $('[data-steps]');
		if (!wrap) return;
		var fill = $('[data-rail-fill]', wrap);
		if (fill) {
			gsap.to(fill, {
				scaleY: 1,
				ease: 'none',
				scrollTrigger: {
					trigger: wrap,
					start: 'top 75%',
					end: 'bottom 65%',
					scrub: 0.5
				}
			});
		}
		$$('[data-step]', wrap).forEach(function (step) {
			ScrollTrigger.create({
				trigger: step,
				start: 'top 65%',
				once: true,
				onEnter: function () {
					step.classList.add('is-done');
				}
			});
		});
	})();

	/* ==================== СЧЁТЧИКИ СТАТИСТИКИ ==================== */
	(function () {
		$$('[data-count]').forEach(function (el) {
			var target = parseInt(el.getAttribute('data-count'), 10);
			var suffix = el.getAttribute('data-suffix') || '';
			var obj = { v: 0 };
			ScrollTrigger.create({
				trigger: el,
				start: 'top 90%',
				once: true,
				onEnter: function () {
					gsap.to(obj, {
						v: target,
						duration: 1.4,
						ease: 'power2.out',
						onUpdate: function () {
							el.textContent = Math.round(obj.v) + suffix;
						}
					});
				}
			});
		});
	})();

	/* ==================== БРАУЗЕР-КАРТОЧКИ: наклон + выравнивание ==================== */
	/* Карточки живут под лёгким углом (data-tilt) и распрямляются,
	   пока проходят через центр экрана — «веер» из референса. */
	(function () {
		if (!fine) return; // на тач-устройствах карточки ровные (см. CSS)
		$$('[data-tilt]').forEach(function (card) {
			var deg = parseFloat(card.getAttribute('data-tilt')) || 0;
			gsap.fromTo(
				card,
				{ rotate: deg, y: 40 },
				{
					rotate: 0,
					y: 0,
					ease: 'none',
					scrollTrigger: {
						trigger: card,
						start: 'top 92%',
						end: 'center 45%',
						scrub: 0.6
					}
				}
			);
		});
	})();

	/* ==================== ПОДСВЕТ КУРСОРА НА КАРТОЧКАХ ==================== */
	(function () {
		if (!fine) return;
		$$('[data-spot]').forEach(function (el) {
			el.addEventListener(
				'pointermove',
				function (e) {
					var r = el.getBoundingClientRect();
					el.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
					el.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
				},
				{ passive: true }
			);
		});
	})();

	/* ==================== МАГНИТНЫЕ КНОПКИ (quickTo) ==================== */
	(function () {
		if (!fine) return;
		$$('[data-magnetic]').forEach(function (el) {
			var xTo = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
			var yTo = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
			var strength = 20;
			el.addEventListener('pointermove', function (e) {
				var r = el.getBoundingClientRect();
				xTo(((e.clientX - r.left) / r.width - 0.5) * strength);
				yTo(((e.clientY - r.top) / r.height - 0.5) * strength);
			});
			el.addEventListener('pointerleave', function () {
				xTo(0);
				yTo(0);
			});
		});
	})();

	/* ==================== HERO-ЧИПЫ: parallax по курсору ==================== */
	/* Двигаем весь контейнер (transform), а idle-«парение» каждого чипа
	   остаётся на CSS-анимации — так они не спорят за transform. */
	(function () {
		if (!fine) return;
		var chips = $('[data-chips]');
		var hero = $('.hero');
		if (!chips || !hero) return;
		var xTo = gsap.quickTo(chips, 'x', { duration: 0.6, ease: 'power3.out' });
		var yTo = gsap.quickTo(chips, 'y', { duration: 0.6, ease: 'power3.out' });
		hero.addEventListener(
			'pointermove',
			function (e) {
				var r = hero.getBoundingClientRect();
				xTo(((e.clientX - r.left) / r.width - 0.5) * -30);
				yTo(((e.clientY - r.top) / r.height - 0.5) * -30);
			},
			{ passive: true }
		);
		hero.addEventListener('pointerleave', function () {
			xTo(0);
			yTo(0);
		});
	})();

	/* ==================== POSTER-СТАТЕМЕНТ: горизонтальный скролл ==================== */
	/* Гигантская строка едет влево, пока секция проходит через вьюпорт. */
	(function () {
		var track = $('[data-statement]');
		if (!track) return;
		var section = track.closest('.statement');
		function overflow() {
			return Math.max(0, track.scrollWidth - window.innerWidth);
		}
		gsap.fromTo(
			track,
			{
				x: function () {
					return overflow() * 0.14;
				}
			},
			{
				x: function () {
					return -overflow();
				},
				ease: 'none',
				scrollTrigger: {
					trigger: section,
					start: 'top bottom',
					end: 'bottom top',
					scrub: 0.4,
					invalidateOnRefresh: true
				}
			}
		);
	})();

	/* Пересчёт ScrollTrigger после подгрузки шрифтов/картинок */
	window.addEventListener('load', function () {
		ScrollTrigger.refresh();
	});
})();
